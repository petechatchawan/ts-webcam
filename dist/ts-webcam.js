var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ===== Error Class =====
export class CameraError extends Error {
    constructor(code, message, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'CameraError';
    }
}
// ===== Enums =====
export var WebcamStatus;
(function (WebcamStatus) {
    WebcamStatus["IDLE"] = "idle";
    WebcamStatus["INITIALIZING"] = "initializing";
    WebcamStatus["READY"] = "ready";
    WebcamStatus["ERROR"] = "error";
})(WebcamStatus || (WebcamStatus = {}));
export class Webcam {
    constructor() {
        // Combine all states in one place
        this.state = {
            status: WebcamStatus.IDLE,
            configuration: null,
            stream: null,
            lastError: null,
            devices: [],
            resolutions: [],
            capabilities: {
                hasZoom: false,
                hasTorch: false,
                hasFocus: false,
                currentZoom: 1,
                minZoom: 1,
                maxZoom: 1,
                isTorchActive: false,
                isFocusActive: false,
                activeFocusMode: 'none',
                availableFocusModes: [],
            },
            captureCanvas: document.createElement('canvas'),
            currentOrientation: 'portrait-primary',
            currentPermission: {
                camera: 'prompt',
                microphone: 'prompt',
            },
        };
        this.deviceChangeListener = null;
        this.orientationChangeListener = null;
        // Default values
        this.defaultConfiguration = {
            audio: false,
            device: null,
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
            configuration: null,
            stream: null,
            lastError: null,
            devices: [],
            resolutions: [],
            capabilities: {
                hasZoom: false,
                hasTorch: false,
                hasFocus: false,
                currentZoom: 1,
                minZoom: 1,
                maxZoom: 1,
                isTorchActive: false,
                isFocusActive: false,
                activeFocusMode: 'none',
                availableFocusModes: [],
            },
            captureCanvas: canvas,
            currentOrientation: 'portrait-primary',
            currentPermission: {
                camera: 'prompt',
                microphone: 'prompt',
            },
        };
    }
    getWebcamState() {
        return Object.assign({}, this.state);
    }
    getWebcamStatus() {
        return this.state.status;
    }
    getCapabilities() {
        return Object.assign({}, this.state.capabilities);
    }
    getLastError() {
        return this.state.lastError;
    }
    setResolutions(resolutions) {
        this.state.resolutions = resolutions;
    }
    getResolutions() {
        return this.state.resolutions;
    }
    clearError() {
        // Clear error and go back to IDLE state if not active
        this.state.lastError = null;
        if (!this.isActive()) {
            this.state.status = WebcamStatus.IDLE;
        }
    }
    isActive() {
        return this.state.stream !== null && this.state.stream.active;
    }
    /**
     * Get current audio status
     * @returns Current audio status or false if not set
     */
    isAudioEnabled() {
        var _a;
        return ((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.audio) || false;
    }
    /**
     * Get current mirror mode status
     * @returns Current mirror status or false if not set
     */
    isMirrorEnabled() {
        var _a;
        return ((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.mirror) || false;
    }
    /**
     * Get current autoRotation status
     * @returns Current autoRotation status or false if not set
     */
    isAutoRotationEnabled() {
        var _a;
        return ((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.autoRotation) || false;
    }
    /**
     * Get current allowAnyResolution status
     * @returns Current allowAnyResolution status or false if not set
     */
    isAllowAnyResolution() {
        var _a;
        return ((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.allowAnyResolution) || false;
    }
    /**
     * Check if camera supports zoom
     * @returns true if camera supports zoom, false otherwise
     */
    isZoomSupported() {
        return this.state.capabilities.hasZoom;
    }
    /**
     * Check if camera supports torch/flashlight
     * @returns true if camera supports torch, false otherwise
     */
    isTorchSupported() {
        return this.state.capabilities.hasTorch;
    }
    /**
     * Check if camera supports focus
     * @returns true if camera supports focus, false otherwise
     */
    isFocusSupported() {
        return this.state.capabilities.hasFocus;
    }
    /**
     * Get current zoom level
     * @returns Current zoom level or 1 if not available
     */
    getCurrentZoom() {
        return this.state.capabilities.currentZoom;
    }
    /**
     * Get minimum supported zoom level
     * @returns Minimum zoom level or 1 if not available
     */
    getMinZoom() {
        return this.state.capabilities.minZoom;
    }
    /**
     * Get maximum supported zoom level
     * @returns Maximum zoom level or 1 if not available
     */
    getMaxZoom() {
        return this.state.capabilities.maxZoom;
    }
    /**
     * Check if torch/flashlight is currently active
     * @returns true if torch is active, false otherwise
     */
    isTorchActive() {
        return this.state.capabilities.isTorchActive;
    }
    /**
     * Check if focus is currently active
     * @returns true if focus is active, false otherwise
     */
    isFocusActive() {
        return this.state.capabilities.isFocusActive;
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
    /**
     * Get available devices
     * @returns Promise that resolves to an array of MediaDeviceInfo objects
     */
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
    /**
     * Get current device
     * @returns Current device or null if no device
     */
    getCurrentDevice() {
        var _a;
        if (!((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.device))
            return null;
        return this.state.configuration.device;
    }
    /**
     * Get current resolution from active video track
     * @returns Resolution object with current width, height and key, or null if no stream
     */
    getCurrentResolution() {
        // If no stream or no configuration, return null
        if (!this.state.stream || !this.state.configuration)
            return null;
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const currentWidth = settings.width || 0;
        const currentHeight = settings.height || 0;
        const resolutionKey = `${currentWidth}x${currentHeight}`;
        return {
            key: resolutionKey,
            width: currentWidth,
            height: currentHeight,
        };
    }
    /**
     * Setup configuration for the webcam
     * @param configuration - Configuration object
     */
    setupConfiguration(configuration) {
        if (!configuration.device) {
            throw new CameraError('invalid-device-id', 'Device ID is required');
        }
        this.state.configuration = Object.assign(Object.assign({}, this.defaultConfiguration), configuration);
    }
    /**
     * Start the webcam
     * @returns Promise that resolves when the webcam is started
     */
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
    /**
     * Stop the webcam
     */
    stop() {
        this.checkConfiguration();
        this.stopStream();
        this.resetState();
    }
    /**
     * Check if video is ready for display
     * @returns Promise that resolves to true if video is ready
     */
    previewIsReady() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const video = (_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.previewElement;
            // Check if video is not null
            if (!video) {
                return false; // Return false if video is null
            }
            // If video is already ready
            if (video.readyState >= 2) {
                return true;
            }
            // Set event listener for canplay
            const onCanPlay = () => {
                video.removeEventListener('canplay', onCanPlay);
                return true;
            };
            // Set event listener for error
            const onError = () => {
                video.removeEventListener('error', onError);
                return false;
            };
            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', onError);
            return false;
        });
    }
    /**
     * Set the zoom level for the camera
     * @param zoomLevel Zoom level to set (will be constrained to min/max range)
     * @throws CameraError if zoom is not supported or camera is not active
     */
    setZoom(zoomLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if camera is active and zoom is supported
            if (!this.state.stream || !this.state.capabilities.hasZoom) {
                throw new CameraError('zoom-not-supported', 'Zoom is not supported or camera is not active');
            }
            // Get video track and check capabilities
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            // Verify zoom capability is available
            if (!capabilities.zoom) {
                throw new CameraError('zoom-not-supported', 'Zoom is not supported by this device');
            }
            try {
                // Constrain zoom level to valid range
                const constrainedZoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
                // Apply zoom constraint
                yield videoTrack.applyConstraints({
                    advanced: [
                        {
                            zoom: constrainedZoomLevel,
                        },
                    ],
                });
                // Update internal state
                this.state.capabilities.currentZoom = constrainedZoomLevel;
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to set zoom level', error);
            }
        });
    }
    /**
     * Set the torch mode for the camera
     * @param active Whether to activate (true) or deactivate (false) the torch
     * @throws CameraError if torch is not supported or camera is not active
     */
    setTorch(active) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if camera is active and torch is supported
            if (!this.state.stream || !this.state.capabilities.hasTorch) {
                throw new CameraError('torch-not-supported', 'Torch is not supported or camera is not active');
            }
            // Get video track and check capabilities
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            // Verify torch capability is available
            if (!capabilities.torch) {
                throw new CameraError('torch-not-supported', 'Torch is not supported by this device');
            }
            try {
                // Apply torch constraint
                yield videoTrack.applyConstraints({
                    advanced: [
                        { torch: active },
                    ],
                });
                // Update internal state
                this.state.capabilities.isTorchActive = active;
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to set torch mode', error);
            }
        });
    }
    /**
     * Set the focus mode for the camera
     * @param mode The focus mode to set (e.g., 'auto', 'continuous', 'manual')
     * @throws CameraError if focus mode is not supported or camera is not active
     */
    setFocusMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if camera is active and focus is supported
            if (!this.state.stream || !this.state.capabilities.hasFocus) {
                throw new CameraError('focus-not-supported', 'Focus mode is not supported or camera is not active');
            }
            // Get video track and check capabilities
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities();
            // Verify requested focus mode is supported
            if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
                throw new CameraError('focus-not-supported', `Focus mode '${mode}' is not supported by this device`);
            }
            try {
                // Apply focus mode constraint
                yield videoTrack.applyConstraints({
                    advanced: [
                        { focusMode: mode },
                    ],
                });
                // Update internal state
                this.state.capabilities.activeFocusMode = mode;
                this.state.capabilities.isFocusActive = true;
            }
            catch (error) {
                throw new CameraError('camera-settings-error', 'Failed to set focus mode', error);
            }
        });
    }
    /**
     * Toggle torch/flashlight on/off
     * @returns New torch state after toggle (true = on, false = off)
     * @throws CameraError if torch is not supported or camera is not active
     */
    toggleTorch() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if torch is supported
            if (!this.isTorchSupported()) {
                throw new CameraError('torch-not-supported', 'Torch is not supported by this device');
            }
            // Toggle torch state to opposite of current state
            const newTorchState = !this.state.capabilities.isTorchActive;
            // Apply the new torch state
            yield this.setTorch(newTorchState);
            // Return the new state
            return newTorchState;
        });
    }
    /**
     * Toggle mirror mode
     * @returns New mirror state after toggle (true = on, false = off)
     */
    toggleMirror() {
        this.checkConfiguration();
        const newValue = !this.state.configuration['mirror'];
        this.updateConfiguration({ mirror: newValue }, { restart: false });
        return newValue;
    }
    /**
     * Create a new Resolution object with key
     * @param width Width in pixels
     * @param height Height in pixels
     * @returns Resolution object with key in format "widthxheight"
     */
    createResolution(width, height) {
        const resolutionKey = `${width}x${height}`;
        return { key: resolutionKey, width, height };
    }
    /**
     * Update webcam configuration
     * @param configuration Configuration to update
     * @param options Additional options for updating
     * @returns Current configuration after update
     */
    updateConfiguration(configuration, options = { restart: true }) {
        this.checkConfiguration();
        const wasActive = this.isActive();
        if (wasActive && options.restart) {
            this.stop();
        }
        // Update configuration
        this.state.configuration = Object.assign(Object.assign({}, this.state.configuration), configuration);
        // Update preview element CSS if mirror mode is changed
        if ('mirror' in configuration &&
            this.state.configuration.previewElement) {
            this.state.configuration.previewElement.style.transform = this
                .state.configuration.mirror
                ? 'scaleX(-1)'
                : 'none';
        }
        if (wasActive && options.restart) {
            this.start().catch(this.handleError);
        }
        return Object.assign({}, this.state.configuration);
    }
    /**
     * Adjust resolution dimensions for rotation
     * Swaps width and height for all resolutions in the state
     * and updates their keys accordingly
     * @returns Promise that resolves when resolution adjustment is complete
     */
    getAdjustedResolutionRotation() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                const currentResolutions = this.getResolutions();
                if (!currentResolutions || currentResolutions.length === 0) {
                    resolve();
                    return;
                }
                try {
                    // สร้าง array ใหม่เพื่อเก็บ resolutions ที่ปรับแล้ว
                    const adjustedResolutions = currentResolutions.map((resolution) => {
                        // สร้าง object ใหม่เพื่อไม่ให้กระทบกับ original object
                        const adjustedResolution = Object.assign({}, resolution);
                        // Swap width and height
                        const tempWidth = adjustedResolution.width;
                        adjustedResolution.width = adjustedResolution.height;
                        adjustedResolution.height = tempWidth;
                        // Update key with new dimensions
                        adjustedResolution.key = `${adjustedResolution.width}x${adjustedResolution.height}`;
                        return adjustedResolution;
                    });
                    // อัพเดท state ด้วย resolutions ที่ปรับแล้ว
                    this.state.resolutions = adjustedResolutions;
                    console.log('Resolution rotation adjustment completed');
                    resolve();
                }
                catch (error) {
                    console.error('Error adjusting resolutions:', error);
                    // ถึงแม้จะมี error ก็ให้ resolve เพื่อให้โปรแกรมทำงานต่อได้
                    resolve();
                }
            });
        });
    }
    /**
     * Update resolution configuration
     * @param resolution Single resolution or array of resolutions in priority order
     * @returns Current configuration after update
     */
    updateResolution(resolution) {
        return this.updateConfiguration({ resolution }, { restart: true });
    }
    /**
     * Update device configuration
     * @param deviceId ID of the camera device to use
     * @returns Current configuration after update
     */
    updateDevice(device) {
        return this.updateConfiguration({ device }, { restart: true });
    }
    /**
     * toggle boolean setting
     * @param setting setting to toggle ('mirror', 'autoRotation', 'allowAnyResolution', 'audio')
     * @returns Promise that returns the current value after toggling
     * @throws CameraError if microphone permission is denied
     */
    toggle(setting) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkConfiguration();
            const newValue = !this.state.configuration[setting];
            // if audio, check permission before
            if (setting === 'audio' && newValue) {
                // check microphone permission
                const micPermission = yield this.checkMicrophonePermission();
                // if never requested permission, request permission before
                if (micPermission === 'prompt') {
                    const permission = yield this.requestMediaPermission('audio');
                    if (permission === 'denied') {
                        throw new CameraError('microphone-permission-denied', 'Please allow microphone access');
                    }
                }
                // if denied, throw error
                else if (micPermission === 'denied') {
                    throw new CameraError('microphone-permission-denied', 'Please allow microphone access');
                }
            }
            // Update resolution if autoRotation is enabled
            if (setting === 'autoRotation') {
                yield this.getAdjustedResolutionRotation();
            }
            // update configuration
            const shouldRestart = setting === 'audio' || setting === 'autoRotation';
            this.updateConfiguration({ [setting]: newValue }, { restart: shouldRestart });
            return newValue;
        });
    }
    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfiguration() {
        this.checkConfiguration();
        return Object.assign({}, this.state.configuration);
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
            if ((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.audio) {
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
            (!!((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.audio) &&
                this.state.currentPermission.microphone === 'prompt'));
    }
    // Add method for checking if permission is denied
    hasPermissionDenied() {
        var _a;
        return (this.state.currentPermission.camera === 'denied' ||
            (!!((_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.audio) &&
                this.state.currentPermission.microphone === 'denied'));
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
        if (this.state.configuration.mirror) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        context.drawImage(this.state.configuration.previewElement, 0, 0, canvas.width, canvas.height);
        // Reset transform matrix
        if (this.state.configuration.mirror) {
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
            const isSupported = resolution.width <= capability.maxWidth &&
                resolution.height <= capability.maxHeight &&
                resolution.width >= capability.minWidth &&
                resolution.height >= capability.minHeight;
            return {
                key: resolution.key,
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
    /**
     * Open camera with appropriate resolution based on configuration
     * Handles different scenarios:
     * 1. No resolution specified + allowAnyResolution = true
     * 2. Resolution specified
     * 3. Allow any resolution
     * @throws CameraError if camera cannot be opened
     */
    openCamera() {
        return __awaiter(this, void 0, void 0, function* () {
            // Case 1: No resolution specified
            if (!this.state.configuration.resolution) {
                if (!this.state.configuration.allowAnyResolution) {
                    throw new CameraError('configuration-error', 'Please specify a resolution or set allowAnyResolution to true');
                }
                try {
                    yield this.tryAnyResolution();
                    return;
                }
                catch (error) {
                    throw new CameraError('camera-initialization-error', 'Failed to open camera with supported resolution', error);
                }
            }
            // Get resolutions from configuration
            const resolutions = Array.isArray(this.state.configuration.resolution)
                ? this.state.configuration.resolution
                : [this.state.configuration.resolution];
            // Case 2: Try specified resolutions
            let lastError = null;
            for (const resolution of resolutions) {
                try {
                    yield this.tryResolution(resolution);
                    return; // Success, exit function
                }
                catch (error) {
                    lastError = error;
                    console.log(`Failed to open camera with resolution: ${resolution.key}. Trying next...`);
                }
            }
            // Case 3: All specified resolutions failed
            if (this.state.configuration.allowAnyResolution) {
                try {
                    console.log('All specified resolutions failed. Trying any supported resolution...');
                    yield this.tryAnyResolution();
                }
                catch (error) {
                    throw new CameraError('camera-initialization-error', 'Failed to open camera with any resolution', lastError || error);
                }
            }
            else {
                // If allowAnyResolution is false, throw error immediately
                throw new CameraError('camera-initialization-error', 'Failed to open camera with specified resolutions and allowAnyResolution is false', lastError || undefined);
            }
        });
    }
    /**
     * Try to open camera with specific resolution
     * @param resolution Resolution to try
     * @throws CameraError if camera cannot be opened with specified resolution
     */
    tryResolution(resolution) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const resolutionString = `${resolution.width}x${resolution.height}`;
            console.log(`Attempting to open camera with resolution: ${resolution.key} (${resolutionString})`);
            // Build constraints based on resolution
            const constraints = this.buildConstraints(resolution);
            console.log('Using constraints:', constraints);
            try {
                // Request camera access with constraints
                this.state.stream =
                    yield navigator.mediaDevices.getUserMedia(constraints);
                // Update capabilities and setup preview
                yield this.updateCapabilities();
                yield this.setupPreviewElement();
                console.log(`Successfully opened camera with resolution: ${resolution.key}`);
                // Update status and call onStart callback
                this.state.status = WebcamStatus.READY;
                (_b = (_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.onStart) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (error) {
                console.error(`Failed to open camera with resolution: ${resolution.key}`, error);
                throw error;
            }
        });
    }
    /**
     * Try to open camera with any supported resolution
     * Uses 4K as ideal resolution but allows browser to choose best available
     * @throws CameraError if camera cannot be opened with any resolution
     */
    tryAnyResolution() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            console.log('Attempting to open camera with any supported resolution (ideal: 4K)');
            // Check if device is available
            if (!this.state.configuration.device) {
                throw new CameraError('no-device', 'Selected device not found');
            }
            // Create constraints with ideal resolution as 4K
            const constraints = {
                audio: this.state.configuration.audio,
                video: {
                    deviceId: { exact: this.state.configuration.device.deviceId },
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                },
            };
            try {
                // Request camera access with constraints
                this.state.stream =
                    yield navigator.mediaDevices.getUserMedia(constraints);
                // Update capabilities and setup preview
                yield this.updateCapabilities();
                yield this.setupPreviewElement();
                // Log actual resolution obtained
                const videoTrack = this.state.stream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                const actualResolution = `${settings.width}x${settings.height}`;
                console.log(`Opened camera with resolution: ${actualResolution}`);
                // Update status and call onStart callback
                this.state.status = WebcamStatus.READY;
                (_b = (_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.onStart) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (error) {
                console.error('Failed to initialize camera with any resolution', error);
                throw new CameraError('camera-initialization-error', 'Failed to initialize camera with any resolution', error);
            }
        });
    }
    setupPreviewElement() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.state.configuration.previewElement && this.state.stream) {
                this.state.configuration.previewElement.srcObject =
                    this.state.stream;
                this.state.configuration.previewElement.style.transform = this
                    .state.configuration.mirror
                    ? 'scaleX(-1)'
                    : 'none';
                yield this.state.configuration.previewElement.play();
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
                hasZoom: !!capabilities.zoom,
                hasTorch: !!capabilities.torch,
                hasFocus: !!capabilities.focusMode,
                currentZoom: settings.zoom || 1,
                minZoom: ((_a = capabilities.zoom) === null || _a === void 0 ? void 0 : _a.min) || 1,
                maxZoom: ((_b = capabilities.zoom) === null || _b === void 0 ? void 0 : _b.max) || 1,
                isTorchActive: settings.torch || false,
                isFocusActive: !!settings.focusMode,
                activeFocusMode: settings.focusMode || 'none',
                availableFocusModes: capabilities.focusMode || [],
            };
        });
    }
    /**
     * Build media constraints for getUserMedia based on resolution
     * @param resolution Resolution to use for constraints
     * @returns MediaStreamConstraints object
     */
    buildConstraints(resolution) {
        // Create video constraints with device ID
        const videoConstraints = {
            deviceId: { exact: this.state.configuration.device.deviceId },
            width: { exact: resolution.width },
            height: { exact: resolution.height },
        };
        // Create complete constraints object
        return {
            video: videoConstraints,
            audio: this.state.configuration.audio,
        };
    }
    checkConfiguration() {
        if (!this.state.configuration) {
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
        // Call callback onError if configuration exists
        (_b = (_a = this.state.configuration) === null || _a === void 0 ? void 0 : _a.onError) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.lastError);
    }
    stopStream() {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach((track) => track.stop());
            this.state.stream = null;
        }
        if (this.state.configuration.previewElement) {
            this.state.configuration.previewElement.srcObject = null;
        }
    }
    resetState() {
        this.stopChangeListeners();
        // Reset only basic system state
        this.state = Object.assign(Object.assign({}, this.state), { status: WebcamStatus.IDLE, stream: null, lastError: null, capabilities: {
                hasZoom: false,
                hasTorch: false,
                hasFocus: false,
                currentZoom: 1,
                minZoom: 1,
                maxZoom: 1,
                isTorchActive: false,
                isFocusActive: false,
                activeFocusMode: 'none',
                availableFocusModes: [],
            } });
    }
    validatePermissions(permissions) {
        if (permissions.camera === 'denied') {
            throw new CameraError('permission-denied', 'Please allow camera access');
        }
        if (this.state.configuration.audio &&
            permissions.microphone === 'denied') {
            throw new CameraError('microphone-permission-denied', 'Please allow microphone access');
        }
    }
}
export default Webcam;
