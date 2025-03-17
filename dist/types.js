/**
 * Enum representing the possible states of a webcam
 */
export var WebcamStatus;
(function (WebcamStatus) {
    WebcamStatus["IDLE"] = "idle";
    WebcamStatus["INITIALIZING"] = "initializing";
    WebcamStatus["READY"] = "ready";
    WebcamStatus["ERROR"] = "error";
})(WebcamStatus || (WebcamStatus = {}));
