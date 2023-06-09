$(function () {
    function MultiCamWebcamViewModel(parameters) {
        //console.log("DEBUGGG init MultiCamWebcamView!")

        let self = this;
        self.multicam = parameters[0];
        //self.control = parameters[1];

        self.onWebcamVisibilityChange = function (visible) {
            self.multicam.onChangeWebcam()
            // TODO: The below is a better way of handling this, but currently _visibleWebcam does not work as intended
            // Suggest: Octoprint to update onWebcamVisibilityChange callback to include a target
            // Suggest2: Octoprint to update _visibleWebcam to be set before calling onWebcamVisibilityChange

            // Fix for when _visibleWebcam is not defined (general on first load)
            // if(!self.control._visibleWebcam) {
            //     console.log("DEBUGGG onWebcamVisibilityChange: _visibleWebcam is not defined, reloading all webcams", self.control._visibleWebcam)
            //     self.multicam.onChangeWebcam()
            //     return;
            // }

            // console.log("DEBUGGG onWebcamVisibilityChange: id: ", self.control._visibleWebcam.id)
            // console.log("DEBUGGG onWebcamVisibilityChange: visible: ", visible)

            // const webcam = self.multicam.webcams.find((webcam) => webcam[0].id == self.control._visibleWebcam.id)
            
            // if (visible) {
            //     self.multicam.loadWebcam(webcam);
            // }
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
        dependencies: ["multiCamViewModel"], //["multiCamViewModel", "controlViewModel"]
        elements: getWebcamInstances()
    });
});
