/*
 * View model for OctoPrint-Themeify
 *
 * Author: Birk Johansson
 * License: MIT
 */

var flattenObject = function(ob) {
	var toReturn = {};
	
	for (var i in ob) {
		if (!ob.hasOwnProperty(i)) continue;
		
		if ((typeof ob[i]) == 'object') {
			var flatObject = flattenObject(ob[i]);
			for (var x in flatObject) {
				if (!flatObject.hasOwnProperty(x)) continue;
				
				toReturn[i + '.' + x] = flatObject[x];
			}
		} else {
			toReturn[i] = ob[i];
		}
	}
	return toReturn;
};

var getBackgroundColor = function(selector) {
    return $(selector).css('background-color');
}

var colorToHex = function(rbgString) {
    var hex = rbgString.substring(4, rbgString.length -1).split(', ')
        .map(elem => parseInt(elem).toString(16));
    return "#"+hex.join('')
}

$(function() {
    (function($) {    
        if ($.fn.style) {
          return;
        }
      
        // Escape regex chars with \
        var escape = function(text) {
          return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        };
      
        // For those who need them (< IE 9), add support for CSS functions
        var isStyleFuncSupported = !!CSSStyleDeclaration.prototype.getPropertyValue;
        if (!isStyleFuncSupported) {
          CSSStyleDeclaration.prototype.getPropertyValue = function(a) {
            return this.getAttribute(a);
          };
          CSSStyleDeclaration.prototype.setProperty = function(styleName, value, priority) {
            this.setAttribute(styleName, value);
            var priority = typeof priority != 'undefined' ? priority : '';
            if (priority != '') {
              // Add priority manually
              var rule = new RegExp(escape(styleName) + '\\s*:\\s*' + escape(value) +
                  '(\\s*;)?', 'gmi');
              this.cssText =
                  this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
            }
          };
          CSSStyleDeclaration.prototype.removeProperty = function(a) {
            return this.removeAttribute(a);
          };
          CSSStyleDeclaration.prototype.getPropertyPriority = function(styleName) {
            var rule = new RegExp(escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?',
                'gmi');
            return rule.test(this.cssText) ? 'important' : '';
          }
        }
      
        // The style function
        $.fn.style = function(styleName, value, priority) {
          // DOM node
          var node = this.get(0);
          // Ensure we have a DOM node
          if (typeof node == 'undefined') {
            return this;
          }
          // CSSStyleDeclaration
          var style = this.get(0).style;
          // Getter/Setter
          if (typeof styleName != 'undefined') {
            if (typeof value != 'undefined') {
              // Set style property
              priority = typeof priority != 'undefined' ? priority : '';
              style.setProperty(styleName, value, priority);
              return this;
            } else {
              // Get style property
              return style.getPropertyValue(styleName);
            }
          } else {
            // Get CSSStyleDeclaration
            return style;
          }
        };
      })(jQuery);
    function ThemeifyViewModel(parameters) {
        var self = this;
        self.classId = "themeify";
        self.system = parameters[0];
        self.settings = parameters[1];
        self.testingTing = ko.observable(true);
        self.ownSettings = {};
        self.customRules = [];
        self.customizedElements = [];
        self._ownSettingsPrev = {};
        self.configSubscriptions = {
           enabled: "",
           theme: ""            
        }

        var oldVal = function(key) {
            return self._ownSettingsPrev[key];
        }
      
        console.log(self.system)
        console.log(self.settings);

        self.onStartupComplete = function() {
            var htmlId = $("html").attr('id');
            //Remove styling if touch is enabled
            if(htmlId && htmlId== 'touch') {
              //  self.ownSettings.enabled("false");
                $("html").removeClass(self.classId)
            }
        }

        self.enable = function() {
            if(self.ownSettings.enabled() && $.attr('html', 'class') != self.classId && $("html").attr("id") !== 'touch') {
              //  console.log(self.ownSettings.theme())
                $("html").addClass(self.classId).addClass(self.ownSettings.theme());
            }
        }

        self.addNewCustomRule = function() {
            console.log("ADD")
            var nrRules = Object.keys(self.ownSettings.customRules).length;
            var ruleObj = {
                    selector: ko.observable(""),
                    rule: ko.observable(""),
                    value: ko.observable("")
            }
            var newRule = self.ownSettings.customRules[nrRules] = ruleObj;
            self.customRules().push(ruleObj);
        }

        self.onBeforeBinding = function() {
            self.settings = self.settings.settings;
            self.ownSettings = self.settings.plugins.themeify;
            console.log(self.ownSettings)
            self.customRules = ko.computed(function() {
                 var a = Object.keys(self.ownSettings.customRules).map((key, i) => {
                     var curr = self.ownSettings.customRules;
                     return {
                         selector: curr[key].selector,
                         rule: curr[key].rule,
                         value: curr[key].value
                     }
                 })
                 return ko.observableArray(a);
             })
            // console.log(self.customRules());
             console.log(self.ownSettings)
  //          self.ownSettings.customRules["test"] = ko.observable("asf");
            //setup custom colors
           // self.ownSettings.color = {
                //navbar_inner: ko.observable('red')
          //  }
          console.log(self.customRules());
          console.log(self.ownSettings)
            self.enable();
            self.setupColors();
            self.updateColors();
            self._updateCustomRules();
            self._copyOwnSettings();
        }

        self.updateColors = function() {
            if(self.ownSettings.enableCustomization()) {
                Object.keys(self.ownSettings.color).map((key, i) => {
                    var val = self.ownSettings.color[key]();
                    var elem = $("."+key.replace(/_/g,"-"));
                    self.customizedElements.push({elem: elem, rule: 'background-color'});
                    elem.style('background-color', val, 'important');
                });
            }
        }

        self._updateCustomRules = function() {
            self._removeCustomStyles();
            if(self.ownSettings.enableCustomization()) {
                Object.keys(self.ownSettings.customRules).map(key => {
                    var rule = self.ownSettings.customRules[key];
                   
                    try {
                        var elem = $(rule.selector());
                        self.customizedElements.push({elem: elem, rule: rule.rule()});
                        $(rule.selector()).style(rule.rule(), rule.value(), 'important');
                    } catch(error) {
                    }
                    
                });
            }
        }
        
        self.setupColors = function() {
            console.log("SETUP COLORS")
            console.log(self.ownSettings.color)
            Object.keys(self.ownSettings.color).map((key, i) => {
                var val = colorToHex($("."+key.replace(/_/g,"-")).css('background-color'));
                if(!self.ownSettings.color[key]()) {
                    self.ownSettings.color[key](val)
                    console.log("ASF")
                }
                    
            });
            console.log(self.ownSettings.color)
        }
        

        self.clone = function(obj) {
            //get observable value
            if(typeof(obj) == "function") {
                return obj();
            }

            if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
              return obj;
              
            if (obj instanceof Date)
              var temp = new obj.constructor();
            else
              var temp = obj.constructor();
      
            for (var key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                obj['isActiveClone'] = null;
                temp[key] = self.clone(obj[key]);
                delete obj['isActiveClone'];
              }
            }
      
            return temp;
        }

        self._copyOwnSettings = function() {
            Object.keys(self.ownSettings).forEach(function(key, i) {
                self._ownSettingsPrev[key] = self.clone(self.ownSettings[key]);
            });
        }

        self.onChange = function(settingKey, newVal) {
            self.updateColors();
            self._copyOwnSettings();
            self._copyOwnSettings();
        }

        self.onColorChange = function(elem, color) {
            console.log(self.ownSettings.color)
            console.log(elem)
            console.log(color)
            self.updateColors();
            self._copyOwnSettings();
        }

        self.onCustomRuleChange = function(key) {
            self._updateCustomRules();
        }

        self.onThemeChange = function(newVal) {
            console.log()
            var prev = oldVal('theme');
            console.log(prev)
            var hasClass = function(clazz) { return $("html").hasClass(clazz)};
            if(!hasClass(newVal)) {
                $("html").addClass(newVal).removeClass(prev);
            }

            self._copyOwnSettings();
        }

        self.onEnabledChange = function(newVal) {
            if(newVal && $.attr('html', 'class') != self.classId && $("html").attr("id") !== 'touch') {
                $("html").addClass(self.classId);
            } else {
                $("html").removeClass(self.classId);
                self._removeCustomStyles();
            }

            self._copyOwnSettings();
        }

        self.onEnableCustomizationChange = function(newVal) {
            if(newVal && self.ownSettings.enabled() && self.ownSettings.enableCustomization) {
                self.updateColors();
                self._updateCustomRules();
            } else if(!newVal) {
                self._removeCustomStyles();
            }
            self._copyOwnSettings();
        }

        self._removeCustomStyles = function() {
            self.customizedElements.map((elem) => elem.elem.style(elem.rule, ""));
        }

        self.onSettingsShown = function() {
           
            Object.keys(self.ownSettings).map((key, i) => {
                if(key == "color") {
                    const flattened = flattenObject(self.ownSettings[key]);
                    Object.keys(flattened).map((key, i) => {
                        self.configSubscriptions[key] = flattened[key].subscribe(self.onColorChange.bind(this, key));
                    });
                } else if(key == "customRules") {
                    const customRules = self.ownSettings[key];
                    self.configSubscriptions[key] = [];
                    //Loop rules
                    Object.keys(customRules).map((ruleId, i) => {
                        const rule = customRules[ruleId];
                        console.log(rule)
                        //subscribe to the attributes (selector, rule, value)
                        Object.keys(rule).map(ruleAttr => {
                            self.configSubscriptions[key].push(rule[ruleAttr].subscribe(self.onCustomRuleChange.bind(this, ruleId)));
                        });
                    }); 
                } else {
                    var onChangeFunc = self.configOnChangeMap[key] ? self.configOnChangeMap[key] : self.onChange.bind(this, key);
                    self.configSubscriptions[key] = self.ownSettings[key].subscribe(onChangeFunc);
                }
                
            })
        }

        self.onSettingsHidden = function() {
            //Cleanup subscriptions
            Object.keys(self.configSubscriptions).map((key, i) => {
                if(Array.isArray(self.configSubscriptions[key])) {
                    self.configSubscriptions[key].forEach(elem => {
                        elem.dispose();
                    })
                } else {
                    self.configSubscriptions[key].dispose();
                }
            });
        }
        self.configOnChangeMap = {
            enabled: self.onEnabledChange,
            theme: self.onThemeChange,
            enableCustomization: self.onEnableCustomizationChange
        }        
    }

    OCTOPRINT_VIEWMODELS.push([
        ThemeifyViewModel, 
        // e.g. loginStateViewModel, settingsViewModel, ...
        [ "systemViewModel", "settingsViewModel"/* "loginStateViewModel", "settingsViewModel" */ ],
        // e.g. #settings_plugin_themeify, #tab_plugin_themeify, ...
        [ "#settings_plugin_themeify"]
    ]);
});
