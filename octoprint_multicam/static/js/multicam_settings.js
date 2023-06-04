$(function () {
    function MultiCamSettingsViewModel(parameters) {
        //console.log("DEBUGGG init SettingsView!")

        let self = this;

        self.loginState = parameters[0];
        self.settings = parameters[1];
        self.webcams = []

        self.isClassicWebcamEnabled = ko.observable(true)
        self.multicam_profiles = ko.observableArray();

        self.selectedPreviewProfileIndex = ko.observable();
        self.selectedPreviewProfileIndex.subscribe(function () {
            self.updatePreviewSettings();
        });

        self.previewWebCamSettings = {
            streamUrl: ko.observable(undefined),
            webcam_rotate90: ko.observable(undefined),
            webcam_flipH: ko.observable(undefined),
            webcam_flipV: ko.observable(undefined),
            webcamRatioClass: ko.observable(undefined),
            webcamLoaded: ko.observable(false),
            webcamError: ko.observable(false),
        };

        self.reloadChangesMade = ko.observable(false);

        self.updatePreviewSettings = function (selectedProfileIndex) {
            //console.log("DEBUGGG updatePreviewSettings - selectedProfileIndex", selectedProfileIndex)
            if (selectedProfileIndex) {
                self.selectedPreviewProfileIndex(selectedProfileIndex());
            }
            // copy current selected profile data to preview webcam settings
            let selectedProfile = self.settings.settings.plugins.multicam.multicam_profiles()[self.selectedPreviewProfileIndex()];
            if (selectedProfile) {
                self.previewWebCamSettings.streamUrl(selectedProfile.URL());
                self.previewWebCamSettings.webcam_rotate90(selectedProfile.rotate90());
                self.previewWebCamSettings.webcam_flipH(selectedProfile.flipH());
                self.previewWebCamSettings.webcam_flipV(selectedProfile.flipV());
                if (selectedProfile.streamRatio() == "4:3") {
                    self.previewWebCamSettings.webcamRatioClass("ratio43");
                } else {
                    self.previewWebCamSettings.webcamRatioClass("ratio169");
                }
                // reload stream
                self.loadWebCamPreviewStream();
            }
        };

        self.onBeforeBinding = function () {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            self.available_ratios = ["16:9", "4:3"];
        };

        self.onSettingsShown = function () {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            // Force default webcam in settings to avoid confusion
            let preSelectedProfile = 0;
            self.selectedPreviewProfileIndex(preSelectedProfile);
        };

        // self.onSettingsBeforeSave = function () {

        // };

        self.onEventSettingsUpdated = function (payload) {
            //console.log("DEBUGGG onEventSettingsUpdated - Settings", payload);
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());

            if (self.reloadChangesMade()) {
                new PNotify({
                    title: 'Restart required',
                    text: "The MultiCam plugin has been updated. Please restart OctoPrint to apply the changes.",
                    type: 'info',
                    hide: false,
                    buttons: {
                        closer: false,
                        sticker: false
                    },
                    confirm: {
                        confirm: true,
                        buttons: [{
                            text: 'Restart now',
                            addClass: 'btn-primary',
                            click: function (notice) {
                                OctoPrint.system.executeCommand("core", "restart")
                                notice.remove();
                            }
                        }, {
                            addClass: 'btn-danger',
                            click: function (notice) {
                                notice.remove();
                            }
                        }]
                    }
                });
            }
        };

        self.addMultiCamProfile = function () {
            self.settings.settings.plugins.multicam.multicam_profiles.push({
                name: ko.observable('Webcam ' + self.multicam_profiles().length),
                URL: ko.observable('http://'),
                snapshot: ko.observable('http://'),
                streamRatio: ko.observable(''),
                flipH: ko.observable(false),
                flipV: ko.observable(false),
                rotate90: ko.observable(false),
                isButtonEnabled: ko.observable(true)
            });
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            self.reloadChangesMade(true);
        };

        self.removeMultiCamProfile = function (profile) {
            self.settings.settings.plugins.multicam.multicam_profiles.remove(profile);
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            self.reloadChangesMade(true);
        };

        self.loadWebCamPreviewStream = function () {
            self.previewWebCamSettings.webcamLoaded(false);
            self.previewWebCamSettings.webcamError(false);
            let streamUrl = self.previewWebCamSettings.streamUrl();
            //console.log("loading from " + streamUrl);
            // if (snapshotUrl == null || streamUrl == null || snapshotUrl.length == 0 || streamUrl.length == 0) {
            if (streamUrl == null || streamUrl.length == 0) {
                alert("Camera-Error: Please make sure that stream-url is configured in your camera-settings")
                return
            }
            // update the new stream-image
            $(".webcam_image_preview").on('load', function () {
                //console.log("DEBUGGG webcam_image_preview - loaded")
                self.previewWebCamSettings.webcamLoaded(true);
                self.previewWebCamSettings.webcamError(false);
                $("#webcam_image_preview").off('load');
                $("#webcam_image_preview").off('error');
            });
            $(".webcam_image_preview").on('error', function () {
                //console.log("DEBUGGG webcam_image_preview - error")
                self.previewWebCamSettings.webcamLoaded(false);
                self.previewWebCamSettings.webcamError(true);
                $("#webcam_image_preview").off('load');
                $("#webcam_image_preview").off('error');
            });
            $(".webcam_image_preview").attr("src", self.previewWebCamSettings.streamUrl());
        };

        self.onAfterBinding = function () {
            $.ajax({
                url: "/plugin/multicam/classicwebcamstatus",
                type: "GET",
                success: function (response) {
                    self.isClassicWebcamEnabled = response.enabled;
                    //console.log("DEBUGGG isClassicWebcamEnabled", self.isClassicWebcamEnabled)

                    //TODO: Inform the user that the classic webcam is enabled and they should consider disabling it

                }
            });
        };

    }

    OCTOPRINT_VIEWMODELS.push({
        construct: MultiCamSettingsViewModel,
        dependencies: ["loginStateViewModel", "settingsViewModel"],
        elements: ["#settings_plugin_multicam"]
    });
});
