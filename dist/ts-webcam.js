"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webcam = void 0;
class Webcam {
    constructor(config = {}) {
        this.stream = null;
        this.defaultConfig = {
            audio: false,
            device: "",
            resolution: ["640x480"],
            fallbackResolution: "640x480",
            mirror: false,
            autoRotation: true,
            previewElement: undefined,
            onStart: () => { },
            onError: () => { },
        };
        this.config = Object.assign(Object.assign({}, this.defaultConfig), config);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const constraints = this.buildConstraints();
                this.stream = yield navigator.mediaDevices.getUserMedia(constraints);
                if (this.config.previewElement) {
                    this.config.previewElement.srcObject = this.stream;
                    this.config.previewElement.style.transform = this.config.mirror
                        ? "scaleX(-1)"
                        : "none";
                    yield this.config.previewElement.play();
                }
                if (this.config.autoRotation) {
                    this.handleDeviceOrientation();
                }
                this.config.onStart();
            }
            catch (error) {
                this.config.onError(error);
                throw error;
            }
        });
    }
    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        if (this.config.previewElement) {
            this.config.previewElement.srcObject = null;
        }
    }
    isActive() {
        return this.stream !== null && this.stream.active;
    }
    getCurrentResolution() {
        if (!this.stream)
            return null;
        const videoTrack = this.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        return {
            width: settings.width || 0,
            height: settings.height || 0,
        };
    }
    updateConfig(newConfig) {
        const wasActive = this.isActive();
        if (wasActive) {
            this.stop();
        }
        this.config = Object.assign(Object.assign({}, this.config), newConfig);
        if (wasActive) {
            this.start().catch(this.config.onError);
        }
    }
    buildConstraints() {
        const videoConstraints = {
            deviceId: this.config.device ? { exact: this.config.device } : undefined,
        };
        // Parse resolution strings and add to constraints
        if (this.config.resolution.length > 0) {
            const [width, height] = this.parseResolution(this.config.resolution[0]);
            videoConstraints.width = { ideal: width };
            videoConstraints.height = { ideal: height };
        }
        return {
            video: videoConstraints,
            audio: this.config.audio,
        };
    }
    parseResolution(resolution) {
        const [width, height] = resolution.split("x").map(Number);
        return [width, height];
    }
    handleDeviceOrientation() {
        if (!this.config.previewElement)
            return;
        window.addEventListener("orientationchange", () => {
            const orientation = window.orientation;
            let rotation = "rotate(0deg)";
            if (orientation === 90)
                rotation = "rotate(-90deg)";
            else if (orientation === -90)
                rotation = "rotate(90deg)";
            else if (orientation === 180)
                rotation = "rotate(180deg)";
            this.config.previewElement.style.transform = `${rotation}${this.config.mirror ? " scaleX(-1)" : ""}`;
        });
    }
}
exports.Webcam = Webcam;
