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
        this.name = 'CameraError';
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
        // Combine all states in one place
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
                currentFocusMode: 'none',
                supportedFocusModes: [],
            },
            currentOrientation: 'portrait-primary',
            currentPermission: {
                camera: 'prompt',
                microphone: 'prompt',
            },
            captureCanvas: document.createElement('canvas'),
        };
        this.deviceChangeListener = null;
        this.orientationChangeListener = null;
        // Default values
        this.defaultConfig = {
            audio: false,
            device: '',
            allowAnyResolution: false,
            mirror: false,
            autoRotation: true,
            previewElement: undefined,
            onStart: () => { },
            onError: () => { },
        };
        // Don't call getAvailableDevices in constructor
        // Create canvas element for image capture
        const canvas = document.createElement('canvas');
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
                currentFocusMode: 'none',
                supportedFocusModes: [],
            },
            captureCanvas: canvas,
            currentOrientation: 'portrait-primary',
            currentPermission: {
                camera: 'prompt',
                microphone: 'prompt',
            },
        };
    }
    // Public API methods
    setupConfiguration(config) {
        if (!config.device) {
            throw new CameraError('invalid-device-id', 'Device ID is required');
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
                    this.handleError(new CameraError('camera-start-error', 'Failed to start camera', error));
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
    getAvailableDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!navigator.mediaDevices ||
                    !navigator.mediaDevices.enumerateDevices) {
                    throw new CameraError('no-media-devices-support', 'MediaDevices API is not supported in this browser');
                }
                this.state.devices =
                    yield navigator.mediaDevices.enumerateDevices();
                return [...this.state.devices];
            }
            catch (error) {
                this.handleError(new CameraError('device-list-error', 'Failed to get device list', error));
                return [];
            }
        });
    }
    getDeviceList() {
        return [...this.state.devices];
    }
    getVideoDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // If no device information, call getAvailableDevices first
            if (this.state.devices.length === 0) {
                yield this.getAvailableDevices();
            }
            return this.state.devices.filter((device) => device.kind === 'videoinput');
        });
    }
    getAudioInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // If no device information, call getAvailableDevices first
            if (this.state.devices.length === 0) {
                yield this.getAvailableDevices();
            }
            return this.state.devices.filter((device) => device.kind === 'audioinput');
        });
    }
    getAudioOutputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // If no device information, call getAvailableDevices first
            if (this.state.devices.length === 0) {
                yield this.getAvailableDevices();
            }
            return this.state.devices.filter((device) => device.kind === 'audiooutput');
        });
    }
    refreshDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getAvailableDevices();
        });
    }
    getCurrentDevice() {
        var _a;
        if (!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.device))
            return null;
        return (this.state.devices.find((device) => device.deviceId === this.state.config.device) || null);
    }
    setupChangeListeners() {
        // Add device change listener
        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.enumerateDevices) {
            throw new CameraError('no-media-devices-support', 'MediaDevices API is not supported in this browser');
        }
        // Update device list for the first time
        this.refreshDevices();
        // Set device change listener
        this.deviceChangeListener = () => __awaiter(this, void 0, void 0, function* () {
            yield this.refreshDevices();
            // Check if current device still exists
            const currentDevice = this.getCurrentDevice();
            if (this.isActive() && !currentDevice) {
                // If current device is gone, stop the operation
                this.handleError(new CameraError('no-device', 'Current device is no longer available'));
                this.stop();
            }
        });
        // Set orientation change listener
        this.orientationChangeListener = () => {
            if (this.isActive()) {
                if (screen.orientation) {
                    console.log('Screen orientation is supported');
                    const orientation = screen.orientation
                        .type;
                    const angle = screen.orientation.angle;
                    console.log(`Orientation type: ${orientation}, angle: ${angle}`);
                    // Store current orientation
                    this.state.currentOrientation = orientation;
                    switch (orientation) {
                        case 'portrait-primary':
                            console.log('Portrait (normal)');
                            break;
                        case 'portrait-secondary':
                            console.log('Portrait (flipped)');
                            break;
                        case 'landscape-primary':
                            console.log('Landscape (normal)');
                            break;
                        case 'landscape-secondary':
                            console.log('Landscape (flipped)');
                            break;
                        default:
                            console.log('Unknown orientation');
                            this.state.currentOrientation = 'unknown';
                    }
                }
                else {
                    console.log('screen.orientation is not supported');
                    this.state.currentOrientation = 'unknown';
                }
            }
        };
        // Add listeners
        navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
        window.addEventListener('orientationchange', this.orientationChangeListener);
    }
    stopChangeListeners() {
        // Remove device change listener
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
            this.deviceChangeListener = null;
        }
        // Remove orientation change listener
        if (this.orientationChangeListener) {
            window.removeEventListener('orientationchange', this.orientationChangeListener);
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
        // Clear error and go back to IDLE state if not active
        this.state.lastError = null;
        if (!this.isActive()) {
            this.state.status = WebcamStatus.IDLE;
        }
    }
    getCapabilities() {
        return Object.assign({}, this.state.capabilities);
    }
    getCurrentResolution() {
        // If no stream or no config, return null
        if (!this.state.stream || !this.state.config)
            return null;
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        // Find resolution name that matches current size
        const currentWidth = this.state.config.autoRotation
            ? settings.height || 0
            : settings.width || 0;
        const currentHeight = this.state.config.autoRotation
            ? settings.width || 0
            : settings.height || 0;
        // Find resolution that matches current size from specified list
        const matchedResolution = this.state.config.resolution instanceof Array
            ? this.state.config.resolution.find((r) => r.width === currentWidth &&
                r.height === currentHeight)
            : this.state.config.resolution;
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
                throw new CameraError('zoom-not-supported', 'Zoom is not supported or camera is not active');
            }
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.zoom) {
                throw new CameraError('zoom-not-supported', 'Zoom is not supported by this device');
            }
            try {
                zoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
                yield videoTrack.applyConstraints({
                    advanced: [
                        { zoom: zoomLevel },
                    ],
                });
                this.state.capabilities.currentZoom = zoomLevel;
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to set zoom level', error);
            }
        });
    }
    setTorch(active) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.stream || !this.state.capabilities.torch) {
                throw new CameraError('torch-not-supported', 'Torch is not supported or camera is not active');
            }
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.torch) {
                throw new CameraError('torch-not-supported', 'Torch is not supported by this device');
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [
                        { torch: active },
                    ],
                });
                this.state.capabilities.torchActive = active;
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to toggle torch', error);
            }
        });
    }
    setFocusMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.stream || !this.state.capabilities.focusMode) {
                throw new CameraError('focus-not-supported', 'Focus mode is not supported or camera is not active');
            }
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
                throw new CameraError('focus-not-supported', `Focus mode ${mode} is not supported by this device`);
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [
                        { focusMode: mode },
                    ],
                });
                this.state.capabilities.currentFocusMode = mode;
                this.state.capabilities.focusModeActive = true;
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to set focus mode', error);
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
            this.start().catch(this.handleError);
        }
    }
    // Permission management
    checkCameraPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query) {
                    const { state } = yield navigator.permissions.query({
                        name: 'camera',
                    });
                    this.state.currentPermission.camera = state;
                    return state;
                }
                this.state.currentPermission.camera = 'prompt';
                return 'prompt';
            }
            catch (error) {
                console.warn('Permissions API error:', error);
                this.state.currentPermission.camera = 'prompt';
                return 'prompt';
            }
        });
    }
    checkMicrophonePermission() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query) {
                    const { state } = yield navigator.permissions.query({
                        name: 'microphone',
                    });
                    this.state.currentPermission.microphone =
                        state;
                    return state;
                }
                this.state.currentPermission.microphone = 'prompt';
                return 'prompt';
            }
            catch (error) {
                console.warn('Permissions API error:', error);
                this.state.currentPermission.microphone = 'prompt';
                return 'prompt';
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
                const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                this.state.currentPermission[permissionType] = 'granted';
                return 'granted';
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === 'NotAllowedError' ||
                        error.name === 'PermissionDeniedError') {
                        const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                        this.state.currentPermission[permissionType] = 'denied';
                        return 'denied';
                    }
                }
                const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                this.state.currentPermission[permissionType] = 'prompt';
                return 'prompt';
            }
        });
    }
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Request camera permission first
            const cameraPermission = yield this.requestMediaPermission('video');
            // Request microphone permission only if needed
            let microphonePermission = 'prompt';
            if ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audio) {
                microphonePermission = yield this.requestMediaPermission('audio');
            }
            return {
                camera: cameraPermission,
                microphone: microphonePermission,
            };
        });
    }
    // Add new method for checking current permission status
    getCurrentPermissions() {
        return Object.assign({}, this.state.currentPermission);
    }
    // Add method for checking if permission is needed
    needsPermissionRequest() {
        var _a;
        return (this.state.currentPermission.camera === 'prompt' ||
            (!!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audio) &&
                this.state.currentPermission.microphone === 'prompt'));
    }
    // Add method for checking if permission is denied
    hasPermissionDenied() {
        var _a;
        return (this.state.currentPermission.camera === 'denied' ||
            (!!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audio) &&
                this.state.currentPermission.microphone === 'denied'));
    }
    // Add method for toggling mirror mode
    toggleMirrorMode() {
        this.checkConfiguration();
        this.state.config.mirror = !this.state.config.mirror;
        if (this.state.config.previewElement) {
            this.state.config.previewElement.style.transform = this.state
                .config.mirror
                ? 'scaleX(-1)'
                : 'none';
        }
    }
    // Method for capturing image
    captureImage(config = {}) {
        this.checkConfiguration();
        if (!this.state.stream) {
            throw new CameraError('no-stream', 'No active stream to capture image from');
        }
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        // Use canvas from state
        const canvas = this.state.captureCanvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new CameraError('camera-settings-error', 'Failed to get canvas context');
        }
        const scale = config.scale || 1;
        canvas.width = (settings.width || 640) * scale;
        canvas.height = (settings.height || 480) * scale;
        if (this.state.config.mirror) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(this.state.config.previewElement, 0, 0, canvas.width, canvas.height);
        // Reset transform matrix
        if (this.state.config.mirror) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
        const mediaType = config.mediaType || 'image/png';
        const quality = typeof config.quality === 'number'
            ? Math.min(Math.max(config.quality, 0), 1) // Constrain value between 0-1
            : mediaType === 'image/jpeg'
                ? 0.92
                : undefined; // Default value for JPEG
        return canvas.toDataURL(mediaType, quality);
    }
    // Add method for checking device capabilities
    checkDevicesCapabilitiesData(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            try {
                // Request camera permission first
                const stream = yield navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: deviceId } },
                });
                const videoTrack = stream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();
                // Store supported resolution information
                const supportedResolutions = [];
                // Check width and height support
                if (((_a = capabilities.width) === null || _a === void 0 ? void 0 : _a.max) &&
                    ((_b = capabilities.width) === null || _b === void 0 ? void 0 : _b.min) &&
                    ((_c = capabilities.width) === null || _c === void 0 ? void 0 : _c.step) &&
                    ((_d = capabilities.height) === null || _d === void 0 ? void 0 : _d.max) &&
                    ((_e = capabilities.height) === null || _e === void 0 ? void 0 : _e.min) &&
                    ((_f = capabilities.height) === null || _f === void 0 ? void 0 : _f.step)) {
                    const widths = Array.from({
                        length: Math.floor((capabilities.width.max -
                            capabilities.width.min) /
                            capabilities.width.step) + 1,
                    }, (_, i) => capabilities.width.min + i * capabilities.width.step);
                    const heights = Array.from({
                        length: Math.floor((capabilities.height.max -
                            capabilities.height.min) /
                            capabilities.height.step) + 1,
                    }, (_, i) => capabilities.height.min +
                        i * capabilities.height.step);
                    // Create resolution list that is possible
                    for (const width of widths) {
                        for (const height of heights) {
                            const aspectRatio = width / height;
                            // Filter out only standard aspect ratio resolutions (e.g. 16:9, 4:3)
                            if (Math.abs(aspectRatio - 16 / 9) < 0.1 ||
                                Math.abs(aspectRatio - 4 / 3) < 0.1) {
                                supportedResolutions.push({
                                    width,
                                    height,
                                    aspectRatio,
                                });
                            }
                        }
                    }
                }
                // Store frame rate information
                const frameRates = [];
                if (((_g = capabilities.frameRate) === null || _g === void 0 ? void 0 : _g.min) &&
                    ((_h = capabilities.frameRate) === null || _h === void 0 ? void 0 : _h.max) &&
                    ((_j = capabilities.frameRate) === null || _j === void 0 ? void 0 : _j.step)) {
                    const { min, max, step } = capabilities.frameRate;
                    for (let fps = min; fps <= max; fps += step) {
                        frameRates.push(fps);
                    }
                }
                // Stop camera usage
                stream.getTracks().forEach((track) => track.stop());
                return {
                    deviceId,
                    maxWidth: ((_k = capabilities.width) === null || _k === void 0 ? void 0 : _k.max) || 0,
                    maxHeight: ((_l = capabilities.height) === null || _l === void 0 ? void 0 : _l.max) || 0,
                    minWidth: ((_m = capabilities.width) === null || _m === void 0 ? void 0 : _m.min) || 0,
                    minHeight: ((_o = capabilities.height) === null || _o === void 0 ? void 0 : _o.min) || 0,
                    supportedResolutions,
                    supportedFrameRates: frameRates,
                    hasZoom: !!capabilities.zoom,
                    hasTorch: !!capabilities.torch,
                    hasFocus: !!capabilities.focusMode,
                    maxZoom: (_p = capabilities.zoom) === null || _p === void 0 ? void 0 : _p.max,
                    minZoom: (_q = capabilities.zoom) === null || _q === void 0 ? void 0 : _q.min,
                    supportedFocusModes: capabilities.focusMode,
                };
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to check device capabilities', error);
            }
        });
    }
    // Add method for checking resolution support
    checkSupportedResolutions(deviceCapabilities, desiredResolutions) {
        // Use first device capability (or can choose)
        const capability = deviceCapabilities[0];
        // Create device information
        const deviceInfo = {
            deviceId: capability.deviceId,
            maxWidth: capability.maxWidth,
            maxHeight: capability.maxHeight,
            minWidth: capability.minWidth,
            minHeight: capability.minHeight,
        };
        // Check each resolution
        const resolutions = desiredResolutions.map((resolution) => {
            // Check if resolution is within supported range
            // Camera will support if width and height are not exceeding maximum supported by camera
            const isSupported = resolution.width <= capability.maxWidth &&
                resolution.height <= capability.maxHeight &&
                resolution.width >= capability.minWidth &&
                resolution.height >= capability.minHeight;
            return {
                name: resolution.name,
                width: resolution.width,
                height: resolution.height,
                aspectRatio: resolution.aspectRatio ||
                    resolution.width / resolution.height,
                supported: isSupported,
            };
        });
        return {
            resolutions,
            deviceInfo,
        };
    }
    initializeWebcam() {
        return __awaiter(this, void 0, void 0, function* () {
            // set status to initializing
            this.state.status = WebcamStatus.INITIALIZING;
            this.state.lastError = null;
            // request permissions
            const permissions = yield this.requestPermissions();
            this.validatePermissions(permissions);
            // open camera
            yield this.openCamera();
        });
    }
    openCamera() {
        return __awaiter(this, void 0, void 0, function* () {
            // Case: No resolution specified - use supported resolution
            if (!this.state.config.resolution) {
                try {
                    yield this.tryAnyResolution();
                    return;
                }
                catch (error) {
                    throw new CameraError('camera-initialization-error', 'Failed to open camera with supported resolution', error);
                }
            }
            // Case: Resolution specified
            const resolutions = this.state.config.resolution instanceof Array
                ? this.state.config.resolution
                : [this.state.config.resolution];
            // Case: allowAnyResolution = false
            // Try only first resolution, throw error immediately if fails
            if (!this.state.config.allowAnyResolution) {
                try {
                    yield this.tryResolution(resolutions[0]);
                }
                catch (error) {
                    throw new CameraError('camera-initialization-error', `Failed to open camera with specified resolution: ${resolutions[0].name}`, error);
                }
                return;
            }
            // Case: allowAnyResolution = true
            // 1. Try all specified resolutions in order
            let lastError = null;
            for (const resolution of resolutions) {
                try {
                    yield this.tryResolution(resolution);
                    return;
                }
                catch (error) {
                    lastError = error;
                    console.log(`Failed to open camera with resolution: ${resolution.name}. Error:`, error);
                }
            }
            // 2. If all fail, try any supported resolution
            try {
                console.log('Attempting to use any supported resolution...');
                yield this.tryAnyResolution();
            }
            catch (error) {
                throw new CameraError('camera-initialization-error', 'Failed to open camera with any resolution', lastError || error);
            }
        });
    }
    tryResolution(resolution) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            console.log(`Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`);
            const constraints = this.buildConstraints(resolution);
            this.state.stream =
                yield navigator.mediaDevices.getUserMedia(constraints);
            yield this.updateCapabilities();
            yield this.setupPreviewElement();
            console.log(`Successfully opened camera with resolution: ${resolution.name}`);
            this.state.status = WebcamStatus.READY;
            (_b = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onStart) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
    }
    tryAnyResolution() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            console.log('Attempting to open camera with any supported resolution (ideal: 4K)');
            // Request device capability information first
            const devices = yield navigator.mediaDevices.enumerateDevices();
            const device = devices.find((d) => d.deviceId === this.state.config.device);
            if (!device) {
                throw new CameraError('no-device', 'Selected device not found');
            }
            // Create constraints specifying ideal resolution as 4K
            const constraints = {
                audio: this.state.config.audio,
                video: {
                    deviceId: { exact: this.state.config.device },
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                },
            };
            try {
                this.state.stream =
                    yield navigator.mediaDevices.getUserMedia(constraints);
                yield this.updateCapabilities();
                yield this.setupPreviewElement();
                const videoTrack = this.state.stream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                console.log(`Opened camera with resolution: ${settings.width}x${settings.height}`);
                this.state.status = WebcamStatus.READY;
                (_b = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onStart) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (error) {
                throw new CameraError('camera-initialization-error', 'Failed to initialize camera with any resolution', error);
            }
        });
    }
    setupPreviewElement() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.config.previewElement && this.state.stream) {
                this.state.config.previewElement.srcObject = this.state.stream;
                this.state.config.previewElement.style.transform = this.state
                    .config.mirror
                    ? 'scaleX(-1)'
                    : 'none';
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
                currentFocusMode: settings.focusMode || 'none',
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
            throw new CameraError('configuration-error', 'Please call setupConfiguration() before using webcam');
        }
    }
    handleError(error) {
        var _a, _b;
        // Store error and change state to ERROR
        this.state.status = WebcamStatus.ERROR;
        this.state.lastError =
            error instanceof CameraError
                ? error
                : new CameraError('unknown', error.message, error);
        // Call callback onError if config exists
        (_b = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.lastError);
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
        // Reset only basic system state
        this.state = Object.assign(Object.assign({}, this.state), { status: WebcamStatus.IDLE, stream: null, lastError: null, capabilities: {
                zoom: false,
                torch: false,
                focusMode: false,
                currentZoom: 1,
                minZoom: 1,
                maxZoom: 1,
                torchActive: false,
                focusModeActive: false,
                currentFocusMode: 'none',
                supportedFocusModes: [],
            } });
    }
    validatePermissions(permissions) {
        if (permissions.camera === 'denied') {
            throw new CameraError('permission-denied', 'Please allow camera access');
        }
        if (this.state.config.audio && permissions.microphone === 'denied') {
            throw new CameraError('microphone-permission-denied', 'Please allow microphone access');
        }
    }
}
exports.Webcam = Webcam;
