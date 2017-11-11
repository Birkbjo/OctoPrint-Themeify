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
__plugin_implementation__ = ThemeifyPlugin()