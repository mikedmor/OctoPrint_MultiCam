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
            streamUrlEscaped: ko.pureComputed(function () {
                return encodeURI(self.previewWebCamSettings.streamUrl());
            }),
            webcamLoaded: ko.observable(false),
            webcamStreamType: ko.pureComputed(function () {
                try {
                    return self.determineWebcamStreamType(self.previewWebCamSettings.streamUrlEscaped());
                } catch (e) {
                    console.error(e);
                    self.previewWebCamSettings.webcamError(true);
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

        self.syncWebcamElements = function () {
            var webcamElement = $('.multicam_preview_container');
            self.previewWebCamSettings.webcamElementHls = webcamElement.find(".webcam_hls").first();
            self.previewWebCamSettings.webcamElementWebrtc = webcamElement.find(".webcam_webrtc").first();
        };

        self._getActiveWebcamVideoElement = function () {
            if (self.previewWebCamSettings.webcamWebRTCEnabled()) {
                return self.previewWebCamSettings.webcamElementWebrtc[0];
            } else {
                return self.previewWebCamSettings.webcamElementHls[0];
            }
        };

        self.launchWebcamPictureInPicture = function () {
            console.log("DEBUGG launchWebcamPictureInPicture",self._getActiveWebcamVideoElement())
            self._getActiveWebcamVideoElement().requestPictureInPicture();
        };

        self.launchWebcamFullscreen = function () {
            console.log("DEBUGG launchWebcamPictureInPicture",self._getActiveWebcamVideoElement())
            self._getActiveWebcamVideoElement().requestFullscreen();
        };

        self.toggleWebcamMute = function () {
            self.previewWebCamSettings.webcamMuted(!self.previewWebCamSettings.webcamMuted());
            self.previewWebCamSettings.webcamElementWebrtc[0].muted = self.previewWebCamSettings.webcamMuted();
            self.previewWebCamSettings.webcamElementHls[0].muted = self.previewWebCamSettings.webcamMuted();
        };

        self.onStartup = function () {
            self.syncWebcamElements();
        };

        self.onSettingsShown = function () {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            // Force default webcam in settings to avoid confusion
            let preSelectedProfile = 0;
            self.selectedPreviewProfileIndex(preSelectedProfile);
        };

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

        self.unloadWebcam = function () {
            //console.log("DEBUGG Unloading webcam",webcam)
            var webcamElement = $('.multicam_preview_container');
            var webcamImage = webcamElement.find(".webcam_image")

            //Turn off on handlers during unload
            webcamImage.off("load")
            webcamImage.off("error")

            //Remove the src of the webcam to unload it from the window
            webcamImage.attr("src", "")

            // Unload HLS
            if (self.hls != null) {
                self.previewWebCamSettings.webcamElementHls.src = null;
                self.hls.destroy();
                self.hls = null;
            }
        };

        self.onWebcamLoad = function () {
            if (self.previewWebCamSettings.webcamLoaded()) return;
            self.previewWebCamSettings.webcamError(false)
            self.previewWebCamSettings.webcamHlsEnabled(false)
            self.previewWebCamSettings.webcamWebRTCEnabled(false)
            self.previewWebCamSettings.webcamLoaded(true)
        }

        self.onWebcamLoadHls = function () {
            if (self.previewWebCamSettings.webcamLoaded()) return;
            self.previewWebCamSettings.webcamError(false)
            self.previewWebCamSettings.webcamWebRTCEnabled(false)
            self.previewWebCamSettings.webcamLoaded(false)
            self.previewWebCamSettings.webcamHlsEnabled(true)
        }

        self.onWebcamLoadRtc = function () {
            if (self.previewWebCamSettings.webcamLoaded()) return;
            self.previewWebCamSettings.webcamError(false)
            self.previewWebCamSettings.webcamHlsEnabled(false)
            self.previewWebCamSettings.webcamLoaded(false)
            self.previewWebCamSettings.webcamWebRTCEnabled(true)
        }

        self.loadWebCamPreviewStream = function () {
            self.previewWebCamSettings.webcamLoaded(false);
            self.previewWebCamSettings.webcamError(false);

            self.unloadWebcam();

            let streamUrl = self.previewWebCamSettings.streamUrl();
            //console.log("loading from " + streamUrl);
            // if (snapshotUrl == null || streamUrl == null || snapshotUrl.length == 0 || streamUrl.length == 0) {
            if (streamUrl == null || streamUrl.length == 0) {
                alert("Camera-Error: Please make sure that stream-url is configured in your camera-settings")
                return
            }

            var streamType = self.previewWebCamSettings.webcamStreamType();
            if (streamType == "mjpg") {
                // update the new stream-image
                $(".webcam_image_preview").on('load', function () {
                    self.onWebcamLoad();
                    $("#webcam_image_preview").off('load');
                    $("#webcam_image_preview").off('error');
                });
                $(".webcam_image_preview").on('error', function () {
                    self.onWebcamError();
                    $("#webcam_image_preview").off('load');
                    $("#webcam_image_preview").off('error');
                });
                
                self._switchToMjpgWebcam();
                $(".webcam_image_preview").attr("src", self.previewWebCamSettings.streamUrl());
            } else if (streamType == "hls") {
                self._switchToHlsWebcam()
                self.onWebcamLoadHls()
            } else if (isWebRTCAvailable() && streamType == "webrtc") {
                self._switchToWebRTCWebcam()
                self.onWebcamLoadRtc()
            } else {
                console.error("Unknown stream type " + streamType)
            }
        };

        self._switchToMjpgWebcam = function () {
            var webcamElement = $('.multicam_preview_container');
            var webcamImage = webcamElement.find(".webcam_image")
            var currentSrc = webcamImage.attr("src");

            var newSrc = self.previewWebCamSettings.streamUrlEscaped();

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

                self.previewWebCamSettings.webcamLoaded(false);
                self.previewWebCamSettings.webcamError(false);
                webcamImage.attr("src", newSrc);

                self.previewWebCamSettings.webcamHlsEnabled(false);
                self.previewWebCamSettings.webcamMjpgEnabled(true);
                self.previewWebCamSettings.webcamWebRTCEnabled(false);
            }
        };

        self._switchToHlsWebcam = function () {
            var video = self.previewWebCamSettings.webcamElementHls[0];
            //video.onresize = self.previewWebCamSettings._updateVideoTagWebcamLayout;

            // Ensure WebRTC is unloaded
            if (self.previewWebCamSettings.webRTCPeerConnection != null) {
                try {
                    if (typeof self.previewWebCamSettings.webRTCPeerConnection.close === 'function') {
                        self.previewWebCamSettings.webRTCPeerConnection.close();
                    }
                } catch(e) {
                    console.log("DEBUGG Error closing WebRTC connection", e)
                }
                self.previewWebCamSettings.webRTCPeerConnection = null;
            }

            // Check for native playback options: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType
            if (
                video != null &&
                typeof video.canPlayType != undefined &&
                video.canPlayType("application/vnd.apple.mpegurl") == "probably"
            ) {
                console.log("DEBUGG Using native HLS playback")
                video.src = self.streamUrlEscaped();
            } else if (Hls.isSupported()) {
                console.log("DEBUGG Using HLS.js playback")
                self.hls = new Hls();
                self.hls.loadSource(self.previewWebCamSettings.streamUrlEscaped());
                self.hls.attachMedia(video);
            }else{
                console.error("Error: HLS not supported")
            }

            self.previewWebCamSettings.webcamMjpgEnabled(false);
            self.previewWebCamSettings.webcamHlsEnabled(true);
            self.previewWebCamSettings.webcamWebRTCEnabled(false);
        };

        self._switchToWebRTCWebcam = function () {
            if (!isWebRTCAvailable()) {
                return;
            }
            var video = self.previewWebCamSettings.webcamElementWebrtc[0];
            //video.onresize = self.previewWebCamSettings._updateVideoTagWebcamLayout;

            // Ensure HLS is unloaded
            if (self.hls != null) {
                self.previewWebCamSettings.webcamElementHls.src = null;
                self.hls.destroy();
                self.hls = null;
            }

            // Close any existing, disconnected connection
            if (
                self.previewWebCamSettings.webRTCPeerConnection != null &&
                self.previewWebCamSettings.webRTCPeerConnection.connectionState != "connected"
            ) {
                self.previewWebCamSettings.webRTCPeerConnection.close();
                self.previewWebCamSettings.webRTCPeerConnection = null;
            }

            // Open a new connection if necessary
            if (self.previewWebCamSettings.webRTCPeerConnection == null) {
                self.previewWebCamSettings.webRTCPeerConnection = startWebRTC(
                    video,
                    self.previewWebCamSettings.streamUrlEscaped(),
                    self.settings.streamWebrtcIceServers()
                );
            }

            self.previewWebCamSettings.webcamMjpgEnabled(false);
            self.previewWebCamSettings.webcamHlsEnabled(false);
            self.previewWebCamSettings.webcamWebRTCEnabled(true);
        };

        self.determineWebcamStreamType = function (streamUrl) {
            if (!streamUrl) {
                throw "Empty streamUrl. Cannot determine stream type.";
            }

            var parsed = validateWebcamUrl(streamUrl);
            if (!parsed) {
                throw "Invalid streamUrl. Cannot determine stream type.";
            }

            if (parsed.protocol === "webrtc:" || parsed.protocol === "webrtcs:") {
                console.log("DEBUGG Webcam stream type: webrtc")
                return "webrtc";
            }

            var lastDotPosition = parsed.pathname.lastIndexOf(".");
            if (lastDotPosition !== -1) {
                var extension = parsed.pathname.substring(lastDotPosition + 1);
                if (extension.toLowerCase() === "m3u8") {
                    console.log("DEBUGG Webcam stream type: hls")
                    return "hls";
                }
            }

            // By default, 'mjpg' is the stream type.
            console.log("DEBUGG Webcam stream type: mjpg")
            return "mjpg";
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
