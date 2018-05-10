# coding=utf-8
from __future__ import absolute_import
import octoprint.plugin
import octoprint.settings

class MultiCamPlugin(octoprint.plugin.StartupPlugin,
                      octoprint.plugin.TemplatePlugin,
                      octoprint.plugin.SettingsPlugin,
                      octoprint.plugin.AssetPlugin,
                      octoprint.plugin.ReloadNeedingPlugin):

    def get_assets(self):
        return dict(
            js=["js/multicam.js"],
            css=["css/multicam.css"]
        )

    def on_after_startup(self):
        self._logger.info("MultiCam Loaded! (more: %s)" % self._settings.get(["multicamStream1"]))

    def get_settings_version(self):
        return 1

    def on_settings_migrate(self, target, current=None):
        if current is None or current < self.get_settings_version():
            self._logger.debug("Settings Migration Needed! Resetting to defaults!")
            # Reset plug settings to defaults.
            self._settings.set(['multicam_profiles'], self.get_settings_defaults()["multicam_profiles"])

    def get_settings_defaults(self):
        return dict(multicam_profiles=[{'name':'Default','URL':octoprint.settings.settings().get(["webcam","stream"]), 'isButtonEnabled':'true'}])

    def on_settings_save(self, data):
        old_profiles = self._settings.get(["multicam_profiles"])

        octoprint.plugin.SettingsPlugin.on_settings_save(self, data)

        new_profiles = self._settings.get(["multicam_profiles"])
        if old_profiles != new_profiles:
            self._logger.info("profiles changed from {old_profiles} to {new_profiles}".format(**locals()))
            flattened_profiles = []
            for profiles in new_profiles:
                flattened_profiles.append(profiles['name'])
            self._settings.global_set(["name","URL","isButtonEnabled"],flattened_profiles)
            self._plugin_manager.send_plugin_message(self._identifier, dict(reload=True))

    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=True),
            dict(type="generic", template="multicam.jinja2", custom_bindings=True)
        ]

    ##~~ Softwareupdate hook
    def get_version(self):
        return self._plugin_version

    def get_update_information(self):
        return dict(
            multicam=dict(
                displayName="MultiCam",
                displayVersion=self._plugin_version,

                # version check: github repository
                type="github_release",
                user="mikedmor",
                repo="OctoPrint_MultiCam",
                current=self._plugin_version,

                # update method: pip
                pip="https://github.com/mikedmor/OctoPrint_MultiCam/archive/{target_version}.zip"
            )
        )

__plugin_name__ = "MultiCam"

def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = MultiCamPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }



