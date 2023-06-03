$(function () {
    function MultiCamViewModel(parameters) {
        console.log("DEBUGGG init WebcamView!")

        let self = this;

        self.loginState = parameters[0];
        self.settings = parameters[1];
        self.webcams = []

        self.multicam_profiles = ko.observableArray();

        self.selectedProfileIndex = ko.observable();

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
            console.log("DEBUGGG onEventSettingsUpdated - Webcam", payload)
            self.multicam_profiles(self.settings.multicam_profiles())
            self.onAfterBinding();
            self.onWebcamVisibilityChange();
        };

        self.onChangeWebcam = function () {
            console.log("DEBUGG Webcam visibility change",self.webcams)
            const visible = self.webcams.find((webcam) => webcam[0].classList.contains("active"));
            const invisible = self.webcams.filter((webcam) => !webcam[0].classList.contains("active"));

            invisible.forEach((webcam) => {
                this.unloadWebcam(webcam);
            });
        
            this.loadWebcam(visible);
        };

        self.onWebcamError = function (webcam) {
            console.log("DEBUGG Webcam error",webcam)
            var webcamElement = $(webcam[0]);

            var webcamNowebcam = webcamElement.find(".nowebcam")
            var webcamRotator = webcamElement.find(".webcam_rotator")
            var webcamError = webcamElement.find(".webcam_error")
            var webcamCurrentURL = webcamElement.find(".current_url")
            var webcamLoading = webcamElement.find(".webcam_loading")

            webcamNowebcam.show()
            webcamLoading.hide()
            webcamRotator.hide()
            webcamCurrentURL.html(webcam[1].URL)
            webcamError.show()
        }

        self.onWebcamLoad = function (webcam) {
            if (self.WebCamSettings.webcamLoaded()) return;

            console.log("DEBUGG Webcam load",webcam)
            var webcamElement = $(webcam[0]);

            var webcamImage = webcamElement.find(".webcam_image")
            var webcamNowebcam = webcamElement.find(".nowebcam")
            var webcamRotator = webcamElement.find(".webcam_rotator")
            var webcamFixedRatio = webcamElement.find(".webcam_fixed_ratio")
            
            webcamNowebcam.hide()
            if(webcam[1].rotate90){
                webcamRotator[0].classList.add('webcam_rotated')
            }else{
                webcamRotator[0].classList.remove('webcam_rotated')
            }
            webcamFixedRatio[0].classList.add(webcam[1].streamRatio)
            if(webcam[1].flipH){
                webcamImage[0].classList.add('flipH')
            }else{
                webcamImage[0].classList.remove('flipH')
            }
            if(webcam[1].flipV){
                webcamImage[0].classList.add('flipV')
            }else{
                webcamImage[0].classList.remove('flipV')
            }
            webcamRotator.show()
        }

        self.unloadWebcam = function (webcam) {
            console.log("DEBUGG Unloading webcam",webcam)
            var webcamElement = $(webcam[0]);

            var webcamImage = webcamElement.find(".webcam_image")
            var webcamCurrentURL = webcamElement.find(".current_url")
            var webcamNowebcam = webcamElement.find(".nowebcam")
            var webcamError = webcamElement.find(".webcam_error")
            var webcamRotator = webcamElement.find(".webcam_rotator")
            var webcamLoading = webcamElement.find(".webcam_loading")

            webcamImage.attr("src", "")
            webcamCurrentURL.html("")
            webcamNowebcam.show()
            webcamError.hide()
            webcamRotator.hide()
            webcamLoading.show()
        };

        self.loadWebcam = function (webcam) {
            if(webcam){

                console.log("DEBUGG Loading webcam: ", webcam)
                var webcamElement = $(webcam[0]);
                var webcamImage = webcamElement.find(".webcam_image")

                if(webcamImage.length){
                    webcamImage.on("load", function() {
                        self.onWebcamLoad(webcam)
                    })
                    webcamImage.attr("src", webcam[1].URL)
                }
                else{
                    console.log("DEBUGG webcamImage not found")
                    self.onWebcamError(webcam);
                }
            }
            else{
                console.log("DEBUGG webcam not found")
                self.onWebcamError(webcam);
            }
        };

        self.onAfterBinding = function () {
            let webcams = ko.toJS(self.settings.multicam_profiles)
            self.webcams = []
            self.surfaces = []

            for (const child of document.getElementById("webcam-group").children) {
                if (child.id.startsWith("webcam_plugin_multicam")) {
                    // We can use this surface, take next webcam and bind
                    const webcam = webcams.shift()
                    self.webcams.push([child, webcam])

                    // Show name in side bar
                    let linkElement = $(document.getElementById(child.id + "_link").getElementsByTagName("a")[0]);
                    linkElement.html(webcam.name);
                    linkElement.off('click').on('click', function() {
                        setTimeout(function() {
                            self.onChangeWebcam();
                        }, 100); // 100 milliseconds delay
                    });
                }
            }
            console.log("DEBUGGG after bind!",webcams)
        };

    }

    OCTOPRINT_VIEWMODELS.push({
        construct: MultiCamViewModel,
        dependencies: ["loginStateViewModel", "multiCamSettingsViewModel"],
        elements: ['.multicam_container']
    });
});
