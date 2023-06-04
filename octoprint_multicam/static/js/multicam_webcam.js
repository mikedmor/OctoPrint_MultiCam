$(function () {
    function MultiCamWebcamViewModel(parameters) {
        //console.log("DEBUGGG init MultiCamWebcamView!")

        let self = this;
        self.multicam = parameters[0];

        self.onWebcamVisibilityChange = function (visible) {
            self.multicam.onChangeWebcam();
        }
    }

    function getWebcamInstances() {
        let elements = [];
        // get the number of webcam instances from the dom

        //This works
        $('#webcam-group').children().each(function(index, element) {
            if (element.id.startsWith("webcam_plugin_multicam")) {
                elements.push("#"+element.id);
            }
        });

        //This does not work, for some reason
        // $("#webcam-group > div[id^='webcam_plugin_multicam']").each(function(index, element) {
        //     elements.push("#"+element.id);
        // });

        //console.log("DEBUGGG getWebcamInstances", elements)
        return elements;
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: MultiCamWebcamViewModel,
        dependencies: ["multiCamViewModel"],
        elements: getWebcamInstances()
    });
});
