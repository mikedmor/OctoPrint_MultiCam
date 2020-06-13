$(function() {
    function MultiCamViewModel(parameters) {
        var self = this;

        var camViewPort = $('#webcam_image');

        self.settings = parameters[0];
        self.control = parameters[1];

        self.multicam_profiles = ko.observableArray();

        self.enabled_buttons = ko.observableArray();

        self.multicam_selected = ko.observable('');

        self.onBeforeBinding = function() {
                console.log("Binding control to multicam");
                camViewPort.attr("data-bind","css: { flipH: settings.plugins.multicam.multicam_profiles[].flipH}; attr: {url: }");
                self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.onSettingsShown = function() {
            // Force default webcam in settings to avoid confusion
            self.loadWebcam(self.multicam_profiles()[0]);
        };

        self.onSettingsBeforeSave = function() {
            // Update multicam profile for default webcam
            ko.utils.arrayForEach(self.settings.settings.plugins.multicam.multicam_profiles(), function (item, index) {
                if(index == 0 && item.URL() != $('#settings-webcamStreamUrl').val()) {
                    console.log("Changes Detected in Webcam settings : URL");
                    item.URL($('#settings-webcamStreamUrl').val());
                }
                if(index == 0 && item.snapshot() != $('#settings-webcamSnapshotUrl').val()) {
                    console.log("Changes Detected in Webcam settings : Snapshot URL");
                    item.snapshot($('#settings-webcamSnapshotUrl').val());
                }
                if(index == 0 && item.streamRatio() != $('#settings-webcamStreamRatio').val()) {
                    console.log("Changes Detected in Webcam settings : stream ratio");
                    item.streamRatio($('#settings-webcamStreamRatio').val());
                }
                if(index == 0 && item.flipH() != $('#settings-webcamFlipH').is(':checked')) {
                    console.log("Changes Detected in Webcam settings : FlipH");
                    item.flipH($('#settings-webcamFlipH').is(':checked'));
                }
                if(index == 0 && item.flipV() != $('#settings-webcamFlipV').is(':checked')) {
                    console.log("Changes Detected in Webcam settings : FlipV");
                    item.flipV($('#settings-webcamFlipV').is(':checked'));
                }
                if(index == 0 && item.rotate90() != $('#settings-webcamRotate90').is(':checked')) {
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

        self.onEventSettingsUpdated = function(payload) {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.addMultiCamProfile = function() {
            self.settings.settings.plugins.multicam.multicam_profiles.push({
                name: ko.observable('Webcam '+self.multicam_profiles().length), 
                URL: ko.observable('http://'), 
                snapshot: ko.observable('http://'),
                streamRatio: ko.observable(''),
                flipH: ko.observable(false),
                flipV: ko.observable(false),
                rotate90: ko.observable(false),
                isButtonEnabled: ko.observable(true)});
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.removeMultiCamProfile = function(profile) {
            self.settings.settings.plugins.multicam.multicam_profiles.remove(profile);
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.loadWebcam = function(profile, event) {
            // Set webcam observables to selected webcam
            self.settings.webcam_streamUrl(ko.toJS(profile).URL);
            self.settings.webcam_snapshotUrl(ko.toJS(profile).snapshot);
            self.settings.webcam_streamRatio(ko.toJS(profile).streamRatio);
            self.settings.webcam_flipH(ko.toJS(profile).flipH);
            self.settings.webcam_flipV(ko.toJS(profile).flipV);
            self.settings.webcam_rotate90(ko.toJS(profile).rotate90);
            // Force reload of webcam URL with new parameters
            self.control._enableWebcam();
            // Update buttons
            ko.utils.arrayForEach(self.multicam_profiles(), function (item) {
                if(profile===item) {
                    item.isButtonEnabled(false);
                } else {
                    item.isButtonEnabled(true);
                }
            });
        };

        self.onAfterBinding = function() {
            var camControl = $('#camControl');
            var container = $('#control-jog-general');

            camControl.insertAfter(container);
            camControl.css('display', '');
        };

        self.onAfterTabChange = function(current, previous) {
            ko.utils.arrayForEach(self.multicam_profiles(), function (item, index) {
                if(index === 0) {
                    item.isButtonEnabled(false);
                } else {
                    item.isButtonEnabled(true);
                }
            });
        };

    }

    OCTOPRINT_VIEWMODELS.push([
        MultiCamViewModel,
        ["settingsViewModel", "controlViewModel"],
        ["#settings_plugin_multicam_form","#camControl"]
    ]);
});
