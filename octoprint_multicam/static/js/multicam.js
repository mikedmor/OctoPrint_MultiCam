$(function () {
    function MultiCamViewModel(parameters) {
        //console.log("DEBUGGG init WebcamView!")

        let self = this;

        self.loginState = parameters[0];
        self.settings = parameters[1];
        self.webcams = []

        self.multicam_profiles = ko.observableArray();

        self.WebCamSettings = {
            streamUrl: ko.observable(undefined),
            webcam_rotate90: ko.observable(false),
            webcam_flipH: ko.observable(false),
            webcam_flipV: ko.observable(false),
            webcamRatioClass: ko.observable('ratio169'),
            webcamLoaded: ko.observable(false),
            webcamError: ko.observable(false),
        };

        self.onBeforeBinding = function () {
            self.multicam_profiles(self.settings.multicam_profiles())
        };

        self.onEventSettingsUpdated = function (payload) {
            //console.log("DEBUGGG onEventSettingsUpdated - Webcam", payload)
            self.multicam_profiles(self.settings.multicam_profiles())
            self.onAfterBinding();
            self.onChangeWebcam();
        };

        self.onChangeWebcam = function () {
            //console.log("DEBUGG Webcam visibility change",self.webcams)
            const visible = self.webcams.find((webcam) => webcam[0].classList.contains("active"));
            const invisible = self.webcams.filter((webcam) => !webcam[0].classList.contains("active"));

            invisible.forEach((webcam) => {
                this.unloadWebcam(webcam);
            });
        
            this.loadWebcam(visible);
        };

        self.onWebcamError = function (webcam) {
            console.error("ERROR loading webacm: ",webcam[1].URL)
            self.WebCamSettings.webcamError(true)
            self.WebCamSettings.webcamLoaded(false)
        }

        self.onWebcamLoad = function (webcam) {
            if (self.WebCamSettings.webcamLoaded()) return;
            //console.log("DEBUGG Webcam load",webcam)
            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamLoaded(true)
        }

        self.unloadWebcam = function (webcam) {
            //console.log("DEBUGG Unloading webcam",webcam)
            var webcamElement = $(webcam[0]);
            var webcamImage = webcamElement.find(".webcam_image")

            //Turn off on handlers during unload
            webcamImage.off("load")
            webcamImage.off("error")

            //Remove the src of the webcam to unload it from the window
            webcamImage.attr("src", "")

            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamLoaded(false)
        };

        self.loadWebcam = function (webcam) {
            if(webcam){
                var webcamElement = $(webcam[0]);
                var webcamImage = webcamElement.find(".webcam_image")

                if(webcamImage.length){
                    self.WebCamSettings.webcam_rotate90(webcam[1].rotate90)
                    if(webcam[1].streamRatio === '16:9'){
                        self.WebCamSettings.webcamRatioClass('ratio169')
                    }else{
                        self.WebCamSettings.webcamRatioClass('ratio43')
                    }
                    self.WebCamSettings.webcam_flipH(webcam[1].flipH)
                    self.WebCamSettings.webcam_flipV(webcam[1].flipV)
                    webcamImage.on("load", function() {
                        self.onWebcamLoad(webcam)
                        webcamImage.off("load")
                        webcamImage.off("error")
                    })
                    webcamImage.on("error", function() {
                        self.onWebcamError(webcam);
                        webcamImage.off("load")
                        webcamImage.off("error")
                    })
                    console.log("Loading webcam: ", webcam[1].URL)
                    self.WebCamSettings.streamUrl(webcam[1].URL)
                    webcamImage.attr("src", webcam[1].URL)
                }
                else{
                    console.log("DEBUGG webcamImage not found")
                    self.onWebcamError(webcam);
                }
            }
            else{
                console.log("DEBUGG webcam not found")
                //self.onWebcamError(webcam); //This causes errors, as webcam is undefined
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
                    // linkElement.off('click').on('click', function() {
                    //     setTimeout(function() {
                    //         self.onChangeWebcam();
                    //     }, 100); // 100 milliseconds delay
                    // });
                }
            }
            //console.log("DEBUGGG after bind!",webcams)
        };

    }

    OCTOPRINT_VIEWMODELS.push({
        construct: MultiCamViewModel,
        dependencies: ["loginStateViewModel", "multiCamSettingsViewModel"],
        elements: ['#multicam']
    });
});
