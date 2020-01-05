/*
 * View model for OctoPrint-Themeify
 *
 * Author: Birk Johansson
 * License: MIT
 */

$(function() {

    function ThemeifyViewModel(parameters) {
        ko.extenders.stripQuotes = function(target, opts) {
            const result = ko.pureComputed({
                read: target,
                write: function(newVal) {
                    const stripped = newVal.replace(/['"]+/g, '')
                    target(stripped)
                }
            }).extend({ notify: 'always' });
            result(target())
            return result;
        }

        var self = this;
        self.classId = 'themeify';
        self.settings = parameters[0];

        self.ownSettings = {};
        self.customRules = [];
        //These hold the customized and built-in changed/overriden elements, respectively
        self.customizedElements = [];
        self.builtInElements = [];

        self._ownSettingsPrev = {};
        //holds subscriptions, so that they can be removed later
        self.configSubscriptions = {
            enabled: '',
            theme: '',
        };
        self.tabIcons = {};
        self.oldTabContent = {};
        var oldVal = function(key) {
            return self._ownSettingsPrev[key];
        };

        self.onStartupComplete = function() {
            var htmlId = $('html').attr('id');
            //Remove styling if touch is enabled
            if (htmlId && htmlId == 'touch') {
                $('html').removeClass(self.classId);
            }

            self.updateColors();
            self._updateCustomRules();
        };

        self.setupIcons = function() {
            self.tabIcons
                .tabs()
                .filter(tab => tab.domId() && tab.enabled())
                .map((tab, i) => {
                    const { domId, enabled, faIcon } = tab;
                    const icon = $(`<i>`, { class: faIcon() });
                    const elem$ = $(`${domId()} a`);
                    if (elem$ && elem$.closest('ul').attr('id') === 'tabs') {
                        self.oldTabContent[domId()] = $(`${domId()} a`).html();
                        elem$.html(icon);
                    } else {
                        console.warn(
                            `Themeify: Failed to add icon! ${domId()} is not a child of the tab-list!`
                        );
                    }
                });
        };

        self.restoreTabs = function() {
            self.tabIcons
                .tabs()
                .filter(tab => tab.domId())
                .map((tab, i) => {
                    const { domId, enabled, faIcon } = tab;
                    const oldContent = self.oldTabContent[domId()];
                    if (oldContent) {
                        $(`${domId()} a`).html(oldContent);
                    }
                });
        };

        self.enableBeforeLoaded = function() {
            const localTheme = localStorage.getItem('theme');
            if (localTheme) {
                $('html')
                    .addClass(self.classId)
                    .addClass(localTheme);
            }
        };

        self.enable = function() {
            if (
                self.ownSettings.enabled() &&
                $('html').attr('id') !== 'touch'
            ) {
                const theme = self.ownSettings.theme();
                localStorage.setItem('theme', theme);
                $('html')
                    .addClass(self.classId)
                    .addClass(self.ownSettings.theme());
            }
        };

        self.addNewCustomRule = function() {
            var ruleObj = {
                selector: ko.observable('').extend({ stripQuotes: true}),
                rule: ko.observable('').extend({ stripQuotes: true}),
                value: ko.observable(''),
                enabled: ko.observable(true),
            };
            self._subscribeToDictValues(ruleObj, 'customRules');
            self.ownSettings.customRules.push(ruleObj);
        };

        self.addNewIcon = function() {
            var icon = {
                domId: ko.observable('').extend({ stripQuotes: true}),
                enabled: ko.observable(true),
                faIcon: ko.observable(''),
            };
            self._subscribeToDictValues(icon, 'tabs', self.onIconChange);
            self.tabIcons.tabs.push(icon);
        };

        self.onBeforeBinding = function() {
            self.settings = self.settings.settings;
            self.ownSettings = self.settings.plugins.themeify;
            self.customRules = self.ownSettings.customRules.extend({
                rateLimit: 50,
            });
            self.onRuleToggle = self.onRuleToggle;
            self.tabIcons = {
                enabled: self.ownSettings.tabs.enableIcons,
                tabs: self.ownSettings.tabs.icons,
            };

            if (self.tabIcons.enabled()) {
                self.setupIcons();
            }

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
                    old,
                });
            } else {
                self.customizedElements.push({
                    elem: elem,
                    rule: rule.rule(),
                    old,
                });
            }
            $(rule.selector()).css(rule.rule(), rule.value());
        };

        self.clone = function(obj) {
            //get observable value
            if (typeof obj == 'function') {
                return obj();
            }

            if (
                obj === null ||
                typeof obj !== 'object' ||
                'isActiveClone' in obj
            )
                return obj;

            if (obj instanceof Date) var temp = new obj.constructor();
            else var temp = obj.constructor();

            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    obj['isActiveClone'] = null;
                    temp[key] = self.clone(obj[key]);
                    delete obj['isActiveClone'];
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
            var prev = oldVal('theme');
            var hasClass = clazz => {
                return $('html').hasClass(clazz);
            };
            if (!hasClass(newVal)) {
                localStorage.setItem('theme', newVal);
                $('html')
                    .addClass(newVal)
                    .removeClass(prev);
            }

            self._copyOwnSettings();
        };

        self.onEnabledChange = function(newVal) {
            if (newVal && $('html').attr('id') !== 'touch') {
                const theme = self.ownSettings.theme();
                $('html')
                    .addClass(self.classId)
                    .addClass(theme);
                localStorage.setItem('theme', theme);
            } else {
                $('html').removeClass(self.classId);
                localStorage.setItem('theme', false);
            }

            self._copyOwnSettings();
        };

        self.onEnableCustomizationChange = function(newVal) {
            if (newVal) {
                self.updateColors();
                self._updateCustomRules();
            } else {
                self._removeBuiltInStyles();
                self._removeCustomStyles();
            }
            self._copyOwnSettings();
        };

        self.onIconsEnableChange = function(newVal) {
            if (newVal) {
                self.setupIcons();
            } else {
                self.restoreTabs();
            }
        };

        self.onIconChange = function(icon, value, propKey) {
            if (!self.tabIcons.enabled()) return;

            if (propKey === 'enabled' && !value) {
                self.restoreTabs();
            }
            self.setupIcons();
        };

        self._removeCustomStyles = function() {
            self.customizedElements.map(elem => elem.elem.css(elem.rule, ''));
        };

        self._removeBuiltInStyles = function() {
            self.builtInElements.map(elem => elem.elem.css(elem.rule, ''));
        };

        self._removeCustomStylesByRule = function(rule) {
            $(rule.selector()).css(rule.rule(), '');
        };

        self.onRuleToggle = function(rule) {
            rule.enabled(!rule.enabled());
            //onCustomColorChange will pickup this change and update accordingly
        };

        self.ruleIsDeleteable = function(rule) {
            //deleteable if not exists
            if (!rule.deletable || typeof rule.deletable !== 'function') {
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

        self.onIconDelete = function(icon) {
            self.restoreTabs();
            self.tabIcons.tabs.remove(icon);
            self.setupIcons();
        };

        self._subscribeToDictValues = function(dict, key, subscribeFunc) {
            var subFunc = subscribeFunc
                ? subscribeFunc.bind(this, dict)
                : self.onCustomRuleChange.bind(this, dict);
            Object.keys(dict).map(dictAttr => {
                self.configSubscriptions[key].push(
                    dict[dictAttr].subscribe(val => subFunc(val, dictAttr))
                );
            });
        };
        self.onSettingsShown = function() {
            //subscribe to changes
            Object.keys(self.ownSettings).map((key, i) => {
                if (key == 'customRules') {
                    self.configSubscriptions[key] = [];
                    self.customRules().map((rule, i) => {
                        //subscribe to the attributes (selector, rule, value, enabled etc)
                        self._subscribeToDictValues(rule, key);
                    });
                } else if (key == 'color') {
                    self.configSubscriptions[key] = [];
                    var subFunc = self.onColorChange;
                    //Loop rules
                    self.ownSettings.color().map((rule, i) => {
                        //subscribe to the attributes (selector, rule, value, enabled etc)
                        self._subscribeToDictValues(rule, key, subFunc);
                    });
                } else if (key == 'tabs') {
                    const sub = (self.configSubscriptions[key] = []);
                    const { enabled, tabs } = self.tabIcons;
                    sub.push(enabled.subscribe(self.onIconsEnableChange));
                    tabs().map((tab, i) => {
                        self._subscribeToDictValues(
                            tab,
                            key,
                            self.onIconChange
                        );
                    });
                } else {
                    //Use the map for simple subscriptions
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

        //optimize "flicker" before theme is loaded
        self.enableBeforeLoaded();

        self.configOnChangeMap = {
            enabled: self.onEnabledChange,
            theme: self.onThemeChange,
            enableCustomization: self.onEnableCustomizationChange,
        };
    }

    OCTOPRINT_VIEWMODELS.push([
        ThemeifyViewModel,
        ['settingsViewModel'],
        ['#settings_plugin_themeify'],
    ]);
});
