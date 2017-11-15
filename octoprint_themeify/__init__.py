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

    def get_update_information(self):
        # Define the configuration for your plugin to use with the Software Update
        # Plugin here. See https://github.com/foosel/OctoPrint/wiki/Plugin:-Software-Update
        # for details.
        return dict(
            themeify=dict(
                displayName="Themeify",
                displayVersion=self._plugin_version,

                # version check: github repository
                type="github_release",
                user="birkbjo",
                repo="OctoPrint-Themeify",
                current=self._plugin_version,

                # update method: pip
                pip="https://github.com/birkbjo/OctoPrint-Themeify/archive/{target_version}.zip"
            )
        )

__plugin_name__ = "Themeify"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = ThemeifyPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
