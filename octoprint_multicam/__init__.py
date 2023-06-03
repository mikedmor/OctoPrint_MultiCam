# coding=utf-8
from __future__ import absolute_import

import requests
import flask

import octoprint.plugin
import octoprint.settings
from octoprint.schema.webcam import RatioEnum, Webcam, WebcamCompatibility
from octoprint.webcams import WebcamNotAbleToTakeSnapshotException, get_webcams
from octoprint.events import Events


class MultiCamPlugin(octoprint.plugin.StartupPlugin,
                      octoprint.plugin.TemplatePlugin,
                      octoprint.plugin.BlueprintPlugin,
                      octoprint.plugin.SettingsPlugin,
                      octoprint.plugin.AssetPlugin,
                      octoprint.plugin.WebcamProviderPlugin,
                      octoprint.plugin.ReloadNeedingPlugin):

    def __init__(self):
        self.streamTimeout = 15
        self.snapshotTimeout = 15
        self.cacheBuster = True
        self.snapshotSslValidation = True
        self.webRtcServers = []

    def get_assets(self):
        return {
            "js":[
                "js/multicam.js",
                "js/multicam_settings.js"
            ],
            "css":["css/multicam.css"]
        }
    
    @octoprint.plugin.BlueprintPlugin.route("/classicwebcamstatus", methods=["GET"])
    def get_classic_webcam_status(self):
        return flask.jsonify(enabled=self.isClassicWebcamEnabled())
    
    def isClassicWebcamEnabled(self):
        plugin = self._plugin_manager.get_plugin("classicwebcam")
        return plugin is not None

    def on_after_startup(self):
        self._logger.info("MultiCam Loaded! (more: %s)" % self._settings.get(["multicam_profiles"]))
        # TODO: Need to disable the ClassicWebcam Plugin as this plugin will manage that functionality

    def get_settings_version(self):
        return 3

    def on_settings_migrate(self, target, current):
        if current is None or current < self.get_settings_version():
            self._logger.debug("Settings Migration Needed! Resetting to defaults!")
            profiles = self._settings.get(['multicam_profiles'])
            # Migrate to 2
            if current is not None and current < 2:
                for profile in profiles:
                    profile['snapshot'] = octoprint.settings.settings().get(["webcam","snapshot"])
                    profile['flipH'] = octoprint.settings.settings().get(["webcam","flipH"])
                    profile['flipV'] = octoprint.settings.settings().get(["webcam","flipV"])
                    profile['rotate90'] = octoprint.settings.settings().get(["webcam","rotate90"])
            # Migrate to 3
            if current is not None and current < 3:
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
    
    # def get_sorting_key(self, context):
    #     return None

    def get_template_configs(self):
        webcams = self.get_webcam_configurations()

        settings_templates = [dict(type="settings", template="multicam_settings.jinja2", custom_bindings=True)]
        
        def webcam_to_template(webcam):
            return dict(type="webcam", template="multicam_webcam.jinja2", custom_bindings=True)
    
        webcam_templates = list(map(webcam_to_template, list(webcams)))

        return settings_templates + webcam_templates
    
    # ~~ WebcamProviderPlugin API
    
    def get_webcam_configurations(self):
        profiles = self._settings.get(['multicam_profiles'])

        def profile_to_webcam(profile):
            flipH = profile.get("flipH", None) or False
            flipV = profile.get("flipV", None) or False
            rotate90 = profile.get("rotate90", None) or False
            snapshot = profile.get("snapshot", None)
            stream = profile.get("URL", None) or ""
            streamRatio = profile.get("streamRatio", None) or "4:3"
            canSnapshot = snapshot != "" and snapshot is not None
            name = profile.get("name", None) or "default"

            webcam = Webcam(
                name="multicam/%s" % name,
                displayName=name,
                flipH=flipH,
                flipV=flipV,
                rotate90=rotate90,
                snapshotDisplay=snapshot,
                canSnapshot=canSnapshot,
                compat=WebcamCompatibility(
                    stream=stream,
                    streamTimeout=self.streamTimeout,
                    streamRatio=streamRatio,
                    cacheBuster=self.cacheBuster,
                    streamWebrtcIceServers=self.webRtcServers,
                    snapshot=snapshot,
                    snapshotTimeout=self.snapshotTimeout,
                    snapshotSslValidation=self.snapshotSslValidation,
                ),
                extras=dict(
                    stream=stream,
                    streamTimeout=self.streamTimeout,
                    streamRatio=streamRatio,
                    cacheBuster=self.cacheBuster,
                ),
            )
            self._logger.debug(f"Webcam: {webcam}")
            return webcam
        
        return [profile_to_webcam(profile) for profile in profiles]

    def take_webcam_snapshot(self, name):
        webcam = next((webcam for webcam in self.get_webcam_configurations() if webcam.name == name), None)
        if webcam is None:
            raise WebcamNotAbleToTakeSnapshotException(name)

        snapshot_url = webcam.snapshot_url
        can_snapshot = snapshot_url is not None and snapshot_url != "http://" and snapshot_url != ""

        if not can_snapshot:
            raise WebcamNotAbleToTakeSnapshotException(name)

        with self._capture_mutex:
            self._logger.debug(f"Capturing image from {snapshot_url}")
            r = requests.get(
                snapshot_url,
                stream=True,
                timeout=self.snapshotTimeout,
                verify=self.snapshotSslValidation,
            )
            r.raise_for_status()
            return r.iter_content(chunk_size=1024)

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
                stable_branch=dict(
					name="Stable", branch="master", comittish=["master"]
				),
				prerelease_branches=[
					dict(
						name="Release Candidate",
						branch="rc",
						comittish=["rc", "master"],
					)
				],

                # update method: pip
                pip="https://github.com/mikedmor/OctoPrint_MultiCam/archive/{target_version}.zip"
            ),
            events=dict(
                on_event=[
                    Events.PLUGIN_OCTOPRINTPLUGIN_RESTART_REQUIRED,
                ]
            )
        )

__plugin_name__ = "MultiCam"
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = MultiCamPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }



