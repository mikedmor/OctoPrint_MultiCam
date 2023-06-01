$(function () {
    function MultiCamViewModel(parameters) {


        console.log("DEBUGGG init!")


        let self = this;

        self.settings = parameters[0];
        self.control = parameters[1];
        self.webcams = []

        self.multicam_profiles = ko.observableArray();
        self.enabled_buttons = ko.observableArray();

        self.selectedPreviewProfileIndex = ko.observable();
        self.selectedPreviewProfileIndex.subscribe(function () {
            self.updatePreviewSettings();
        });

        self.previewWebCamSettings = {
            streamUrl: ko.observable(undefined),
            webcam_rotate90: ko.observable(undefined),
            webcam_flipH: ko.observable(undefined),
            webcam_flipV: ko.observable(undefined),
            webcamRatioClass: ko.observable(undefined)
        };

        self.updatePreviewSettings = function (selectedProfileIndex) {
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
                self.loadWebCamStream();
            }
        };

        self.onBeforeBinding = function () {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            self.available_ratios = ["16:9", "4:3"];
        };

        self.onSettingsShown = function () {
            // Force default webcam in settings to avoid confusion
            let preSelectedProfile = 0;
            self.selectedPreviewProfileIndex(preSelectedProfile);
            self.loadWebcam(self.multicam_profiles()[preSelectedProfile]);
        };

        self.onSettingsBeforeSave = function () {
            // Update multicam profile for default webcam
            ko.utils.arrayForEach(self.settings.settings.plugins.multicam.multicam_profiles(), function (item, index) {
                if (index == 0 && item.URL() != $('#settings-webcamStreamUrl').val()) {
                    console.log("Changes Detected in Webcam settings : URL");
                    item.URL($('#settings-webcamStreamUrl').val());
                }
                if (index == 0 && item.snapshot() != $('#settings-webcamSnapshotUrl').val()) {
                    console.log("Changes Detected in Webcam settings : Snapshot URL");
                    item.snapshot($('#settings-webcamSnapshotUrl').val());
                }
                if (index == 0 && item.streamRatio() != $('#settings-webcamStreamRatio').val()) {
                    console.log("Changes Detected in Webcam settings : stream ratio");
                    item.streamRatio($('#settings-webcamStreamRatio').val());
                }
                if (index == 0 && item.flipH() != $('#settings-webcamFlipH').is(':checked')) {
                    console.log("Changes Detected in Webcam settings : FlipH");
                    item.flipH($('#settings-webcamFlipH').is(':checked'));
                }
                if (index == 0 && item.flipV() != $('#settings-webcamFlipV').is(':checked')) {
                    console.log("Changes Detected in Webcam settings : FlipV");
                    item.flipV($('#settings-webcamFlipV').is(':checked'));
                }
                if (index == 0 && item.rotate90() != $('#settings-webcamRotate90').is(':checked')) {
                    console.log("Changes Detected in Webcam settings : Rotate90");
                    item.rotate90($('#settings-webcamRotate90').is(':checked'));
                }
            });
            /** To be deleted
             *  Not sure why it was there, but it was causing bugs with multiple times configuration editing
             *  Fixed by the direct use of self.settings.settings.plugins.multicam.multicam_profiles()
             *     instead of self.multicam_profiles())
            //console.log("Multicam_profiles:", self.multicam_profiles());
            //self.settings.settings.plugins.multicam.multicam_profiles(self.multicam_profiles.slice(0));
            //self.onAfterTabChange();
            */
        };

        self.onEventSettingsUpdated = function (payload) {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
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
        };

        self.removeMultiCamProfile = function (profile) {
            self.settings.settings.plugins.multicam.multicam_profiles.remove(profile);
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        // self.loadWebcam = function (profile, event) {
            // // Set webcam observables to selected webcam
            // self.settings.webcam_streamUrl(ko.toJS(profile).URL);
            // self.settings.webcam_snapshotUrl(ko.toJS(profile).snapshot);
            // self.settings.webcam_streamRatio(ko.toJS(profile).streamRatio);
            // self.settings.webcam_flipH(ko.toJS(profile).flipH);
            // self.settings.webcam_flipV(ko.toJS(profile).flipV);
            // self.settings.webcam_rotate90(ko.toJS(profile).rotate90);
            // // Force reload of webcam URL with new parameters
            // let selected = OctoPrint.coreui.selectedTab;
            // OctoPrint.coreui.selectedTab = "#control";
            // self.control._enableWebcam();
            // OctoPrint.coreui.selectedTab = selected;
            // // Update buttons
            // ko.utils.arrayForEach(self.multicam_profiles(), function (item) {
            //     if(profile===item) {
            //         item.isButtonEnabled(false);
            //     } else {
            //         item.isButtonEnabled(true);
            //     }
            // });
        // };

        self.loadWebCamStream = function () {
            // let streamUrl = self.previewWebCamSettings.streamUrl();
            // console.error("loadinng from " + streamUrl);
            // // if (snapshotUrl == null || streamUrl == null || snapshotUrl.length == 0 || streamUrl.length == 0) {
            // if (streamUrl == null ||  streamUrl.length == 0) {
            //     alert("Camera-Error: Please make sure that stream-url is configured in your camera-settings")
            //     return
            // }
            // // update the new stream-image
            // $("#multicam-videoStream").attr("src", self.previewWebCamSettings.streamUrl());
        }

        self.onWebcamVisibilityChange = function (_) {
            console.log("DEBUGG Webcam visibility change")
            const visible = self.webcams.find((webcam) => webcam[0].classList.contains("active"));
            const invisible = self.webcams.filter((webcam) => !webcam[0].classList.contains("active"));

            invisible.forEach((webcam) => this.unloadWebcam(webcam))
            this.loadWebcam(visible)
        };

        self.unloadWebcam = function (webcam) {
            console.log("DEBUGG Unloading webcam: ", webcam[0], "=>", webcam[1])

        };

        self.loadWebcam = function (webcam) {
            console.log("DEBUGG Loading webcam: ", webcam[0], "=>", webcam[1])
        };

        self.onAfterBinding = function () {
            let webcams = ko.toJS(self.settings.settings.plugins.multicam.multicam_profiles)
            self.surfaces = []

            for (const child of document.getElementById("webcam-group").children) {
                if (child.id.startsWith("webcam_plugin_multicam")) {
                    // We can use this surface, take next webcam and bind
                    const webcam = webcams.shift()
                    self.webcams.push([child, webcam.name])

                    // Show name in side bar
                    document.getElementById(child.id + "_link").getElementsByTagName("a")[0].innerHTML = webcam.name
                }
            }
            console.log("DEBUGGG after bind!")
        };

    }

    OCTOPRINT_VIEWMODELS.push([
        MultiCamViewModel,
        ["settingsViewModel", "controlViewModel"],
        ["#settings_plugin_multicam_form", "#camControl"]
    ]);
});
