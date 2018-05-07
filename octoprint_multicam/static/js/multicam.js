$(function() {
    function MultiCamViewModel(parameters) {
        var self = this;

        var camViewPort = $('#webcam_image');

        self.settings = parameters[0];

        self.multicam_profiles = ko.observableArray();

        self.addMultiCamProfile = function() {
            self.multicam_profiles.push({name: "Webcam "+self.multicam_profiles().length, URL: "http://"});
        };

        self.removeMultiCamProfile = function(profile) {
            self.multicam_profiles.remove(profile);
        };

        //self.currentStream = ko.observable();

        //self.newStream = ko.observable();

        //self.goToUrl = function() {
        //    self.currentStream(self.newStream());
        //};

        self.loadWebcam = function() {
            console.log("Changing stream to: "+self.settings.settings.plugins.multicam.multicamStream2());
            camViewPort.attr('src',self.settings.settings.plugins.multicam.multicamStream2());
        };

        //self.onBeforeBinding = function() {
        //    self.newStream(self.settings.settings.plugins.multicam.multicamStream1());
        //    self.goToUrl();
        //};

        self.onAfterBinding = function() {
            var camControl = $('#camControl');
            var container = $('#control-jog-general');

            // Inserts the control after the general settings under Control Tab
            camControl.insertAfter(container);
        }
    }

    OCTOPRINT_VIEWMODELS.push([
        MultiCamViewModel,
        ["settingsViewModel", "controlViewModel"],
        ["#camControl"]
    ]);
});
