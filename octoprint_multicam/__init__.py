# coding=utf-8
from __future__ import absolute_import
import octoprint.plugin

class MultiCamPlugin(octoprint.plugin.StartupPlugin,
                      octoprint.plugin.TemplatePlugin,
                      octoprint.plugin.SettingsPlugin,
                      octoprint.plugin.AssetPlugin):

    def on_after_startup(self):
        self._logger.info("MultiCam Loaded! (more: %s)" % self._settings.get(["multicamStream1"]))

    def get_settings_defaults(self):
        return dict(multicamStream1="")

    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=True),
            dict(type="generic", template="multicam.jinja2", custom_bindings=True)
        ]

    def get_assets(self):
        return dict(
            js=["js/multicam.js"],
            css=["css/multicam.css"]
        )

__plugin_name__ = "MultiCam"
__plugin_implementation__ = MultiCamPlugin()
