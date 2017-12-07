/*
 * View model for OctoPrint-Themeify
 *
 * Author: Birk Johansson
 * License: MIT
 */

$(function() {
    function ThemeifyViewModel(parameters) {
        var self = this;
        self.classId = "themeify";
        self.settings = parameters[0];

        self.ownSettings = {};
        self.customRules = [];
        //These hold the customized and built-in changed/overriden elements, respectively
        self.customizedElements = [];
        self.builtInElements = [];

        self._ownSettingsPrev = {};
        //holds subscriptions, so that they can be removed later
        self.configSubscriptions = {
            enabled: "",
            theme: ""
        };

        var oldVal = function(key) {
            return self._ownSettingsPrev[key];
        };

        self.onStartupComplete = function() {
            var htmlId = $("html").attr("id");
            //Remove styling if touch is enabled
            if (htmlId && htmlId == "touch") {
                $("html").removeClass(self.classId);
            }

            self.updateColors();
            self._updateCustomRules();
        };

        self.enable = function() {
            if (
                self.ownSettings.enabled() &&
                $.attr("html", "class") != self.classId &&
                $("html").attr("id") !== "touch"
            ) {
                $("html")
                    .addClass(self.classId)
                    .addClass(self.ownSettings.theme());
            }
        };

        self.addNewCustomRule = function() {
            var ruleObj = {
                selector: ko.observable(""),
                rule: ko.observable(""),
                value: ko.observable(""),
                enabled: ko.observable(true)
            };
            self._subscribeToCustomRules(ruleObj, "customRules");
            self.ownSettings.customRules.push(ruleObj);
        };

        self.onBeforeBinding = function() {
            self.settings = self.settings.settings;
            self.ownSettings = self.settings.plugins.themeify;
            self.customRules = self.ownSettings.customRules.extend({
                rateLimit: 50
            });
            self.onRuleToggle = self.onRuleToggle;
            self.enable();

            self._copyOwnSettings();
        };

        self.updateColors = function() {
            self._removeBuiltInStyles();
            if (self.ownSettings.enableCustomization()) {
                self.ownSettings
                    .color()
                    .filter(rule => !!rule.enabled())
                    .map((rule, i) => {
                        self._applyRule(rule, true);
                    });
            }
        };

        self._updateCustomRules = function() {
            self._removeCustomStyles();
            self.updateColors();
            if (self.ownSettings.enableCustomization()) {
                self.ownSettings
                    .customRules()
                    .filter(rule => !!rule.enabled())
                    .map(rule => {
                        self._applyRule(rule);
                    });
            }
        };

        self._applyRule = function(rule, builtIn = false) {
            var elem = $(rule.selector());
            var old = elem.css(rule.rule());
            if (builtIn) {
                self.builtInElements.push({
                    elem: elem,
                    rule: rule.rule(),
                    old
                });
            } else {
                self.customizedElements.push({
                    elem: elem,
                    rule: rule.rule(),
                    old
                });
            }
            $(rule.selector()).css(rule.rule(), rule.value());
        };

        self.clone = function(obj) {
            //get observable value
            if (typeof obj == "function") {
                return obj();
            }

            if (
                obj === null ||
                typeof obj !== "object" ||
                "isActiveClone" in obj
            )
                return obj;

            if (obj instanceof Date) var temp = new obj.constructor();
            else var temp = obj.constructor();

            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    obj["isActiveClone"] = null;
                    temp[key] = self.clone(obj[key]);
                    delete obj["isActiveClone"];
                }
            }

            return temp;
        };

        self._copyOwnSettings = function() {
            Object.keys(self.ownSettings).forEach(function(key, i) {
                self._ownSettingsPrev[key] = self.clone(self.ownSettings[key]);
            });
        };

        self.onChange = function(settingKey, newVal) {
            self.updateColors();
            self._copyOwnSettings();
        };

        self.onColorChange = function(elem, color) {
            self.updateColors();
            self._copyOwnSettings();
        };

        self.onCustomRuleChange = function(rule) {
            self.updateColors();
            if (rule.rule() && rule.selector() && rule.value()) {
                self._updateCustomRules();
            }
        };

        self.onThemeChange = function(newVal) {
            var prev = oldVal("theme");
            var hasClass = clazz => {
                return $("html").hasClass(clazz);
            };
            if (!hasClass(newVal)) {
                $("html")
                    .addClass(newVal)
                    .removeClass(prev);
            }

            self._copyOwnSettings();
        };

        self.onEnabledChange = function(newVal) {
            if (
                newVal &&
                $.attr("html", "class") != self.classId &&
                $("html").attr("id") !== "touch"
            ) {
                $("html").addClass(self.classId);
            } else {
                $("html").removeClass(self.classId);
                self._removeCustomStyles();
            }

            self._copyOwnSettings();
        };

        self.onEnableCustomizationChange = function(newVal) {
            if (
                newVal &&
                self.ownSettings.enabled() &&
                self.ownSettings.enableCustomization
            ) {
                self.updateColors();
                self._updateCustomRules();
            } else if (!newVal) {
                self._removeBuiltInStyles();
                self._removeCustomStyles();
            }
            self._copyOwnSettings();
        };

        self._removeCustomStyles = function() {
            self.customizedElements.map(elem => elem.elem.css(elem.rule, ""));
        };

        self._removeBuiltInStyles = function() {
            self.builtInElements.map(elem => elem.elem.css(elem.rule, ""));
        };

        self._removeCustomStylesByRule = function(rule) {
            $(rule.selector()).css(rule.rule(), "");
        };

        self.onRuleToggle = function(rule) {
            rule.enabled(!rule.enabled());
            //onCustomColorChange will pickup this change and update accordingly
        };

        self.ruleIsDeleteable = function(rule) {
            //deleteable if not exists
            if (!rule.deletable || typeof rule.deletable !== "function") {
                return true;
            }
            return rule.deletable();
        };

        self.onCustomRuleDelete = function(rule) {
            if (self.ruleIsDeleteable(rule)) {
                self.customRules.remove(rule);
                self._updateCustomRules();
            }
        };

        self._subscribeToCustomRules = function(rule, key, subscribeFunc) {
            var subFunc = subscribeFunc
                ? subscribeFunc.bind(this, rule)
                : self.onCustomRuleChange.bind(this, rule);
            Object.keys(rule).map(ruleAttr => {
                self.configSubscriptions[key].push(
                    rule[ruleAttr].subscribe(subFunc)
                );
            });
        };
        self.onSettingsShown = function() {
            //subscribe to changes
            Object.keys(self.ownSettings).map((key, i) => {
                if (key == "customRules") {
                    self.configSubscriptions[key] = [];
                    self.customRules().map((rule, i) => {
                        //subscribe to the attributes (selector, rule, value, enabled etc)
                        self._subscribeToCustomRules(rule, key);
                    });
                } else if (key == "color") {
                    self.configSubscriptions[key] = [];
                    var subFunc = self.onColorChange;
                    //Loop rules
                    self.ownSettings.color().map((rule, i) => {
                        //subscribe to the attributes (selector, rule, value, enabled etc)
                        self._subscribeToCustomRules(rule, key, subFunc);
                    });
                } else {
                    var onChangeFunc = self.configOnChangeMap[key]
                        ? self.configOnChangeMap[key]
                        : self.onChange.bind(this, key);
                    self.configSubscriptions[key] = self.ownSettings[
                        key
                    ].subscribe(onChangeFunc);
                }
            });
        };

        self.onSettingsHidden = function() {
            //Cleanup subscriptions
            Object.keys(self.configSubscriptions).map((key, i) => {
                if (Array.isArray(self.configSubscriptions[key])) {
                    self.configSubscriptions[key].forEach(elem => {
                        elem.dispose();
                    });
                } else {
                    self.configSubscriptions[key].dispose();
                }
            });
        };
        self.configOnChangeMap = {
            enabled: self.onEnabledChange,
            theme: self.onThemeChange,
            enableCustomization: self.onEnableCustomizationChange
        };
    }

    OCTOPRINT_VIEWMODELS.push([
        ThemeifyViewModel,
        ["settingsViewModel"],
        ["#settings_plugin_themeify"]
    ]);
});
