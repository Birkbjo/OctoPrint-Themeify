/*
 * View model for OctoPrint-Themeify
 *
 * Author: Birk Johansson
 * License: MIT
 */
$(function() {
    function ThemeifyViewModel(parameters) {
        var self = this;
        var classId = "themeify";
        self.system = parameters[0]
        $("html").addClass(classId)
        self.onStartupComplete = function() {
            var htmlId = $("html").attr('id');
            //Remove styling if touch is enabled
            if(htmlId && htmlId== 'touch') {
                $("html").removeClass(classId)
            }
        }
    }

    OCTOPRINT_VIEWMODELS.push([
        ThemeifyViewModel, 
        // e.g. loginStateViewModel, settingsViewModel, ...
        [ "systemViewModel"/* "loginStateViewModel", "settingsViewModel" */ ],
        // e.g. #settings_plugin_themeify, #tab_plugin_themeify, ...
        [ /* ... */ ]
    ]);
});
