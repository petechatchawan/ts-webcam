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
exports.Webcam = exports.WebcamStatus = exports.CameraError = void 0;
// ===== Error Class =====
class CameraError extends Error {
    constructor(code, message, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = "CameraError";
    }
}
exports.CameraError = CameraError;
// ===== Enums =====
var WebcamStatus;
(function (WebcamStatus) {
    WebcamStatus["IDLE"] = "idle";
    WebcamStatus["INITIALIZING"] = "initializing";
    WebcamStatus["READY"] = "ready";
    WebcamStatus["ERROR"] = "error";
})(WebcamStatus || (exports.WebcamStatus = WebcamStatus = {}));
class Webcam {
    constructor() {
        // รวม state ทั้งหมดไว้ในที่เดียว
        this.state = {
            status: WebcamStatus.IDLE,
            config: null,
            stream: null,
            lastError: null,
            devices: [],
            capabilities: {
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
            },
            currentOrientation: "portrait-primary",
            currentPermission: {
                camera: "prompt",
                microphone: "prompt",
            },
        };
        this.deviceChangeListener = null;
        this.orientationChangeListener = null;
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
    }
    // Public API methods
    setupConfiguration(config) {
        if (!config.device) {
            throw new CameraError("invalid-device-id", "Device ID is required");
        }
        if (!config.resolutions || config.resolutions.length === 0) {
            throw new CameraError("no-resolutions", "At least one resolution must be specified");
        }
        this.state.config = Object.assign(Object.assign({}, this.defaultConfig), config);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkConfiguration();
            try {
                yield this.initializeWebcam();
            }
            catch (error) {
                if (error instanceof CameraError) {
                    this.handleError(error);
                }
                else {
                    this.handleError(new CameraError("camera-start-error", "Failed to start camera", error));
                }
                throw this.state.lastError;
            }
        });
    }
    stop() {
        this.checkConfiguration();
        this.stopStream();
        this.resetState();
    }
    isActive() {
        return this.state.stream !== null && this.state.stream.active;
    }
    // Device management
    startDeviceTracking() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new CameraError("no-media-devices-support", "MediaDevices API is not supported in this browser");
        }
        // อัปเดตรายการอุปกรณ์ครั้งแรก
        this.updateDeviceList();
        // ตั้งค่า listener สำหรับติดตามการเปลี่ยนแปลง
        this.deviceChangeListener = () => this.updateDeviceList();
        navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeListener);
    }
    stopDeviceTracking() {
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeListener);
            this.deviceChangeListener = null;
        }
    }
    getDeviceList() {
        return [...this.state.devices];
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
    getCurrentDevice() {
        var _a;
        if (!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.device))
            return null;
        return (this.state.devices.find((device) => device.id === this.state.config.device) || null);
    }
    setupChangeListeners() {
        // ติดตามการเปลี่ยนแปลงอุปกรณ์
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new CameraError("no-media-devices-support", "MediaDevices API is not supported in this browser");
        }
        // อัปเดตรายการอุปกรณ์ครั้งแรก
        this.updateDeviceList();
        // ตั้งค่า device change listener
        this.deviceChangeListener = () => __awaiter(this, void 0, void 0, function* () {
            yield this.updateDeviceList();
            // ตรวจสอบว่าอุปกรณ์ปัจจุบันยังคงมีอยู่หรือไม่
            const currentDevice = this.getCurrentDevice();
            if (this.isActive() && !currentDevice) {
                // ถ้าอุปกรณ์ปัจจุบันหายไป ให้หยุดการทำงาน
                this.handleError(new CameraError("no-device", "Current device is no longer available"));
                this.stop();
            }
        });
        // ตั้งค่า orientation change listener
        this.orientationChangeListener = () => {
            if (this.isActive()) {
                if (screen.orientation) {
                    console.log("Screen orientation is supported");
                    const orientation = screen.orientation.type;
                    const angle = screen.orientation.angle;
                    console.log(`Orientation type: ${orientation}, angle: ${angle}`);
                    // เก็บค่า orientation ปัจจุบัน
                    this.state.currentOrientation = orientation;
                    switch (orientation) {
                        case "portrait-primary":
                            console.log("Portrait (ปกติ)");
                            break;
                        case "portrait-secondary":
                            console.log("Portrait (กลับหัว)");
                            break;
                        case "landscape-primary":
                            console.log("Landscape (ปกติ)");
                            break;
                        case "landscape-secondary":
                            console.log("Landscape (กลับด้าน)");
                            break;
                        default:
                            console.log("Unknown orientation");
                            this.state.currentOrientation = "unknown";
                    }
                }
                else {
                    console.log("screen.orientation is not supported");
                    this.state.currentOrientation = "unknown";
                }
            }
        };
        // เพิ่ม listeners
        navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeListener);
        window.addEventListener("orientationchange", this.orientationChangeListener);
    }
    stopChangeListeners() {
        // ลบ device change listener
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeListener);
            this.deviceChangeListener = null;
        }
        // ลบ orientation change listener
        if (this.orientationChangeListener) {
            window.removeEventListener("orientationchange", this.orientationChangeListener);
            this.orientationChangeListener = null;
        }
    }
    // State and capabilities
    getState() {
        return Object.assign({}, this.state);
    }
    getStatus() {
        return this.state.status;
    }
    getLastError() {
        return this.state.lastError;
    }
    clearError() {
        // ล้าง error และกลับไปที่สถานะ IDLE ถ้าไม่ได้ active อยู่
        this.state.lastError = null;
        if (!this.isActive()) {
            this.state.status = WebcamStatus.IDLE;
        }
    }
    getCapabilities() {
        return Object.assign({}, this.state.capabilities);
    }
    getCurrentResolution() {
        // ถ้าไม่มี stream หรือไม่มี config ให้คืนค่า null
        if (!this.state.stream || !this.state.config)
            return null;
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        // หาชื่อ resolution ที่ตรงกับขนาดปัจจุบัน
        const currentWidth = this.state.config.autoRotation
            ? settings.height || 0
            : settings.width || 0;
        const currentHeight = this.state.config.autoRotation
            ? settings.width || 0
            : settings.height || 0;
        // หา resolution ที่ตรงกับขนาดปัจจุบันจากรายการที่กำหนดไว้
        const matchedResolution = this.state.config.resolutions.find((r) => r.width === currentWidth && r.height === currentHeight);
        return {
            name: (matchedResolution === null || matchedResolution === void 0 ? void 0 : matchedResolution.name) || `${currentWidth}x${currentHeight}`,
            width: currentWidth,
            height: currentHeight,
            aspectRatio: settings.aspectRatio,
        };
    }
    // Camera controls
    setZoom(zoomLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.stream || !this.state.capabilities.zoom) {
                throw new CameraError("zoom-not-supported", "Zoom is not supported or camera is not active");
            }
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.zoom) {
                throw new CameraError("zoom-not-supported", "Zoom is not supported by this device");
            }
            try {
                zoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
                yield videoTrack.applyConstraints({
                    advanced: [{ zoom: zoomLevel }],
                });
                this.state.capabilities.currentZoom = zoomLevel;
            }
            catch (error) {
                throw new CameraError("camera-settings-error", "Failed to set zoom level", error);
            }
        });
    }
    setTorch(active) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.stream || !this.state.capabilities.torch) {
                throw new CameraError("torch-not-supported", "Torch is not supported or camera is not active");
            }
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.torch) {
                throw new CameraError("torch-not-supported", "Torch is not supported by this device");
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [{ torch: active }],
                });
                this.state.capabilities.torchActive = active;
            }
            catch (error) {
                throw new CameraError("camera-settings-error", "Failed to toggle torch", error);
            }
        });
    }
    setFocusMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.stream || !this.state.capabilities.focusMode) {
                throw new CameraError("focus-not-supported", "Focus mode is not supported or camera is not active");
            }
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
                throw new CameraError("focus-not-supported", `Focus mode ${mode} is not supported by this device`);
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [{ focusMode: mode }],
                });
                this.state.capabilities.currentFocusMode = mode;
                this.state.capabilities.focusModeActive = true;
            }
            catch (error) {
                throw new CameraError("camera-settings-error", "Failed to set focus mode", error);
            }
        });
    }
    updateConfig(newConfig) {
        this.checkConfiguration();
        const wasActive = this.isActive();
        if (wasActive) {
            this.stop();
        }
        this.state.config = Object.assign(Object.assign({}, this.state.config), newConfig);
        if (wasActive) {
            this.start().catch(this.state.config.onError);
        }
    }
    // Permission management
    checkCameraPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query) {
                    const { state } = yield navigator.permissions.query({
                        name: "camera",
                    });
                    this.state.currentPermission.camera = state;
                    return state;
                }
                this.state.currentPermission.camera = "prompt";
                return "prompt";
            }
            catch (error) {
                console.warn("Permissions API error:", error);
                this.state.currentPermission.camera = "prompt";
                return "prompt";
            }
        });
    }
    checkMicrophonePermission() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query) {
                    const { state } = yield navigator.permissions.query({
                        name: "microphone",
                    });
                    this.state.currentPermission.microphone = state;
                    return state;
                }
                this.state.currentPermission.microphone = "prompt";
                return "prompt";
            }
            catch (error) {
                console.warn("Permissions API error:", error);
                this.state.currentPermission.microphone = "prompt";
                return "prompt";
            }
        });
    }
    requestMediaPermission(mediaType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield navigator.mediaDevices.getUserMedia({
                    [mediaType]: true,
                });
                stream.getTracks().forEach((track) => track.stop());
                const permissionType = mediaType === "video" ? "camera" : "microphone";
                this.state.currentPermission[permissionType] = "granted";
                return "granted";
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === "NotAllowedError" ||
                        error.name === "PermissionDeniedError") {
                        const permissionType = mediaType === "video" ? "camera" : "microphone";
                        this.state.currentPermission[permissionType] = "denied";
                        return "denied";
                    }
                }
                const permissionType = mediaType === "video" ? "camera" : "microphone";
                this.state.currentPermission[permissionType] = "prompt";
                return "prompt";
            }
        });
    }
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // ขอสิทธิ์กล้องก่อนเสมอ
            const cameraPermission = yield this.requestMediaPermission("video");
            // ขอสิทธิ์ไมโครโฟนเฉพาะเมื่อต้องการใช้งาน
            let microphonePermission = "prompt";
            if ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audio) {
                microphonePermission = yield this.requestMediaPermission("audio");
            }
            return {
                camera: cameraPermission,
                microphone: microphonePermission,
            };
        });
    }
    // เพิ่มเมธอดใหม่สำหรับตรวจสอบสถานะสิทธิ์ปัจจุบัน
    getCurrentPermissions() {
        return Object.assign({}, this.state.currentPermission);
    }
    // เพิ่มเมธอดสำหรับตรวจสอบว่าต้องขอสิทธิ์หรือไม่
    needsPermissionRequest() {
        var _a;
        return (this.state.currentPermission.camera === "prompt" ||
            (!!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audio) &&
                this.state.currentPermission.microphone === "prompt"));
    }
    // เพิ่มเมธอดสำหรับตรวจสอบว่าถูกปฏิเสธสิทธิ์หรือไม่
    hasPermissionDenied() {
        var _a;
        return (this.state.currentPermission.camera === "denied" ||
            (!!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audio) &&
                this.state.currentPermission.microphone === "denied"));
    }
    // Private helper methods
    initializeWebcam() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.status = WebcamStatus.INITIALIZING;
            this.state.lastError = null;
            const permissions = yield this.requestPermissions();
            this.validatePermissions(permissions);
            yield this.openCamera();
        });
    }
    openCamera() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const resolution of this.state.config.resolutions) {
                try {
                    yield this.tryResolution(resolution);
                    return;
                }
                catch (error) {
                    console.log(`Failed to open camera with resolution: ${resolution.name}. Error:`, error);
                    continue;
                }
            }
            if (this.state.config.allowAnyResolution) {
                yield this.tryAnyResolution();
            }
            else {
                throw new CameraError("configuration-error", `Unable to open camera with specified resolutions: ${this.state
                    .config.resolutions.map((r) => `${r.name} (${r.width}x${r.height})`)
                    .join(", ")}`);
            }
        });
    }
    tryResolution(resolution) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`);
            const constraints = this.buildConstraints(resolution);
            this.state.stream = yield navigator.mediaDevices.getUserMedia(constraints);
            yield this.updateCapabilities();
            yield this.setupPreviewElement();
            console.log(`Successfully opened camera with resolution: ${resolution.name}`);
            this.state.status = WebcamStatus.READY;
            this.state.config.onStart();
        });
    }
    tryAnyResolution() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Attempting to open camera with any supported resolution");
            const constraints = {
                video: {
                    deviceId: { exact: this.state.config.device },
                },
                audio: this.state.config.audio,
            };
            this.state.stream = yield navigator.mediaDevices.getUserMedia(constraints);
            yield this.updateCapabilities();
            yield this.setupPreviewElement();
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log(`Opened camera with resolution: ${settings.width}x${settings.height}`);
            this.state.status = WebcamStatus.READY;
            this.state.config.onStart();
        });
    }
    setupPreviewElement() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.config.previewElement && this.state.stream) {
                this.state.config.previewElement.srcObject = this.state.stream;
                this.state.config.previewElement.style.transform = this.state.config
                    .mirror
                    ? "scaleX(-1)"
                    : "none";
                yield this.state.config.previewElement.play();
            }
        });
    }
    updateCapabilities() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.state.stream)
                return;
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            const settings = videoTrack.getSettings();
            this.state.capabilities = {
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
            deviceId: { exact: this.state.config.device },
        };
        if (this.state.config.autoRotation) {
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
            audio: this.state.config.audio,
        };
    }
    checkConfiguration() {
        if (!this.state.config) {
            throw new CameraError("configuration-error", "Please call setupConfiguration() before using webcam");
        }
    }
    handleError(error) {
        var _a;
        // เก็บ error และเปลี่ยนสถานะเป็น ERROR
        this.state.status = WebcamStatus.ERROR;
        this.state.lastError =
            error instanceof CameraError
                ? error
                : new CameraError("unknown", error.message, error);
        // เรียก callback onError ถ้ามี config
        if ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onError) {
            this.state.config.onError(this.state.lastError);
        }
    }
    stopStream() {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach((track) => track.stop());
            this.state.stream = null;
        }
        if (this.state.config.previewElement) {
            this.state.config.previewElement.srcObject = null;
        }
    }
    resetState() {
        this.stopChangeListeners();
        // Reset เฉพาะ state ที่เกี่ยวข้องกับการทำงานปัจจุบัน
        this.state = Object.assign(Object.assign({}, this.state), { status: WebcamStatus.IDLE, stream: null, lastError: null, capabilities: {
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
            } });
    }
    updateDeviceList() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const devices = yield navigator.mediaDevices.enumerateDevices();
                this.state.devices = devices.map((device) => ({
                    id: device.deviceId,
                    label: device.label || `${device.kind} (${device.deviceId})`,
                    kind: device.kind,
                }));
            }
            catch (error) {
                console.error("Error enumerating devices:", error);
            }
        });
    }
    validatePermissions(permissions) {
        if (permissions.camera === "denied") {
            throw new CameraError("permission-denied", "กรุณาอนุญาตให้ใช้งานกล้อง");
        }
        if (this.state.config.audio && permissions.microphone === "denied") {
            throw new CameraError("microphone-permission-denied", "กรุณาอนุญาตให้ใช้งานไมโครโฟน");
        }
    }
}
exports.Webcam = Webcam;
