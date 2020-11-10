import RuleStyleSheet from './RuleStyleSheet'
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

        //holds subscriptions, so that they can be removed later
        self.configSubscriptions = {
            enabled: '',
            theme: '',
        };

        self.tabIcons = {};
        self.oldTabContent = {};

        self.init = function() {
            self.customRuleStyleSheet = RuleStyleSheet.createStyleSheet('themeify-customStyleSheet', self.customRules)
            self.builtInStyles = RuleStyleSheet.createStyleSheet('themeify-builtInStyleSheet', self.ownSettings.color)
            //optimize "flicker" before theme is loaded
            self.enableBeforeLoaded();
        };


        self.onStartupComplete = function() {
            var htmlId = $('html').attr('id');
            //Remove styling if touch is enabled
            if (htmlId && htmlId == 'touch') {
                $('html').removeClass(self.classId);
            }
            console.log(self)
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

        /**
         * This is called before we have data, used to reduce 
         * initializing time before theme is applied
         */
        self.enableBeforeLoaded = function() {
            const localTheme = localStorage.getItem('theme');
            if (localTheme) {
                $('html')
                    .addClass(self.classId)
                    .addClass(localTheme);
            }
        };

        self.enableTheming = function() {
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
            self._subscribeToDictValues(ruleObj, 'customRules', self.customRules().length);
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

            self.enableTheming();
            self.customRuleStyleSheet.initWithRules(self.customRules);
            self.builtInStyles.initWithRules(self.ownSettings.color);
        };

        self.onColorChange = function(rule, valueChanged, index) {
            console.log('color change', rule, index)
            self.builtInStyles.updateRule(rule, index)
            console.log(self.builtInStyles)
        };

        self.onCustomRuleChange = function(rule, valueChanged, index) {
            if (rule.rule() && rule.selector() && rule.value()) {
               // self._updateCustomRules();
               self.customRuleStyleSheet.updateRule(rule, index)
               //self.updateRuleStyleSheet(rule, index)
            }
           // console.log()
        };

        self.onThemeChange = function(newVal) {
            const previousTheme = localStorage.getItem('theme')
    
            localStorage.setItem("theme", newVal);
            $('html')
                .addClass(newVal)
                .removeClass(previousTheme);
            
        };

        self.onEnabledChange = function(newVal) {
            if (newVal && $('html').attr('id') !== 'touch') {
                self.enableTheming();
            } else {
                const currTheme = localStorage.getItem('theme')
                $('html').removeClass(self.classId);
                $('html').removeClass(currTheme);
                localStorage.setItem('theme', false);

                self.customRuleStyleSheet.disable()
            }
        };

        self.onEnableCustomizationChange = function(newVal) {
            if (newVal) {
                self.customRuleStyleSheet.enable()
            } else {
                self.customRuleStyleSheet.disable()
            }
        };

        self.onIconsEnableChange = function(newVal) {
            if (newVal) {
                self.setupIcons();
            } else {
                self.restoreTabs();
            }
        };

        self.onIconChange = function(icon, value, i, propKey) {
            if (!self.tabIcons.enabled()) return;

            if (propKey === 'enabled' && !value) {
                self.restoreTabs();
            }
            self.setupIcons();
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

        self.onCustomRuleDelete = function(rule, index) {
            if (self.ruleIsDeleteable(rule)) {
                self.customRuleStyleSheet.deleteRule(index())
                self.customRules.remove(rule);
                //self._updateCustomRules();
            }
        };

        self.onIconDelete = function(icon) {
            self.restoreTabs();
            self.tabIcons.tabs.remove(icon);
            self.setupIcons();
        };

        self._subscribeToDictValues = function(dict, key, i, subscribeFunc) {
            var subFunc = subscribeFunc
                ? subscribeFunc.bind(this, dict)
                : self.onCustomRuleChange.bind(this, dict);
            Object.keys(dict).map(dictAttr => {
                self.configSubscriptions[key].push(
                    dict[dictAttr].subscribe(val => subFunc(val,i, dictAttr))
                );
            });
        };
        self.onSettingsShown = function() {
            //subscribe to changes
            Object.keys(self.ownSettings).map((key) => {
                if (key == 'customRules') {
                    self.configSubscriptions[key] = [];
                    self.customRules().map((rule, i) => {
                        //subscribe to the attributes (selector, rule, value, enabled etc)
                        self._subscribeToDictValues(rule, key, i);
                    });
                } else if (key == 'color') {
                    self.configSubscriptions[key] = [];
                    var subFunc = self.onColorChange;
                    //Loop rules
                    self.ownSettings.color().map((rule, i) => {
                        //subscribe to the attributes (selector, rule, value, enabled etc)
                        self._subscribeToDictValues(rule, key, i,subFunc);
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
            enableCustomization: self.onEnableCustomizationChange,
        };

        self.init();
    }
    
    OCTOPRINT_VIEWMODELS.push({
        construct: ThemeifyViewModel,
        dependencies: ['settingsViewModel'],
        elements: ['#settings_plugin_themeify'],
    });
});
