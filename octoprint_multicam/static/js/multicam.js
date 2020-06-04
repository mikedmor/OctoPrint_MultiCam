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
            ko.utils.arrayForEach(self.multicam_profiles(), function (item, index) {
                if(index == 0 && item.URL != $('#settings-webcamStreamUrl').val()) {
                    console.log("Changes Detected in Webcam & Timelaspse URL");
                    item.URL($('#settings-webcamStreamUrl').val());
                }
            });
            self.settings.settings.plugins.multicam.multicam_profiles(self.multicam_profiles.slice(0));
            self.onAfterTabChange();
        };

        self.onEventSettingsUpdated = function(payload) {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.addMultiCamProfile = function() {
            self.settings.settings.plugins.multicam.multicam_profiles.push({name: ko.observable('Webcam '+self.multicam_profiles().length), URL: ko.observable('http://'), snapshot_url: ko.observable(''), isButtonEnabled: ko.observable(true)});
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.removeMultiCamProfile = function(profile) {
            self.settings.settings.plugins.multicam.multicam_profiles.remove(profile);
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.loadWebcam = function(profile, event) {
            camViewPort.attr('src',ko.toJS(profile).URL);
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
