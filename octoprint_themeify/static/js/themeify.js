/*
 * View model for OctoPrint-Themeify
 *
 * Author: Birk Johansson
 * License: MIT
 */
$(function() {
    function ThemeifyViewModel(parameters) {
        var self = this;
        self.system = parameters[0]
        console.log(self.system)
        // assign the injected parameters, e.g.:
        // self.loginStateViewModel = parameters[0];
        // self.settingsViewModel = parameters[1];
        var $div = $("<div id='control-jog-lights' class='jog-panel'> </div>")
        var $header = $('<h1>Lights</h1>').appendTo($div);
        var $inner = $('<div></div>').appendTo($div);
        var $on = $inner.append($('<input type="button" class="btn btn-block control-box" value="Lights on" />'));
        var $off = $inner.append($('<input type="button" class="btn btn-block control-box" value="Lights off" />'));
        $div.insertAfter($('#control-jog-general'));
        // TODO: Implement your plugin's view model here.
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        ThemeifyViewModel, 

        // e.g. loginStateViewModel, settingsViewModel, ...
        [ "systemViewModel"/* "loginStateViewModel", "settingsViewModel" */ ],

        // e.g. #settings_plugin_themeify, #tab_plugin_themeify, ...
        [ /* ... */ ]
    ]);
});
