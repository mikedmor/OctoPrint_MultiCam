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
            self.onAfterTabChange();
        };

        self.onEventSettingsUpdated = function(payload) {
            //self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
            self.settings.settings.plugins.multicam.multicam_profiles(self.multicam_profiles.slice(0));
        };

        self.addMultiCamProfile = function() {
            self.settings.settings.plugins.multicam.multicam_profiles.push({name: ko.observable('Webcam '+self.multicam_profiles().length), URL: ko.observable('http://'), isButtonEnabled: ko.observable(true)});
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.removeMultiCamProfile = function(profile) {
            self.settings.settings.plugins.multicam.multicam_profiles.remove(profile);
            self.multicam_profiles(self.settings.settings.plugins.multicam.multicam_profiles());
        };

        self.loadWebcam = function(profile, event) {
            camViewPort.attr('src',ko.toJS(profile).URL);
            //console.log(ko.toJS(self.multicam_profiles()));
            ko.utils.arrayForEach(self.multicam_profiles(), function (item) {
                item.isButtonEnabled(true);
            });
            profile.isButtonEnabled(false);
            //console.log(ko.toJS(self.multicam_profiles()));
        };

        self.onAfterBinding = function() {
            var camControl = $('#camControl');
            var container = $('#control-jog-general');

            camControl.insertAfter(container);
            camControl.css('display', '');
        };

        self.onAfterTabChange = function(current, previous) {
            ko.utils.arrayForEach(self.multicam_profiles(), function (item, index) {
                if(index == 0) {
                    item.isButtonEnabled(false);
                } else {
                    item.isButtonEnabled(true);
                }
            });
        };

        //Saving the buttons seems to effect the databinding, until the bug is fixed a reload of the ui is required!
        self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "multicam") {
                return;
            }
            if (data.reload) {				
                new PNotify({
                    title: 'Reload Required',
                    text: 'MultiCam has changed and a reload of the web interface is required.\n\n<span class="label label-important">After the save operation is complete<\/span> press the <span class="label">F5<\/span> key.\n',
                    hide: false,
                    icon: 'icon icon-refresh',
                    addclass: 'multicam-reloadneeded',
                    confirm: {
                        confirm: true,
                        buttons: [{
                            text: 'Ok',
                            addClass: 'btn',
                            click: function(notice) {
                                notice.remove();
                            }
                        },
                        {
                            text: 'Cancel',
                            addClass: 'hidden',
                            click: function(notice) {
                                notice.remove();
                            }
                        },
                        ]
                    },
                    buttons: {
                        closer: false,
                        sticker: false
                    },
                    history: {
                        history: false
                    }
                });
            };
        };

    }

    OCTOPRINT_VIEWMODELS.push([
        MultiCamViewModel,
        ["settingsViewModel", "controlViewModel"],
        ["#settings_plugin_multicam_form","#camControl"]
    ]);
});
