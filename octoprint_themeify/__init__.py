# coding=utf-8
from __future__ import absolute_import
import octoprint.plugin
import time

class ThemeifyPlugin(octoprint.plugin.StartupPlugin, 
    octoprint.plugin.AssetPlugin,
    octoprint.plugin.SettingsPlugin,
    octoprint.plugin.TemplatePlugin):
    
    def on_after_startup(self):
        print "Themeify initialized."

    def get_assets(self):
	    return dict(
           less=["less/themeify.less"],
           css=["css/themeify.css"],
            js=["js/themeify.js"]
	)

__plugin_name__ = "Themeify"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = ThemeifyPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}
