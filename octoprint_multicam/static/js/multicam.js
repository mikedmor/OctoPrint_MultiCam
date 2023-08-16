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
            streamUrlEscaped: ko.pureComputed(function () {
                return encodeURI(self.WebCamSettings.streamUrl());
            }),
            webcamLoaded: ko.observable(false),
            webcamStreamType: ko.pureComputed(function () {
                try {
                    return self._determineWebcamStreamType(self.WebCamSettings.streamUrlEscaped());
                } catch (e) {
                    console.error("Error:",e);
                    self.WebCamSettings.webcamError(true);
                    return "mjpg";
                }
            }),
            webcamMjpgEnabled: ko.observable(false),
            webcamWebRTCEnabled: ko.observable(false),
            webcamHlsEnabled: ko.observable(false),
            webcam_rotate90: ko.observable(false),
            webcam_flipH: ko.observable(false),
            webcam_flipV: ko.observable(false),
            webcamRatioClass: ko.observable('ratio169'),
            webcamError: ko.observable(false),
            webcamMuted: ko.observable(true),
            webRTCPeerConnection: ko.observable(null),
            webcamElementHls: ko.observable(null),
            webcamElementWebrtc: ko.observable(null)
        };

        // Octoprint Hooks
        self.onBeforeBinding = function () {
            self.multicam_profiles(self.settings.multicam_profiles())
        };

        self.onAfterBinding = function () {
            let webcams = ko.toJS(self.settings.multicam_profiles)
            self.webcams = []
            self.surfaces = []
            if ($("#webcam-group").children().length == 0 || OctoPrint.coreui.viewmodels.settingsViewModel.webcam_webcamEnabled()){
                return false;
            }
            for (const child of document.getElementById("webcam-group").children) {
                if (child.id.startsWith("webcam_plugin_multicam")) {
                    // We can use this surface, take next webcam and bind
                    const webcam = webcams.shift()
                    self.webcams.push([child, webcam])

                    // Show name in side bar
                    let linkElement = $(document.getElementById(child.id + "_link").getElementsByTagName("a")[0]);
                    linkElement.html(webcam.name);
                }
            }
        };

        self.onEventSettingsUpdated = function (payload) {
            //console.log("DEBUGGG onEventSettingsUpdated - Webcam", payload)
            self.multicam_profiles(self.settings.multicam_profiles())
            self.onAfterBinding();
            self.onChangeWebcam();
        };

        // Helper functions
        self._syncWebcamElements = function (webcam) {
            var webcamElement = $(webcam[0]);
            self.WebCamSettings.webcamElementHls = webcamElement.find(".webcam_hls").first();
            self.WebCamSettings.webcamElementWebrtc = webcamElement.find(".webcam_webrtc").first();
        };

        self._getActiveWebcamVideoElement = function () {
            if (self.WebCamSettings.webcamWebRTCEnabled()) {
                return self.WebCamSettings.webcamElementWebrtc[0];
            } else {
                return self.WebCamSettings.webcamElementHls[0];
            }
        };
        
        self._determineWebcamStreamType = function (streamUrl) {
            if (!streamUrl) {
                throw "Empty streamUrl. Cannot determine stream type.";
            }

            var parsed = validateWebcamUrl(streamUrl);
            if (!parsed) {
                throw "Invalid streamUrl. Cannot determine stream type.";
            }

            if (parsed.protocol === "webrtc:" || parsed.protocol === "webrtcs:") {
                // console.log("DEBUGG Webcam stream type: webrtc")
                return "webrtc";
            }

            var lastDotPosition = parsed.pathname.lastIndexOf(".");
            if (lastDotPosition !== -1) {
                var extension = parsed.pathname.substring(lastDotPosition + 1);
                if (extension.toLowerCase() === "m3u8") {
                    // console.log("DEBUGG Webcam stream type: hls")
                    return "hls";
                }
            }

            // By default, 'mjpg' is the stream type.
            // console.log("DEBUGG Webcam stream type: mjpg")
            return "mjpg";
        };

        self._switchToMjpgWebcam = function (webcam) {
            var webcamElement = $(webcam[0]);
            var webcamImage = webcamElement.find(".webcam_image")
            var currentSrc = webcamImage.attr("src");

            var newSrc = self.WebCamSettings.streamUrlEscaped();

            if (currentSrc != newSrc) {
                //if (self.settings.cacheBuster()) {
                if (false) {
                    if (newSrc.lastIndexOf("?") > -1) {
                        newSrc += "&";
                    } else {
                        newSrc += "?";
                    }
                    newSrc += new Date().getTime();
                }

                self.WebCamSettings.webcamLoaded(false);
                self.WebCamSettings.webcamError(false);
                webcamImage.attr("src", newSrc);

                self.WebCamSettings.webcamHlsEnabled(false);
                self.WebCamSettings.webcamMjpgEnabled(true);
                self.WebCamSettings.webcamWebRTCEnabled(false);
            }
        };

        self._switchToHlsWebcam = function (webcam) {
            var video = self.WebCamSettings.webcamElementHls[0];
            video.onresize = function() {
                self._updateVideoTagWebcamLayout(webcam);
            };

            // Ensure WebRTC is unloaded
            if (self.WebCamSettings.webRTCPeerConnection != null) {
                try {
                    if (typeof self.WebCamSettings.webRTCPeerConnection.close === 'function') {
                        self.WebCamSettings.webRTCPeerConnection.close();
                    }
                } catch(e) {
                    console.error("Error: unable to close WebRTC connection", e)
                }
                self.WebCamSettings.webRTCPeerConnection = null;
            }

            // Check for native playback options: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType
            if (
                video != null &&
                typeof video.canPlayType != undefined &&
                video.canPlayType("application/vnd.apple.mpegurl") == "probably"
            ) {
                // console.log("DEBUGG Using native HLS playback")
                video.src = self.streamUrlEscaped();
            } else if (Hls.isSupported()) {
                // console.log("DEBUGG Using HLS.js playback")
                self.hls = new Hls();
                self.hls.loadSource(self.WebCamSettings.streamUrlEscaped());
                self.hls.attachMedia(video);
            }else{
                console.error("Error: HLS not supported")
            }

            self.WebCamSettings.webcamMjpgEnabled(false);
            self.WebCamSettings.webcamHlsEnabled(true);
            self.WebCamSettings.webcamWebRTCEnabled(false);
        };

        self._switchToWebRTCWebcam = function (webcam) {
            if (!isWebRTCAvailable()) {
                return;
            }
            var video = self.WebCamSettings.webcamElementWebrtc[0];
            video.onresize = function() {
                self._updateVideoTagWebcamLayout(webcam);
            };

            // Ensure HLS is unloaded
            if (self.hls != null) {
                self.WebCamSettings.webcamElementHls.src = null;
                self.hls.destroy();
                self.hls = null;
            }

            // Close any existing, disconnected connection
            if (
                self.WebCamSettings.webRTCPeerConnection != null &&
                self.WebCamSettings.webRTCPeerConnection.connectionState != "connected"
            ) {
                self.WebCamSettings.webRTCPeerConnection.close();
                self.WebCamSettings.webRTCPeerConnection = null;
            }

            // Open a new connection if necessary
            if (self.WebCamSettings.webRTCPeerConnection == null) {
                self.WebCamSettings.webRTCPeerConnection = startWebRTC(
                    video,
                    self.WebCamSettings.streamUrlEscaped(),
                    self.settings.streamWebrtcIceServers()
                );
            }

            self.WebCamSettings.webcamMjpgEnabled(false);
            self.WebCamSettings.webcamHlsEnabled(false);
            self.WebCamSettings.webcamWebRTCEnabled(true);
        };

        self._updateVideoTagWebcamLayout = function (webcam) {
            // Get all elements we need
            var webcamElement = $(webcam[0]);
            var player = self._getActiveWebcamVideoElement();
            var rotationContainer = webcamElement.find(
                ".webcam_video_container .webcam_rotated"
            );
            var rotationTarget = webcamElement.find(
                ".webcam_video_container .webcam_rotated .rotation_target"
            );
            var unrotationContainer = webcamElement.find(
                ".webcam_video_container .webcam_unrotated"
            );
            var unrotationTarget = webcamElement.find(
                ".webcam_video_container .webcam_unrotated .rotation_target"
            );

            // If we found the rotation container, the view is rotated 90 degrees. This
            // means we need to manually calculate the player dimensions and apply them
            // to the rotation target where height = width and width = height (to
            // accommodate the rotation). The target is centered in the container and
            // rotated around its center, so after we manually resized the container
            // everything will layout nicely.
            if (rotationContainer[0] && player.videoWidth && player.videoHeight) {
                // Calculate the height the video will have in the UI, based on the
                // video width and the aspect ratio.
                var aspectRatio = player.videoWidth / player.videoHeight;
                var height = aspectRatio * rotationContainer[0].offsetWidth;

                // Enforce the height on the rotation container and the rotation target.
                // Width of the container will be 100%, height will be calculated
                //
                // The size of the rotation target (the element that has the 90 deg
                // transform) is the inverse size of the container (so height -> width
                // and width -> height)
                rotationContainer[0].style.height = height + "px";
                rotationTarget[0].style.height = rotationContainer[0].offsetWidth + "px";
                rotationTarget[0].style.width = rotationContainer[0].offsetHeight + "px";

                // Remove the padding we used to give the element an initial height.
                rotationContainer[0].style.paddingBottom = 0;
            }

            // We are not rotated, clean up all changes we might have done before
            if (unrotationContainer[0]) {
                unrotationContainer[0].style.height = null;
                unrotationContainer[0].style.paddingBottom = 0;
                unrotationTarget[0].style.height = null;
                unrotationTarget[0].style.width = null;
            }
        };

        // Webcam actions
        self.loadWebcam = function (webcam) {
            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamLoaded(false)

            //Unload before loading the new webcam
            self.unloadWebcams()

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
                    //console.log("Loading webcam: ", webcam[1].URL)

                    self.WebCamSettings.streamUrl(webcam[1].URL)

                    self._syncWebcamElements(webcam);

                    var streamType = self.WebCamSettings.webcamStreamType();
                    if (streamType == "mjpg") {
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

                        self._switchToMjpgWebcam(webcam)
                        webcamImage.attr("src", self.WebCamSettings.streamUrlEscaped())
                    } else if (streamType == "hls") {
                        self._switchToHlsWebcam(webcam)
                        self.onWebcamLoadHls(webcam)
                    } else if (isWebRTCAvailable() && streamType == "webrtc") {
                        self._switchToWebRTCWebcam(webcam)
                        self.onWebcamLoadRtc(webcam)
                    } else {
                        console.error("Error: Unknown stream type " + streamType)
                    }
                }
                else{
                    console.error("Error: webcamImage not found")
                    self.onWebcamError(webcam);
                }
            }
            else{
                console.error("Error: webcam not found")
                //self.onWebcamError(webcam); //This causes errors, as webcam is undefined
            }
        };

        self.launchWebcamPictureInPicture = function () {
            // console.log("DEBUGG launchWebcamPictureInPicture",self._getActiveWebcamVideoElement())
            self._getActiveWebcamVideoElement().requestPictureInPicture();
        };

        self.launchWebcamFullscreen = function () {
            // console.log("DEBUGG launchWebcamPictureInPicture",self._getActiveWebcamVideoElement())
            self._getActiveWebcamVideoElement().requestFullscreen();
        };

        self.toggleWebcamMute = function () {
            self.WebCamSettings.webcamMuted(!self.WebCamSettings.webcamMuted());
            self.WebCamSettings.webcamElementWebrtc[0].muted = self.WebCamSettings.webcamMuted();
            self.WebCamSettings.webcamElementHls[0].muted = self.WebCamSettings.webcamMuted();
        };

        self.onChangeWebcam = function () {
            //console.log("DEBUGG Webcam visibility change",self.webcams)
            const visible = self.webcams.find((webcam) => webcam[0].classList.contains("active"));
        
            if (visible !== undefined) {
                if ($(visible[0]).find('.webcam_image').attr("src") !== self.WebCamSettings.streamUrlEscaped()) {
                    this.loadWebcam(visible);
                }
            }
        };

        // Webcam Callbacks
        self.onWebcamError = function (webcam) {
            console.error("Error: unable to load webcam: ",webcam[1].URL)
            self.WebCamSettings.webcamError(true)
            self.WebCamSettings.webcamLoaded(false)
        };

        self.onWebcamLoad = function (webcam) {
            if (self.WebCamSettings.webcamLoaded()) return;
            //console.log("DEBUGG Webcam load",webcam)
            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamHlsEnabled(false)
            self.WebCamSettings.webcamWebRTCEnabled(false)
            self.WebCamSettings.webcamLoaded(true)
        };

        self.onWebcamLoadHls = function (webcam) {
            if (self.WebCamSettings.webcamLoaded()) return;
            //console.log("DEBUGG Webcam load Hls",webcam)
            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamWebRTCEnabled(false)
            self.WebCamSettings.webcamLoaded(false)
            self.WebCamSettings.webcamHlsEnabled(true)
        };

        self.onWebcamLoadRtc = function (webcam) {
            if (self.WebCamSettings.webcamLoaded()) return;
            //console.log("DEBUGG Webcam load Rtc",webcam)
            self.WebCamSettings.webcamError(false)
            self.WebCamSettings.webcamHlsEnabled(false)
            self.WebCamSettings.webcamLoaded(false)
            self.WebCamSettings.webcamWebRTCEnabled(true)
        };

        self.unloadWebcam = function (webcam) {
            //console.log("DEBUGG Unloading webcam",webcam)
            var webcamElement = $(webcam[0]);
            var webcamImage = webcamElement.find(".webcam_image")

            //Turn off on handlers during unload
            webcamImage.off("load")
            webcamImage.off("error")

            //Remove the src of the webcam to unload it from the window
            webcamImage.attr("src", "")
        };

        self.unloadWebcams = function () {
            self.webcams.forEach((webcam) => {
                self.unloadWebcam(webcam);
            });
            
            // Unload HLS
            if (self.hls != null) {
                self.WebCamSettings.webcamElementHls.src = null;
                self.hls.destroy();
                self.hls = null;
            }
        };

    }

    OCTOPRINT_VIEWMODELS.push({
        construct: MultiCamViewModel,
        dependencies: ["loginStateViewModel", "multiCamSettingsViewModel"],
        elements: ['#multicam']
    });
});
