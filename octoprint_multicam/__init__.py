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
        self._logger.info("MultiCam Loaded! (more: %s)" % self._settings.get(["multicam_profiles"]))

    def get_settings_version(self):
        return 3

    def on_settings_migrate(self, target, current=None):
        if current is None or current < self.get_settings_version():
            self._logger.debug("Settings Migration Needed! Resetting to defaults!")
            profiles = self._settings.get(['multicam_profiles'])
            # Migrate to 2
            if current < 2:
                for profile in profiles:
                    profile['snapshot'] = octoprint.settings.settings().get(["webcam","snapshot"])
                    profile['flipH'] = octoprint.settings.settings().get(["webcam","flipH"])
                    profile['flipV'] = octoprint.settings.settings().get(["webcam","flipV"])
                    profile['rotate90'] = octoprint.settings.settings().get(["webcam","rotate90"])
            # Migrate to 3
            if current < 3:
                for profile in profiles:
                    profile['streamRatio'] = octoprint.settings.settings().get(["webcam","streamRatio"])
            # If script migration is up to date we migrate, else we reset to default
            if (self.get_settings_version() == 3):
                self._settings.set(['multicam_profiles'], profiles)
            else:
                # Reset plug settings to defaults.
                self._settings.set(['multicam_profiles'], self.get_settings_defaults()["multicam_profiles"])

    def get_settings_defaults(self):
        return dict(multicam_profiles=[{
            'name':'Default',
            'URL': octoprint.settings.settings().get(["webcam","stream"]),
            'snapshot': octoprint.settings.settings().get(["webcam","snapshot"]),
            'streamRatio': octoprint.settings.settings().get(["webcam","streamRatio"]),
            'flipH':octoprint.settings.settings().get(["webcam","flipH"]),
            'flipV':octoprint.settings.settings().get(["webcam","flipV"]),
            'rotate90':octoprint.settings.settings().get(["webcam","rotate90"]),
            'isButtonEnabled':'true'}])

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

    ##~~ Exposed as helper
    def get_webcams(self):
        data = []
        for profile in enumerate(self._settings.get(['multicam_profiles'])):
            #if index==0:
            #    data.push({'name': 'Default', 'stream_url': self._settings.global_get(["webcam","stream"]), 'snapshot_url': self._settings.global_get(["webcam", "snapshot"])})
            #else:
           data.append({'name': profile['name'], 'stream': profile['URL'], 'snapshot': profile['snapshot'],'streamRatio': profile['streamRatio'],'flipH':profile['flipH'],'flipV':profile['flipV'],'rotate90':profile['rotate90']})
        return data

__plugin_name__ = "MultiCam"
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = MultiCamPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }



