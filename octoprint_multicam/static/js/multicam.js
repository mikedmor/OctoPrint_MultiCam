$(function() {
    function MultiCamViewModel(parameters) {
        var self = this;

        var camViewPort = $('#webcam_image');

        var currentStream = ""; //camViewPort.attr('src').substr(0, camViewPort.attr('src').indexOf('?'));

        self.settings = parameters[0];

        self.multicam_profiles = ko.observableArray();

        self.onBeforeBinding = function() {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.onEventSettingsUpdated = function(payload) {
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.addMultiCamProfile = function() {
            //console.log("Adding New profile for Webcam "+self.multicam_profiles().length);
            self.settings.settings.plugins.multicam.multicam_profiles.push({name: ko.observable('Webcam '+self.multicam_profiles().length), URL: ko.observable('http://')});
            //console.log("Updating local multicam_profiles variable");
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.removeMultiCamProfile = function(profile) {
            //console.log("Removing profile");
            self.settings.settings.plugins.multicam.multicam_profiles.remove(profile);
            //console.log("Updating local multicam_profiles variable");
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        //TODO: get binding working with: enable: $parent.currentLoaded(URL)
        self.currentLoaded = function(URL) {
            return URL != currentStream;
        }.bind(MultiCamViewModel);

        self.loadWebcam = function(profile, event) {
            console.log("CurrentStream:"+currentStream);
            console.log("Changing stream to: "+ko.toJS(profile).URL);
            camViewPort.attr('src',ko.toJS(profile).URL);
            currentStream = ko.toJS(profile).URL;
        };

        self.onAfterBinding = function() {
            var camControl = $('#camControl');
            var container = $('#control-jog-general');

            // Inserts the control after the general settings under Control Tab
            camControl.insertAfter(container);
        };

    }

    OCTOPRINT_VIEWMODELS.push([
        MultiCamViewModel,
        ["settingsViewModel", "controlViewModel"],
        ["#settings_plugin_multicam_form","#camControl"]
    ]);
});
