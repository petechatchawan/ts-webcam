var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { UAInfo } from 'ua-info';
import { WebcamStatus } from './types';
import { WebcamError } from './errors';
import { DEFAULT_CONFIG, DEFAULT_CAPABILITIES, DEFAULT_STATE, } from './constants';
import { createResolution, buildConstraints, validatePermissions, stopStream } from './utils';
export class Webcam {
    constructor() {
        this.deviceChangeListener = null;
        this.orientationChangeListener = null;
        this.uaInfo = new UAInfo();
        this.uaInfo.setUserAgent(navigator.userAgent);
        this.state = Object.assign(Object.assign({}, DEFAULT_STATE), { captureCanvas: document.createElement('canvas'), status: WebcamStatus.IDLE });
    }
    // Public Methods
    getState() {
        return Object.assign({}, this.state);
    }
    getStatus() {
        return this.state.status;
    }
    getCapabilities() {
        return Object.assign({}, this.state.capabilities);
    }
    getLastError() {
        return this.state.lastError;
    }
    clearError() {
        this.state.lastError = null;
        if (!this.isActive()) {
            this.state.status = WebcamStatus.IDLE;
        }
    }
    isActive() {
        return this.state.activeStream !== null && this.state.activeStream.active;
    }
    isAudioEnabled() {
        var _a;
        return ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audioEnabled) || false;
    }
    isMirrorEnabled() {
        var _a;
        return ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.mirrorEnabled) || false;
    }
    isResolutionSwapAllowed() {
        var _a;
        return ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.allowResolutionSwap) || false;
    }
    isAnyResolutionAllowed() {
        var _a;
        return ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.allowAnyResolution) || false;
    }
    isZoomSupported() {
        return this.state.capabilities.zoomSupported;
    }
    isTorchSupported() {
        return this.state.capabilities.torchSupported;
    }
    isFocusSupported() {
        return this.state.capabilities.focusSupported;
    }
    getZoomLevel() {
        return this.state.capabilities.zoomLevel;
    }
    getMinZoomLevel() {
        return this.state.capabilities.minZoomLevel;
    }
    getMaxZoomLevel() {
        return this.state.capabilities.maxZoomLevel;
    }
    isTorchActive() {
        return this.state.capabilities.torchActive;
    }
    isFocusActive() {
        return this.state.capabilities.focusActive;
    }
    setupConfiguration(configuration) {
        if (!configuration.device) {
            throw new WebcamError('invalid-device-id', 'Device ID is required');
        }
        this.state.config = Object.assign(Object.assign({}, DEFAULT_CONFIG), configuration);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkConfiguration();
            try {
                yield this.initializeWebcam();
            }
            catch (error) {
                if (error instanceof WebcamError) {
                    this.handleError(error);
                }
                else {
                    this.handleError(new WebcamError('webcam-start-error', 'Failed to start webcam', error));
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
    previewIsReady() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const video = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.previewElement;
            if (!video) {
                return false;
            }
            if (video.readyState >= 2) {
                return true;
            }
            const onCanPlay = () => {
                video.removeEventListener('canplay', onCanPlay);
                return true;
            };
            const onError = () => {
                video.removeEventListener('error', onError);
                return false;
            };
            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', onError);
            return false;
        });
    }
    setZoom(zoomLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.activeStream || !this.state.capabilities.zoomSupported) {
                throw new WebcamError('zoom-not-supported', 'Zoom is not supported or webcam is not active');
            }
            const videoTrack = this.state.activeStream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.zoom) {
                throw new WebcamError('zoom-not-supported', 'Zoom is not supported by this device');
            }
            try {
                const constrainedZoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
                yield videoTrack.applyConstraints({
                    advanced: [{ zoom: constrainedZoomLevel }],
                });
                this.state.capabilities.zoomLevel = constrainedZoomLevel;
            }
            catch (error) {
                throw new WebcamError('webcam-settings-error', 'Failed to set zoom level', error);
            }
        });
    }
    setTorch(active) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.activeStream || !this.state.capabilities.torchSupported) {
                throw new WebcamError('torch-not-supported', 'Torch is not supported or webcam is not active');
            }
            const videoTrack = this.state.activeStream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.torch) {
                throw new WebcamError('torch-not-supported', 'Torch is not supported by this device');
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [{ torch: active }],
                });
                this.state.capabilities.torchActive = active;
            }
            catch (error) {
                throw new WebcamError('webcam-settings-error', 'Failed to set torch mode', error);
            }
        });
    }
    setFocusMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.activeStream || !this.state.capabilities.focusSupported) {
                throw new WebcamError('focus-not-supported', 'Focus mode is not supported or webcam is not active');
            }
            const videoTrack = this.state.activeStream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
                throw new WebcamError('focus-not-supported', `Focus mode '${mode}' is not supported by this device`);
            }
            try {
                yield videoTrack.applyConstraints({
                    advanced: [{ focusMode: mode }],
                });
                this.state.capabilities.currentFocusMode = mode;
                this.state.capabilities.focusActive = true;
            }
            catch (error) {
                throw new WebcamError('webcam-settings-error', 'Failed to set focus mode', error);
            }
        });
    }
    toggleTorch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isTorchSupported()) {
                throw new WebcamError('torch-not-supported', 'Torch is not supported by this device');
            }
            const newTorchState = !this.state.capabilities.torchActive;
            yield this.setTorch(newTorchState);
            return newTorchState;
        });
    }
    toggleMirror() {
        this.checkConfiguration();
        const newValue = !this.state.config.mirrorEnabled;
        this.updateConfiguration({ mirrorEnabled: newValue }, { restart: false });
        return newValue;
    }
    createResolution(name, width, height) {
        return createResolution(name, width, height);
    }
    updateConfiguration(configuration, options = { restart: true }) {
        this.checkConfiguration();
        const wasActive = this.isActive();
        if (wasActive && options.restart) {
            this.stop();
        }
        this.state.config = Object.assign(Object.assign({}, this.state.config), configuration);
        if ('mirror' in configuration && this.state.config.previewElement) {
            this.state.config.previewElement.style.transform = this.state.config.mirrorEnabled
                ? 'scaleX(-1)'
                : 'none';
        }
        if (wasActive && options.restart) {
            this.start().catch(this.handleError);
        }
        return Object.assign({}, this.state.config);
    }
    updateResolution(resolution) {
        return this.updateConfiguration({ resolution }, { restart: true });
    }
    updateDevice(device) {
        return this.updateConfiguration({ device }, { restart: true });
    }
    toggle(setting) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkConfiguration();
            const newValue = !this.state.config[setting];
            if (setting === 'audioEnabled' && newValue) {
                const micPermission = yield this.checkMicrophonePermission();
                if (micPermission === 'prompt') {
                    const permission = yield this.requestMediaPermission('audio');
                    if (permission === 'denied') {
                        throw new WebcamError('microphone-permission-denied', 'Please allow microphone access');
                    }
                }
                else if (micPermission === 'denied') {
                    throw new WebcamError('microphone-permission-denied', 'Please allow microphone access');
                }
            }
            const shouldRestart = setting === 'audioEnabled' || setting === 'allowResolutionSwap';
            this.updateConfiguration({ [setting]: newValue }, { restart: shouldRestart });
            return newValue;
        });
    }
    getConfiguration() {
        this.checkConfiguration();
        return Object.assign({}, this.state.config);
    }
    // Permission Management
    checkCameraPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.permissions) === null || _a === void 0 ? void 0 : _a.query) {
                    const { state } = yield navigator.permissions.query({
                        name: 'camera',
                    });
                    this.state.permissions.camera = state;
                    return state;
                }
                this.state.permissions.camera = 'prompt';
                return 'prompt';
            }
            catch (error) {
                console.warn('Permissions API error:', error);
                this.state.permissions.camera = 'prompt';
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
                    this.state.permissions.microphone = state;
                    return state;
                }
                this.state.permissions.microphone = 'prompt';
                return 'prompt';
            }
            catch (error) {
                console.warn('Permissions API error:', error);
                this.state.permissions.microphone = 'prompt';
                return 'prompt';
            }
        });
    }
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const cameraPermission = yield this.requestMediaPermission('video');
            let microphonePermission = 'prompt';
            if ((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audioEnabled) {
                microphonePermission = yield this.requestMediaPermission('audio');
            }
            return {
                camera: cameraPermission,
                microphone: microphonePermission,
            };
        });
    }
    getCurrentPermissions() {
        return Object.assign({}, this.state.permissions);
    }
    needsPermissionRequest() {
        var _a;
        return (this.state.permissions.camera === 'prompt' ||
            (!!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audioEnabled) && this.state.permissions.microphone === 'prompt'));
    }
    hasPermissionDenied() {
        var _a;
        return (this.state.permissions.camera === 'denied' ||
            (!!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.audioEnabled) && this.state.permissions.microphone === 'denied'));
    }
    captureImage(config = {}) {
        this.checkConfiguration();
        if (!this.state.activeStream) {
            throw new WebcamError('no-stream', 'No active stream to capture image from');
        }
        const videoTrack = this.state.activeStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const canvas = this.state.captureCanvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new WebcamError('webcam-settings-error', 'Failed to get canvas context');
        }
        const scale = config.scale || 1;
        canvas.width = (settings.width || 640) * scale;
        canvas.height = (settings.height || 480) * scale;
        if (this.state.config.mirrorEnabled) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(this.state.config.previewElement, 0, 0, canvas.width, canvas.height);
        if (this.state.config.mirrorEnabled) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
        const mediaType = config.mediaType || 'image/png';
        const quality = typeof config.quality === 'number'
            ? Math.min(Math.max(config.quality, 0), 1)
            : mediaType === 'image/jpeg'
                ? 0.92
                : undefined;
        return canvas.toDataURL(mediaType, quality);
    }
    checkDevicesCapabilitiesData(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                const stream = yield navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: deviceId } },
                });
                const videoTrack = stream.getVideoTracks()[0];
                const capabilities = videoTrack.getCapabilities();
                const frameRates = [];
                if (((_a = capabilities.frameRate) === null || _a === void 0 ? void 0 : _a.min) &&
                    ((_b = capabilities.frameRate) === null || _b === void 0 ? void 0 : _b.max) &&
                    ((_c = capabilities.frameRate) === null || _c === void 0 ? void 0 : _c.step)) {
                    const { min, max, step } = capabilities.frameRate;
                    for (let fps = min; fps <= max; fps += step) {
                        frameRates.push(fps);
                    }
                }
                stream.getTracks().forEach((track) => track.stop());
                return {
                    deviceId,
                    maxWidth: ((_d = capabilities.width) === null || _d === void 0 ? void 0 : _d.max) || 0,
                    maxHeight: ((_e = capabilities.height) === null || _e === void 0 ? void 0 : _e.max) || 0,
                    minWidth: ((_f = capabilities.width) === null || _f === void 0 ? void 0 : _f.min) || 0,
                    minHeight: ((_g = capabilities.height) === null || _g === void 0 ? void 0 : _g.min) || 0,
                    supportedFrameRates: frameRates,
                    zoomSupported: !!capabilities.zoom,
                    torchSupported: !!capabilities.torch,
                    focusSupported: !!capabilities.focusMode,
                    maxZoomLevel: (_h = capabilities.zoom) === null || _h === void 0 ? void 0 : _h.max,
                    minZoomLevel: (_j = capabilities.zoom) === null || _j === void 0 ? void 0 : _j.min,
                    supportedFocusModes: capabilities.focusMode,
                };
            }
            catch (error) {
                throw new WebcamError('webcam-settings-error', 'Failed to check device capabilities', error);
            }
        });
    }
    checkSupportedResolutions(deviceCapabilities, desiredResolutions) {
        const capability = deviceCapabilities[0];
        const deviceInfo = {
            deviceId: capability.deviceId,
            maxWidth: capability.maxWidth,
            maxHeight: capability.maxHeight,
            minWidth: capability.minWidth,
            minHeight: capability.minHeight,
        };
        const resolutions = desiredResolutions.map((resolution) => {
            const isSupported = resolution.width <= capability.maxWidth &&
                resolution.height <= capability.maxHeight &&
                resolution.width >= capability.minWidth &&
                resolution.height >= capability.minHeight;
            return {
                key: resolution.id,
                width: resolution.width,
                height: resolution.height,
                supported: isSupported,
            };
        });
        return {
            resolutions,
            deviceInfo,
        };
    }
    setupChangeListeners() {
        // Add device change listener
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new WebcamError('no-media-devices-support', 'MediaDevices API is not supported in this browser');
        }
        // Update device list for the first time
        this.getAvailableDevices();
        // Set device change listener
        this.deviceChangeListener = () => __awaiter(this, void 0, void 0, function* () {
            yield this.getAvailableDevices();
            // Check if current device still exists
            const currentDevice = this.getCurrentDevice();
            if (this.isActive() && !currentDevice) {
                // If current device is gone, stop the operation
                this.handleError(new WebcamError('no-device', 'Current device is no longer available'));
                this.stop();
            }
        });
        // Set orientation change listener
        this.orientationChangeListener = () => {
            if (this.isActive()) {
                if (screen.orientation) {
                    console.log('Screen orientation is supported');
                    const orientation = screen.orientation.type;
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
    getAvailableDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                    throw new WebcamError('no-media-devices-support', 'MediaDevices API is not supported in this browser');
                }
                // Get available devices
                const devices = yield navigator.mediaDevices.enumerateDevices();
                this.state.availableDevices = devices;
                return [...devices];
            }
            catch (error) {
                this.handleError(new WebcamError('device-list-error', 'Failed to get device list', error));
                return [];
            }
        });
    }
    getVideoDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // If no device information, call getAvailableDevices first
            if (this.state.availableDevices.length === 0) {
                yield this.getAvailableDevices();
            }
            return this.state.availableDevices.filter((device) => device.kind === 'videoinput');
        });
    }
    getAudioInputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // If no device information, call getAvailableDevices first
            if (this.state.availableDevices.length === 0) {
                yield this.getAvailableDevices();
            }
            // filter only audio input devices
            return this.state.availableDevices.filter((device) => device.kind === 'audioinput');
        });
    }
    getAudioOutputDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            // If no device information, call getAvailableDevices first
            if (this.state.availableDevices.length === 0) {
                yield this.getAvailableDevices();
            }
            // filter only audio output devices
            return this.state.availableDevices.filter((device) => device.kind === 'audiooutput');
        });
    }
    getCurrentDevice() {
        var _a;
        if (!((_a = this.state.config) === null || _a === void 0 ? void 0 : _a.device))
            return null;
        return this.state.config.device;
    }
    getCurrentResolution() {
        // If no stream or no configuration, return null
        if (!this.state.activeStream || !this.state.config)
            return null;
        const videoTrack = this.state.activeStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const currentWidth = settings.width || 0;
        const currentHeight = settings.height || 0;
        const resolutionKey = `${currentWidth}x${currentHeight}`;
        return {
            id: resolutionKey,
            label: `${currentWidth}x${currentHeight}`,
            width: currentWidth,
            height: currentHeight,
        };
    }
    // Private Methods
    initializeWebcam() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state.status = WebcamStatus.INITIALIZING;
            this.state.lastError = null;
            const permissions = yield this.requestPermissions();
            validatePermissions(permissions, this.state.config.audioEnabled || false);
            yield this.openWebcam();
        });
    }
    openWebcam() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.config.resolution) {
                if (!this.state.config.allowAnyResolution) {
                    throw new WebcamError('configuration-error', 'Please specify a resolution or set allowAnyResolution to true');
                }
                try {
                    yield this.tryAnyResolution();
                    return;
                }
                catch (error) {
                    throw new WebcamError('webcam-initialization-error', 'Failed to open webcam with supported resolution', error);
                }
            }
            const resolutions = Array.isArray(this.state.config.resolution)
                ? this.state.config.resolution
                : [this.state.config.resolution];
            let lastError = null;
            for (const resolution of resolutions) {
                try {
                    yield this.tryResolution(resolution);
                    return;
                }
                catch (error) {
                    lastError = new WebcamError('webcam-initialization-error', `Failed to open webcam with resolution: ${resolution.id}`, error);
                    console.log(`Failed to open webcam with resolution: ${resolution.id}. Trying next...`);
                }
            }
            if (this.state.config.allowAnyResolution) {
                try {
                    console.log('All specified resolutions failed. Trying any supported resolution...');
                    yield this.tryAnyResolution();
                }
                catch (error) {
                    throw new WebcamError('webcam-initialization-error', 'Failed to open webcam with any resolution', lastError || undefined);
                }
            }
            else {
                throw lastError;
            }
        });
    }
    tryResolution(resolution) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const resolutionString = `${resolution.width}x${resolution.height}`;
            console.log(`Attempting to open webcam with resolution: ${resolution.id} (${resolutionString})`);
            const constraints = buildConstraints(this.state.config.device.deviceId, resolution, this.state.config.allowResolutionSwap || false, this.state.config.audioEnabled || false);
            console.log('Using constraints:', constraints);
            try {
                this.state.activeStream = yield navigator.mediaDevices.getUserMedia(constraints);
                yield this.updateCapabilities();
                yield this.setupPreviewElement();
                console.log(`Successfully opened webcam with resolution: ${resolution.id}`);
                this.state.status = WebcamStatus.READY;
                (_b = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onStartSuccess) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (error) {
                console.error(`Failed to open webcam with resolution: ${resolution.id}`, error);
                throw error;
            }
        });
    }
    tryAnyResolution() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            console.log('Attempting to open webcam with any supported resolution (ideal: 4K)');
            if (!this.state.config.device) {
                throw new WebcamError('no-device', 'Selected device not found');
            }
            const constraints = {
                audio: this.state.config.audioEnabled,
                video: {
                    deviceId: { exact: this.state.config.device.deviceId },
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                },
            };
            try {
                this.state.activeStream = yield navigator.mediaDevices.getUserMedia(constraints);
                yield this.updateCapabilities();
                yield this.setupPreviewElement();
                const videoTrack = this.state.activeStream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                const actualResolution = `${settings.width}x${settings.height}`;
                console.log(`Opened webcam with resolution: ${actualResolution}`);
                this.state.status = WebcamStatus.READY;
                (_b = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onStartSuccess) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (error) {
                console.error('Failed to initialize webcam with any resolution', error);
                throw new WebcamError('webcam-initialization-error', 'Failed to initialize webcam with any resolution', error);
            }
        });
    }
    setupPreviewElement() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.config.previewElement && this.state.activeStream) {
                this.state.config.previewElement.srcObject = this.state.activeStream;
                this.state.config.previewElement.style.transform = this.state.config.mirrorEnabled
                    ? 'scaleX(-1)'
                    : 'none';
                yield this.state.config.previewElement.play();
            }
        });
    }
    updateCapabilities() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!this.state.activeStream)
                return;
            const videoTrack = this.state.activeStream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            const settings = videoTrack.getSettings();
            this.state.capabilities = {
                zoomSupported: !!capabilities.zoom,
                torchSupported: !!capabilities.torch,
                focusSupported: !!capabilities.focusMode,
                zoomLevel: settings.zoom || 1,
                minZoomLevel: ((_a = capabilities.zoom) === null || _a === void 0 ? void 0 : _a.min) || 1,
                maxZoomLevel: ((_b = capabilities.zoom) === null || _b === void 0 ? void 0 : _b.max) || 1,
                torchActive: settings.torch || false,
                focusActive: !!settings.focusMode,
                currentFocusMode: settings.focusMode || 'none',
                supportedFocusModes: capabilities.focusMode || [],
            };
        });
    }
    checkConfiguration() {
        if (!this.state.config) {
            throw new WebcamError('configuration-error', 'Please call setupConfiguration() before using webcam');
        }
    }
    handleError(error) {
        var _a, _b;
        this.state.status = WebcamStatus.ERROR;
        this.state.lastError =
            error instanceof WebcamError ? error : new WebcamError('unknown', error.message, error);
        (_b = (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.lastError);
    }
    stopStream() {
        var _a;
        stopStream(this.state.activeStream, (_a = this.state.config) === null || _a === void 0 ? void 0 : _a.previewElement);
    }
    resetState() {
        this.stopChangeListeners();
        this.state = Object.assign(Object.assign({}, this.state), { status: WebcamStatus.IDLE, activeStream: null, lastError: null, capabilities: DEFAULT_CAPABILITIES });
    }
    requestMediaPermission(mediaType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield navigator.mediaDevices.getUserMedia({
                    [mediaType]: true,
                });
                stream.getTracks().forEach((track) => track.stop());
                const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                this.state.permissions[permissionType] = 'granted';
                return 'granted';
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                        const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                        this.state.permissions[permissionType] = 'denied';
                        return 'denied';
                    }
                }
                const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                this.state.permissions[permissionType] = 'prompt';
                return 'prompt';
            }
        });
    }
    stopChangeListeners() {
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
            this.deviceChangeListener = null;
        }
        if (this.orientationChangeListener) {
            window.removeEventListener('orientationchange', this.orientationChangeListener);
            this.orientationChangeListener = null;
        }
    }
}
export default Webcam;
