$(function() {
    function MultiCamViewModel(parameters) {
        var self = this;

        var camViewPort = $('#webcam_image');

        self.settings = parameters[0];

        self.multicam_profiles = ko.observableArray();

        self.enabled_buttons = ko.observableArray();

        self.onBeforeBinding = function() {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.onSettingsBeforeSave = function() {
            ko.utils.arrayForEach(self.settings.settings.plugins.multicam.multicam_profiles(), function (item, index) {
                if(index == 0 && item.URL() != $('#settings-webcamStreamUrl').val()) {
                    console.log("Changes Detected in Webcam settings : URL");
                    item.URL($('#settings-webcamStreamUrl').val());
                }
                if(index == 0 && item.snapshot() != $('#settings-webcamSnapshotUrl').val()) {
                    console.log("Changes Detected in Webcam settings : Snapshot URL");
                    item.snapshot($('#settings-webcamSnapshotUrl').val());
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
            console.log("Multicam_profiles:", self.multicam_profiles());
            //self.settings.settings.plugins.multicam.multicam_profiles(self.multicam_profiles.slice(0));
            //self.settings.settings.plugins.multicam.multicam_profiles(self.multicam_profiles());
            //self.onAfterTabChange();
        };

        self.onEventSettingsUpdated = function(payload) {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.addMultiCamProfile = function() {
            self.settings.settings.plugins.multicam.multicam_profiles.push({
                name: ko.observable('Webcam '+self.multicam_profiles().length), 
                URL: ko.observable('http://'), 
                snapshot: ko.observable('http://'), 
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
            camViewPort.attr('src',ko.toJS(profile).URL);
            if (ko.toJS(profile).flipH) { camViewPort.addClass('flipH'); } else { camViewPort.removeClass('flipH'); }
            if (ko.toJS(profile).flipV) { camViewPort.addClass('flipV'); } else { camViewPort.removeClass('flipV'); }
            if (ko.toJS(profile).rotate90) { 
                $('#webcam_rotator').removeClass('webcam_unrotated');
                $('#webcam_rotator').addClass('webcam_rotated');
            } else {
                $('#webcam_rotator').removeClass('webcam_rotated');
                $('#webcam_rotator').addClass('webcam_unrotated');
            }
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
