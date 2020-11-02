# coding=utf-8
from __future__ import absolute_import
import octoprint.plugin
import time


class ThemeifyPlugin(octoprint.plugin.StartupPlugin,
                     octoprint.plugin.AssetPlugin,
                     octoprint.plugin.SettingsPlugin,
                     octoprint.plugin.TemplatePlugin):

    def on_after_startup(self):
        self._logger.info("Themeify initialized.")

    def get_assets(self):
        return dict(
            less=["less/base.less"],
            css=["dist/themeify.min.css", "css/includes.css"],
            js=["dist/themeify.min.js"]
        )

    def get_settings_defaults(self):
        return dict(
            enabled=True,
            enableCustomization=False,
            theme='discorded',
            color=[dict(
                selector='.navbar-inner',
                rule="background",
                value="#2f3136",
                enabled=False,
                deletable=False)],
            customRules=[
                dict(
                    selector='.navbar-inner',
                    rule="background-color",
                    value="#2f3136",
                    enabled=False),
                dict(
                    selector='.accordion',
                    rule="background-color",
                    value="#2f3136",
                    enabled=False)
            ],
            tabs=dict(
                enableIcons=False,
                icons=[
                    dict(
                        domId="#temp_link",
                        enabled=True,
                        faIcon="fa fa-line-chart"
                    ),
                    dict(
                        domId="#control_link",
                        enabled=True,
                        faIcon="fa fa-gamepad",
                    ),
                    dict(
                        domId="#gcode_link",
                        enabled=True,
                        faIcon="fa fa-object-ungroup"
                    ),
                    dict(
                        domId="#term_link",
                        enabled=True,
                        faIcon="fa fa-terminal"
                    )],
            )
        )

   # def on_settings_save(self, data):
   #     self._logger.log(data)
   #     octoprint.plugin.SettingsPlugin.on_settings_save(self, data)

    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=True)
        ]

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
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = ThemeifyPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
