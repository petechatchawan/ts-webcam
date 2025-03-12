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
exports.Webcam = exports.WebcamStatus = void 0;
// Enums
var WebcamStatus;
(function (WebcamStatus) {
    WebcamStatus["IDLE"] = "idle";
    WebcamStatus["INITIALIZING"] = "initializing";
    WebcamStatus["READY"] = "ready";
    WebcamStatus["ERROR"] = "error";
})(WebcamStatus || (exports.WebcamStatus = WebcamStatus = {}));
class Webcam {
    constructor() {
        // Private fields
        this.config = null;
        this.stream = null;
        this.status = WebcamStatus.IDLE;
        this.lastError = null;
        this.devices = [];
        this.deviceChangeCallbacks = [];
        this.deviceChangeListener = null;
        // Default values
        this.defaultConfig = {
            audio: false,
            device: "",
            resolutions: [
                { name: "HD", width: 1280, height: 720, aspectRatio: 16 / 9 },
                { name: "VGA", width: 640, height: 480, aspectRatio: 4 / 3 },
            ],
            allowAnyResolution: false,
            mirror: false,
            autoRotation: true,
            previewElement: undefined,
            onStart: () => { },
            onError: () => { },
        };
        this.capabilities = {
            zoom: false,
            torch: false,
            focusMode: false,
            currentZoom: 1,
            minZoom: 1,
            maxZoom: 1,
            torchActive: false,
            focusModeActive: false,
            currentFocusMode: "none",
            supportedFocusModes: [],
        };
        this.startDeviceChangeTracking();
    }
    // Public API methods
    setupConfiguration(config) {
        if (!config.device) {
            throw new Error("Device ID is required");
        }
        if (!config.resolutions || config.resolutions.length === 0) {
            throw new Error("At least one resolution must be specified");
        }
        this.config = Object.assign(Object.assign({}, this.defaultConfig), config);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkConfiguration();
            try {
                yield this.initializeWebcam();
            }
            catch (error) {
                this.handleError(error);
                throw this.lastError;
            }
        });
    }
    stop() {
        this.checkConfiguration();
        this.stopStream();
        this.resetState();
    }
    isActive() {
        return this.stream !== null && this.stream.active;
    }
    // Device management
    onDeviceChange(callback) {
        this.deviceChangeCallbacks.push(callback);
        // เรียก callback ทันทีถ้ามีข้อมูลอุปกรณ์อยู่แล้ว
        if (this.devices.length > 0) {
            callback([...this.devices]);
        }
    }
    getDeviceList() {
        return [...this.devices];
    }
    getVideoDevices() {
        return this.getDeviceList().filter((device) => device.kind === "videoinput");
    }
    getAudioInputDevices() {
        return this.getDeviceList().filter((device) => device.kind === "audioinput");
    }
    getAudioOutputDevices() {
        return this.getDeviceList().filter((device) => device.kind === "audiooutput");
    }
    // State and capabilities
    getStatus() {
        return this.status;
    }
    getLastError() {
        return this.lastError;
    }
    getCapabilities() {
        return Object.assign({}, this.capabilities);
    }
    getCurrentResolution() {
        this.checkConfiguration();
        if (!this.stream)
            return null;
        const videoTrack = this.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        return {
            name: "Current",
            width: this.config.autoRotation
                ? settings.height || 0
                : settings.width || 0,
            height: this.config.autoRotation
                ? settings.width || 0
                : settings.height || 0,
            aspectRatio: settings.aspectRatio,
        };
    }
    // Camera controls
    setZoom(zoomLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.stream || !this.capabilities.zoom) {
                throw new Error("Zoom is not supported or camera is not active");
            }
            const videoTrack = this.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.zoom) {
                throw new Error("Zoom is not supported by this device");
            }
            zoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
            yield videoTrack.applyConstraints({
                advanced: [{ zoom: zoomLevel }],
            });
            this.capabilities.currentZoom = zoomLevel;
        });
    }
    setTorch(active) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.stream || !this.capabilities.torch) {
                throw new Error("Torch is not supported or camera is not active");
            }
            const videoTrack = this.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.torch) {
                throw new Error("Torch is not supported by this device");
            }
            yield videoTrack.applyConstraints({
                advanced: [{ torch: active }],
            });
            this.capabilities.torchActive = active;
        });
    }
    setFocusMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.stream || !this.capabilities.focusMode) {
                throw new Error("Focus mode is not supported or camera is not active");
            }
            const videoTrack = this.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
                throw new Error(`Focus mode ${mode} is not supported by this device`);
            }
            yield videoTrack.applyConstraints({
                advanced: [{ focusMode: mode }],
            });
            this.capabilities.currentFocusMode = mode;
            this.capabilities.focusModeActive = true;
        });
    }
    updateConfig(newConfig) {
        this.checkConfiguration();
        const wasActive = this.isActive();
        if (wasActive) {
            this.stop();
        }
        this.config = Object.assign(Object.assign({}, this.config), newConfig);
        if (wasActive) {
            this.start().catch(this.config.onError);
        }
    }
    // Permission management
    checkCameraPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            let tempStream = null;
            try {
                tempStream = yield navigator.mediaDevices.getUserMedia({ video: true });
                return "granted";
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === "NotAllowedError" ||
                        error.name === "PermissionDeniedError") {
                        return "denied";
                    }
                }
                return "prompt";
            }
            finally {
                if (tempStream) {
                    tempStream.getTracks().forEach((track) => track.stop());
                }
            }
        });
    }
    checkMicrophonePermission() {
        return __awaiter(this, void 0, void 0, function* () {
            let tempStream = null;
            try {
                tempStream = yield navigator.mediaDevices.getUserMedia({ audio: true });
                return "granted";
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === "NotAllowedError" ||
                        error.name === "PermissionDeniedError") {
                        return "denied";
                    }
                }
                return "prompt";
            }
            finally {
                if (tempStream) {
                    tempStream.getTracks().forEach((track) => track.stop());
                }
            }
        });
    }
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            return {
                camera: yield this.checkCameraPermission(),
                microphone: ((_a = this.config) === null || _a === void 0 ? void 0 : _a.audio)
                    ? yield this.checkMicrophonePermission()
                    : "prompt",
            };
        });
    }
    // Private helper methods
    initializeWebcam() {
        return __awaiter(this, void 0, void 0, function* () {
            this.status = WebcamStatus.INITIALIZING;
            this.lastError = null;
            const permissions = yield this.requestPermissions();
            this.validatePermissions(permissions);
            yield this.openCamera();
        });
    }
    validatePermissions(permissions) {
        if (permissions.camera === "denied") {
            throw new Error("Camera permission denied");
        }
        if (this.config.audio && permissions.microphone === "denied") {
            throw new Error("Microphone permission denied");
        }
    }
    openCamera() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const resolution of this.config.resolutions) {
                try {
                    yield this.tryResolution(resolution);
                    return;
                }
                catch (error) {
                    console.log(`Failed to open camera with resolution: ${resolution.name}. Error:`, error);
                    continue;
                }
            }
            if (this.config.allowAnyResolution) {
                yield this.tryAnyResolution();
            }
            else {
                throw new Error(`Unable to open camera with specified resolutions: ${this.config.resolutions.map((r) => `${r.name} (${r.width}x${r.height})`).join(", ")}`);
            }
        });
    }
    tryResolution(resolution) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`);
            const constraints = this.buildConstraints(resolution);
            this.stream = yield navigator.mediaDevices.getUserMedia(constraints);
            yield this.updateCapabilities();
            yield this.setupPreviewElement();
            console.log(`Successfully opened camera with resolution: ${resolution.name}`);
            this.status = WebcamStatus.READY;
            this.config.onStart();
        });
    }
    tryAnyResolution() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Attempting to open camera with any supported resolution");
            const constraints = {
                video: {
                    deviceId: { exact: this.config.device },
                },
                audio: this.config.audio,
            };
            this.stream = yield navigator.mediaDevices.getUserMedia(constraints);
            yield this.updateCapabilities();
            yield this.setupPreviewElement();
            const videoTrack = this.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log(`Opened camera with resolution: ${settings.width}x${settings.height}`);
            this.status = WebcamStatus.READY;
            this.config.onStart();
        });
    }
    setupPreviewElement() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.previewElement && this.stream) {
                this.config.previewElement.srcObject = this.stream;
                this.config.previewElement.style.transform = this.config.mirror
                    ? "scaleX(-1)"
                    : "none";
                yield this.config.previewElement.play();
            }
        });
    }
    updateCapabilities() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.stream)
                return;
            const videoTrack = this.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            const settings = videoTrack.getSettings();
            this.capabilities = {
                zoom: !!capabilities.zoom,
                torch: !!capabilities.torch,
                focusMode: !!capabilities.focusMode,
                currentZoom: settings.zoom || 1,
                minZoom: ((_a = capabilities.zoom) === null || _a === void 0 ? void 0 : _a.min) || 1,
                maxZoom: ((_b = capabilities.zoom) === null || _b === void 0 ? void 0 : _b.max) || 1,
                torchActive: settings.torch || false,
                focusModeActive: !!settings.focusMode,
                currentFocusMode: settings.focusMode || "none",
                supportedFocusModes: capabilities.focusMode || [],
            };
        });
    }
    buildConstraints(resolution) {
        const videoConstraints = {
            deviceId: { exact: this.config.device },
        };
        if (this.config.autoRotation) {
            videoConstraints.width = { exact: resolution.height };
            videoConstraints.height = { exact: resolution.width };
        }
        else {
            videoConstraints.width = { exact: resolution.width };
            videoConstraints.height = { exact: resolution.height };
        }
        if (resolution.aspectRatio) {
            videoConstraints.aspectRatio = { exact: resolution.aspectRatio };
        }
        return {
            video: videoConstraints,
            audio: this.config.audio,
        };
    }
    checkConfiguration() {
        if (!this.config) {
            throw new Error("Please call setupConfiguration() before using webcam");
        }
    }
    handleError(error) {
        this.status = WebcamStatus.ERROR;
        this.lastError = error;
        this.config.onError(this.lastError);
    }
    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        if (this.config.previewElement) {
            this.config.previewElement.srcObject = null;
        }
    }
    resetState() {
        this.stopDeviceChangeTracking();
        this.status = WebcamStatus.IDLE;
        this.capabilities = {
            zoom: false,
            torch: false,
            focusMode: false,
            currentZoom: 1,
            minZoom: 1,
            maxZoom: 1,
            torchActive: false,
            focusModeActive: false,
            currentFocusMode: "none",
            supportedFocusModes: [],
        };
    }
    startDeviceChangeTracking() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.warn("MediaDevices API is not supported in this browser");
            return;
        }
        this.updateDeviceList();
        this.deviceChangeListener = () => this.updateDeviceList();
        navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeListener);
    }
    stopDeviceChangeTracking() {
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeListener);
            this.deviceChangeListener = null;
        }
        // ล้าง callbacks ทั้งหมด
        this.deviceChangeCallbacks = [];
    }
    updateDeviceList() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const devices = yield navigator.mediaDevices.enumerateDevices();
                this.devices = devices.map((device) => ({
                    id: device.deviceId,
                    label: device.label || `${device.kind} (${device.deviceId})`,
                    kind: device.kind,
                }));
                // แจ้งเตือนทุก callback ที่ลงทะเบียนไว้
                this.deviceChangeCallbacks.forEach((callback) => {
                    callback([...this.devices]);
                });
            }
            catch (error) {
                console.error("Error enumerating devices:", error);
            }
        });
    }
}
exports.Webcam = Webcam;
