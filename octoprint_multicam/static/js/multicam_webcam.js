$(function () {
    function MultiCamViewModel(parameters) {
        console.log("DEBUGGG init WebcamView!")

        let self = this;

        self.loginState = parameters[0];
        self.settings = parameters[1];
        self.webcams = []

        self.multicam_profiles = ko.observableArray();

        self.selectedProfileIndex = ko.observable();
        self.selectedProfileIndex.subscribe(function () {
            self.updateSettings();
        });

        self.WebCamSettings = {
            streamUrl: ko.observable(undefined),
            webcam_rotate90: ko.observable(undefined),
            webcam_flipH: ko.observable(undefined),
            webcam_flipV: ko.observable(undefined),
            webcamRatioClass: ko.observable(undefined),
            webcamLoaded: ko.observable(false),
            webcamError: ko.observable(false),
        };

        self.onBeforeBinding = function () {
            self.multicam_profiles(self.settings.multicam_profiles())
        };

        self.onEventSettingsUpdated = function (payload) {
            self.multicam_profiles(self.settings.multicam_profiles())
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

        self.onWebcamVisibilityChange = function (_) {
            console.log("DEBUGG Webcam visibility change",self.webcams)
            const visible = self.webcams.find((webcam) => webcam[0].classList.contains("active"));
            const invisible = self.webcams.filter((webcam) => !webcam[0].classList.contains("active"));

            invisible.forEach((webcam) => this.unloadWebcam(webcam))
            this.loadWebcam(visible)
        };

        self.onWebcamError = function () {
            console.log("DEBUGG Webcam error")
            self.WebCamSettings.webcamError(true)
            self.WebCamSettings.webcamLoaded(false)
        }

        self.onWebcamLoad = function () {
            if (self.WebCamSettings.webcamLoaded()) return;

            console.log("DEBUGG Webcam load")
            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamLoaded(true)
        }

        self.unloadWebcam = function (webcam) {
            console.log("DEBUGG Unloading webcam",webcam)
            var webcamImage = $(webcam[0]).find("#webcam_image")
            webcamImage.attr("src", "")
            self.WebCamSettings.streamUrl("")
            self.WebCamSettings.webcamLoaded(false)
            self.WebCamSettings.webcamError(false)
        };

        self.loadWebcam = function (webcam) {
            if(webcam){
                self.WebCamSettings.streamUrl(webcam[2])
                console.log("DEBUGG Loading webcam: ", webcam)
                var webcamImage = $(webcam[0]).find("#webcam_image")

                if(webcamImage.length){
                    webcamImage.attr("src", webcam[2])
                    self.WebCamSettings.webcamLoaded(true)
                }
                else{
                    console.log("DEBUGG webcamImage not found")
                    self.onWebcamError();
                }
            }
            else{
                console.log("DEBUGG webcam not found")
                self.onWebcamError();
            }
        };

        self.onAfterBinding = function () {
            let webcams = ko.toJS(self.settings.multicam_profiles)
            self.surfaces = []

            for (const child of document.getElementById("webcam-group").children) {
                if (child.id.startsWith("webcam_plugin_multicam")) {
                    // We can use this surface, take next webcam and bind
                    const webcam = webcams.shift()
                    self.webcams.push([child, webcam.name, webcam.URL])

                    // Show name in side bar
                    document.getElementById(child.id + "_link").getElementsByTagName("a")[0].innerHTML = webcam.name
                }
            }
            console.log("DEBUGGG after bind!",webcams)
        };

    }

    OCTOPRINT_VIEWMODELS.push({
        construct: MultiCamViewModel,
        dependencies: ["loginStateViewModel", "multiCamSettingsViewModel"],
        elements: ["#multicam_container"]
    });
});
