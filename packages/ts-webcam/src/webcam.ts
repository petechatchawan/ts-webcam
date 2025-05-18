import { UAInfo } from 'ua-info';
import {
    DEFAULT_WEBCAM_CAPABILITIES,
    DEFAULT_WEBCAM_CONFIG,
    DEFAULT_WEBCAM_STATE,
} from './constants';
import { WebcamError } from './errors';
import {
    DeviceCapabilities,
    ExtendedMediaTrackCapabilities,
    ExtendedMediaTrackConstraintSet,
    ExtendedMediaTrackSettings,
    Resolution,
    WebcamCapabilities,
    WebcamConfiguration,
    WebcamState,
} from './interfaces';
import { DeviceOrientation, PermissionStatus, WebcamStatus } from './types';
import {
    buildMediaConstraints,
    createResolution,
    stopMediaStream,
    validatePermissions,
} from './utils';

export class Webcam {
    private state: WebcamState;
    private deviceChangeListener: (() => void) | null = null;
    private orientationChangeListener: (() => void) | null = null;
    public uaInfo = new UAInfo();

    constructor() {
        this.uaInfo.setUserAgent(navigator.userAgent);
        this.state = {
            ...DEFAULT_WEBCAM_STATE,
            snapshotCanvas: document.createElement('canvas'),
            status: WebcamStatus.IDLE,
            videoDevices: [],
            configuration: null,
            mediaStream: null,
            deviceCapabilities: DEFAULT_WEBCAM_CAPABILITIES,
            permissionStates: {
                camera: 'prompt',
                microphone: 'prompt'
            },
            lastError: null
        };
        this.handleError = this.handleError.bind(this);
    }

    /**
     * Internal logging function that only logs when debug mode is enabled
     * @param message The message to log
     * @param data Optional data to log
     */
    private log(message: string, ...data: any[]): void {
        if (this.state.configuration?.debug) {
            console.log(`[ts-webcam] ${message}`, ...data);
        }
    }

    // ===== State and Status Methods =====

    /**
     * Get the current state of the webcam
     */
    public getState(): WebcamState {
        return { ...this.state };
    }

    /**
     * Get the current status of the webcam (IDLE, INITIALIZING, READY, ERROR)
     */
    public getStatus(): WebcamStatus {
        return this.state.status;
    }

    /**
     * Check if the webcam is currently active
     */
    public isActive(): boolean {
        return (
            this.state.mediaStream !== null && this.state.mediaStream.active
        );
    }

    /**
     * Get the last error that occurred
     */
    public getLastError(): WebcamError | null {
        return this.state.lastError;
    }

    /**
     * Clear the last error and reset status if not active
     */
    public clearError(): void {
        this.state.lastError = null;
        if (!this.isActive()) {
            this.state.status = WebcamStatus.IDLE;
        }
    }

    // ===== Configuration Methods =====

    /**
     * Check if audio is enabled in the configuration
     */
    public isAudioEnabled(): boolean {
        return this.state.configuration?.enableAudio || false;
    }

    /**
     * Check if video mirroring is enabled
     */
    public isMirrorEnabled(): boolean {
        return this.state.configuration?.mirrorVideo || false;
    }

    /**
     * Check if resolution swap is allowed on mobile devices
     */
    public isResolutionSwapAllowed(): boolean {
        return this.state.configuration?.allowAutoRotateResolution || false;
    }

    /**
     * Check if fallback to any supported resolution is allowed
     */
    public isFallbackResolutionAllowed(): boolean {
        return this.state.configuration?.allowFallbackResolution || false;
    }

    /**
     * Check if debug mode is enabled
     */
    public isDebugEnabled(): boolean {
        return this.state.configuration?.debug || false;
    }

    // ===== Device Capabilities Methods =====

    /**
     * Get current device capabilities
     */
    public getCurrentDeviceCapabilities(): WebcamCapabilities {
        return { ...this.state.deviceCapabilities };
    }

    /**
     * Check if zoom is supported by the device
     */
    public isZoomSupported(): boolean {
        return this.state.deviceCapabilities.zoomSupported;
    }

    /**
     * Check if torch/flashlight is supported by the device
     */
    public isTorchSupported(): boolean {
        return this.state.deviceCapabilities.torchSupported;
    }

    /**
     * Check if focus control is supported by the device
     */
    public isFocusSupported(): boolean {
        return this.state.deviceCapabilities.focusSupported;
    }

    /**
     * Get the current zoom level
     */
    public getZoomLevel(): number {
        return this.state.deviceCapabilities.zoomLevel;
    }

    /**
     * Get the minimum supported zoom level
     */
    public getMinZoomLevel(): number {
        return this.state.deviceCapabilities.minZoomLevel;
    }

    /**
     * Get the maximum supported zoom level
     */
    public getMaxZoomLevel(): number {
        return this.state.deviceCapabilities.maxZoomLevel;
    }

    /**
     * Check if torch/flashlight is currently active
     */
    public isTorchActive(): boolean {
        return this.state.deviceCapabilities.torchActive;
    }

    /**
     * Check if focus control is currently active
     */
    public isFocusActive(): boolean {
        return this.state.deviceCapabilities.focusActive;
    }

    // ===== Webcam Lifecycle Methods =====

    /**
     * Set up the webcam configuration
     * @param configuration The configuration to use
     */
    public setupConfiguration(configuration: WebcamConfiguration): void {
        if (!configuration.deviceInfo) {
            throw new WebcamError('DEVICE_NOT_FOUND', 'Device ID is required');
        }

        this.state.configuration = {
            ...DEFAULT_WEBCAM_CONFIG,
            ...configuration,
        };

        if (this.state.configuration.debug) {
            this.log('Configuration set up', this.state.configuration);
        }
    }

    /**
     * Start the webcam with the current configuration
     * @throws WebcamError if the webcam fails to start
     */
    public async start(): Promise<void> {
        this.checkConfiguration();
        this.log('Starting webcam...');
        try {
            await this.initializeWebcam();
            this.log('Webcam started successfully');
        } catch (error) {
            this.log('Error starting webcam', error);
            if (error instanceof WebcamError) {
                this.handleError(error);
            } else {
                this.handleError(
                    new WebcamError(
                        'STREAM_ERROR',
                        'Failed to start webcam',
                        error as Error,
                    ),
                );
            }
            throw this.state.lastError;
        }
    }

    /**
     * Stop the webcam and reset the state
     */
    public stop(): void {
        this.checkConfiguration();
        this.log('Stopping webcam...');
        this.stopStream();
        this.resetState();
        this.log('Webcam stopped');
    }

    /**
     * Check if the video preview element is ready to display content
     * @returns Promise that resolves to true if the preview is ready, false otherwise
     */
    public async isVideoPreviewReady(): Promise<boolean> {
        const video = this.state.configuration?.videoElement;

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
    }

    // ===== Camera Control Methods =====

    /**
     * Set the zoom level of the camera
     * @param zoomLevel The zoom level to set
     * @throws WebcamError if zoom is not supported or fails to set
     */
    public async setZoomLevel(zoomLevel: number): Promise<void> {
        if (
            !this.state.mediaStream ||
            !this.state.deviceCapabilities.zoomSupported
        ) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'Zoom is not supported or webcam is not active',
            );
        }

        const videoTrack = this.state.mediaStream.getVideoTracks()[0];
        const capabilities =
            videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        if (!capabilities.zoom) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'Zoom is not supported by this device',
            );
        }

        try {
            const constrainedZoomLevel = Math.min(
                Math.max(zoomLevel, capabilities.zoom.min),
                capabilities.zoom.max,
            );

            await videoTrack.applyConstraints({
                advanced: [
                    {
                        zoom: constrainedZoomLevel,
                    } as ExtendedMediaTrackConstraintSet,
                ],
            });

            this.state.deviceCapabilities.zoomLevel = constrainedZoomLevel;
        } catch (error) {
            throw new WebcamError(
                'STREAM_ERROR',
                'Failed to set zoom level',
                error as Error,
            );
        }
    }

    /**
     * Enable or disable the torch/flashlight
     * @param active Whether to enable the torch
     * @throws WebcamError if torch is not supported or fails to set
     */
    public async enableTorch(active: boolean): Promise<void> {
        if (!this.state.mediaStream || !this.state.deviceCapabilities.torchSupported) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'Torch is not supported or webcam is not active',
            );
        }

        const videoTrack = this.state.mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        if (!capabilities.torch) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'Torch is not supported by this device',
            );
        }

        try {
            await videoTrack.applyConstraints({
                advanced: [
                    { torch: active } as ExtendedMediaTrackConstraintSet,
                ],
            });

            this.state.deviceCapabilities.torchActive = active;
        } catch (error) {
            throw new WebcamError(
                'STREAM_ERROR',
                'Failed to set torch mode',
                error as Error,
            );
        }
    }

    /**
     * Set the focus mode of the camera
     * @param mode The focus mode to set
     * @throws WebcamError if focus mode is not supported or fails to set
     */
    public async setFocusMode(mode: string): Promise<void> {
        if (
            !this.state.mediaStream ||
            !this.state.deviceCapabilities.focusSupported
        ) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'Focus mode is not supported or webcam is not active',
            );
        }

        const videoTrack = this.state.mediaStream.getVideoTracks()[0];
        const capabilities =
            videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                `Focus mode '${mode}' is not supported by this device`,
            );
        }

        try {
            await videoTrack.applyConstraints({
                advanced: [
                    { focusMode: mode } as ExtendedMediaTrackConstraintSet,
                ],
            });

            this.state.deviceCapabilities.currentFocusMode = mode;
            this.state.deviceCapabilities.focusActive = true;
        } catch (error) {
            throw new WebcamError(
                'STREAM_ERROR',
                'Failed to set focus mode',
                error as Error,
            );
        }
    }

    /**
     * Toggle the torch/flashlight on/off
     * @returns The new torch state (true = on, false = off)
     * @throws WebcamError if torch is not supported
     */
    public async toggleTorch(): Promise<boolean> {
        if (!this.isTorchSupported()) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'Torch is not supported by this device',
            );
        }

        const newTorchState = !this.state.deviceCapabilities.torchActive;
        await this.enableTorch(newTorchState);
        return newTorchState;
    }

    /**
     * Toggle video mirroring on/off
     * @returns The new mirror state (true = mirrored, false = normal)
     */
    public toggleMirror(): boolean {
        this.checkConfiguration();
        const newValue = !this.state.configuration?.mirrorVideo;
        this.updateConfiguration(
            { mirrorVideo: newValue },
            { restart: false },
        );
        return newValue;
    }

    /**
     * Toggle debug mode on/off
     * @returns The new debug state (true = enabled, false = disabled)
     */
    public toggleDebug(): boolean {
        this.checkConfiguration();
        const newValue = !this.state.configuration?.debug;
        this.updateConfiguration(
            { debug: newValue },
            { restart: false },
        );
        this.log(newValue ? 'Debug mode enabled' : 'Debug mode disabled');
        return newValue;
    }

    // ===== Configuration and Resolution Methods =====

    /**
     * Create a resolution object with the specified parameters
     * @param name The name/identifier for the resolution
     * @param width The width in pixels
     * @param height The height in pixels
     * @returns A Resolution object
     */
    public createResolution(
        name: string,
        width: number,
        height: number,
    ): Resolution {
        return createResolution(name, width, height);
    }

    /**
     * Get the current webcam configuration
     * @returns The current configuration
     */
    public getConfiguration(): WebcamConfiguration {
        this.checkConfiguration();
        return { ...this.state.configuration! };
    }

    /**
     * Update the webcam configuration
     * @param configuration The configuration properties to update
     * @param options Options for the update (restart: whether to restart the webcam)
     * @returns The updated configuration
     */
    public updateConfiguration(
        configuration: Partial<WebcamConfiguration>,
        options: { restart?: boolean } = { restart: true },
    ): WebcamConfiguration {
        this.checkConfiguration();
        const wasActive = this.isActive();
        if (wasActive && options.restart) {
            this.stop();
        }

        this.state.configuration = {
            ...this.state.configuration!,
            ...configuration,
        };

        if (
            'mirrorVideo' in configuration &&
            this.state.configuration!.videoElement
        ) {
            this.state.configuration!.videoElement.style.transform = this.state
                .configuration!.mirrorVideo
                ? 'scaleX(-1)'
                : 'none';
        }

        if (wasActive || options.restart) {
            this.start().catch(this.handleError);
        }

        return { ...this.state.configuration! };
    }

    /**
     * Update the preferred resolution(s)
     * @param resolution The resolution or array of resolutions to use
     * @param options Options for the update (restart: whether to restart the webcam)
     * @returns The updated configuration
     */
    public updateResolution(
        resolution: Resolution | Resolution[],
        options: { restart?: boolean } = { restart: true },
    ): WebcamConfiguration {
        return this.updateConfiguration({ preferredResolutions: resolution }, options);
    }

    /**
     * Update the camera device
     * @param device The device to use
     * @param options Options for the update (restart: whether to restart the webcam)
     * @returns The updated configuration
     */
    public updateDevice(
        device: MediaDeviceInfo,
        options: { restart?: boolean } = { restart: true },
    ): WebcamConfiguration {
        return this.updateConfiguration({ deviceInfo: device }, options);
    }

    /**
     * Toggle a boolean setting in the configuration
     * @param setting The setting to toggle
     * @returns The new value of the setting
     * @throws WebcamError if microphone permission is denied when enabling audio
     */
    public async toggleSetting(
        setting: 'enableAudio' | 'allowAutoRotateResolution' | 'allowFallbackResolution' | 'debug',
    ): Promise<boolean> {
        this.checkConfiguration();
        const newValue = !this.state.configuration![setting];

        if (setting === 'enableAudio' && newValue) {
            const micPermission = await this.checkMicrophonePermission();
            if (micPermission === 'prompt') {
                const permission = await this.requestMediaPermission('audio');
                if (permission === 'denied') {
                    throw new WebcamError(
                        'PERMISSION_DENIED',
                        'Please allow microphone access',
                    );
                }
            } else if (micPermission === 'denied') {
                throw new WebcamError(
                    'PERMISSION_DENIED',
                    'Please allow microphone access',
                );
            }
        }

        const shouldRestart = setting === 'enableAudio' || setting === 'allowAutoRotateResolution';
        this.updateConfiguration(
            { [setting]: newValue },
            { restart: shouldRestart },
        );

        if (setting === 'debug') {
            this.log(newValue ? 'Debug mode enabled' : 'Debug mode disabled');
        }

        return newValue;
    }

    // ===== Permission Management Methods =====

    /**
     * Check the current camera permission status
     * @returns The current permission status (granted, denied, prompt)
     */
    public async checkCameraPermission(): Promise<PermissionStatus> {
        try {
            if (navigator?.permissions?.query) {
                const { state } = await navigator.permissions.query({
                    name: 'camera' as PermissionName,
                });
                this.state.permissionStates.camera = state as PermissionStatus;
                return state as PermissionStatus;
            }
            this.state.permissionStates.camera = 'prompt';
            return 'prompt';
        } catch (error) {
            this.log('Permissions API error:', error);
            this.state.permissionStates.camera = 'prompt';
            return 'prompt';
        }
    }

    /**
     * Check the current microphone permission status
     * @returns The current permission status (granted, denied, prompt)
     */
    public async checkMicrophonePermission(): Promise<PermissionStatus> {
        try {
            if (navigator?.permissions?.query) {
                const { state } = await navigator.permissions.query({
                    name: 'microphone' as PermissionName,
                });
                this.state.permissionStates.microphone = state as PermissionStatus;
                return state as PermissionStatus;
            }
            this.state.permissionStates.microphone = 'prompt';
            return 'prompt';
        } catch (error) {
            this.log('Permissions API error:', error);
            this.state.permissionStates.microphone = 'prompt';
            return 'prompt';
        }
    }

    /**
     * Request camera and microphone permissions
     * @returns Object containing the permission status for camera and microphone
     */
    public async requestPermissions(): Promise<{
        camera: PermissionStatus;
        microphone: PermissionStatus;
    }> {
        const cameraPermission = await this.requestMediaPermission('video');
        let microphonePermission: PermissionStatus = 'prompt';
        if (this.state.configuration?.enableAudio) {
            microphonePermission = await this.requestMediaPermission('audio');
        }
        return {
            camera: cameraPermission,
            microphone: microphonePermission,
        };
    }

    /**
     * Get the current permission states for camera and microphone
     * @returns Object containing the current permission states
     */
    public getPermissionStates(): {
        camera: PermissionStatus;
        microphone: PermissionStatus;
    } {
        return { ...this.state.permissionStates };
    }

    /**
     * Check if permission request is needed for camera or microphone
     * @returns True if permission request is needed, false otherwise
     */
    public needsPermissionRequest(): boolean {
        return (
            this.state.permissionStates.camera === 'prompt' ||
            (!!this.state.configuration?.enableAudio &&
                this.state.permissionStates.microphone === 'prompt')
        );
    }

    /**
     * Check if permission has been denied for camera or microphone
     * @returns True if permission has been denied, false otherwise
     */
    public hasPermissionDenied(): boolean {
        return (
            this.state.permissionStates.camera === 'denied' ||
            (!!this.state.configuration?.enableAudio &&
                this.state.permissionStates.microphone === 'denied')
        );
    }

    // ===== Image Capture Methods =====

    /**
     * Capture an image from the current webcam stream
     * @param config Configuration options for the capture (scale, mediaType, quality)
     * @returns Promise that resolves to a data URL of the captured image
     * @throws WebcamError if capture fails
     */
    public async captureImage(
        config: {
            scale?: number;
            mediaType?: 'image/png' | 'image/jpeg';
            quality?: number;
        } = {},
    ): Promise<string> {
        this.checkConfiguration();
        if (!this.state.mediaStream) {
            throw new WebcamError(
                'STREAM_ERROR',
                'No active stream to capture image from',
            );
        }

        const videoTrack = this.state.mediaStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        const canvas = this.state.snapshotCanvas!;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new WebcamError(
                'STREAM_ERROR',
                'Failed to get canvas context',
            );
        }

        const scale = config.scale || 1;
        canvas.width = (settings.width || 640) * scale;
        canvas.height = (settings.height || 480) * scale;
        if (this.state.configuration?.mirrorVideo) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(
            this.state.configuration!.videoElement!,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        if (this.state.configuration!.mirrorVideo) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }

        const mediaType = config.mediaType || 'image/png';
        const quality =
            typeof config.quality === 'number'
                ? Math.min(Math.max(config.quality, 0), 1)
                : mediaType === 'image/jpeg'
                    ? 0.92
                    : undefined;

        return new Promise<string>((resolve, reject) => {
            canvas.toBlob(
                (blob: Blob | null) => {
                    if (!blob) {
                        return reject(
                            new WebcamError(
                                'STREAM_ERROR',
                                'Failed to capture image',
                            ),
                        );
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                },
                mediaType,
                quality,
            );
        });
    }

    // ===== Device Capability Methods =====

    /**
     * Get detailed capabilities of a specific device
     * @param deviceId The ID of the device to check
     * @returns Promise that resolves to the device capabilities
     * @throws WebcamError if capabilities check fails
     */
    public async getDeviceCapabilities(
        deviceId: string,
    ): Promise<DeviceCapabilities> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
            });

            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
            const frameRates: number[] = [];

            if (
                capabilities.frameRate?.min &&
                capabilities.frameRate?.max &&
                capabilities.frameRate?.step
            ) {
                const { min, max, step } = capabilities.frameRate;
                for (let fps = min; fps <= max; fps += step) {
                    frameRates.push(fps);
                }
            }

            stream.getTracks().forEach((track) => track.stop());

            return {
                deviceId,
                maxWidth: capabilities.width?.max || 0,
                maxHeight: capabilities.height?.max || 0,
                minWidth: capabilities.width?.min || 0,
                minHeight: capabilities.height?.min || 0,
                supportedFrameRates: frameRates,
                zoomSupported: !!capabilities.zoom,
                torchSupported: !!capabilities.torch,
                focusSupported: !!capabilities.focusMode,
                maxZoomLevel: capabilities.zoom?.max,
                minZoomLevel: capabilities.zoom?.min,
                supportedFocusModes: capabilities.focusMode,
            };
        } catch (error) {
            throw new WebcamError(
                'STREAM_ERROR',
                'Failed to check device capabilities',
                error as Error,
            );
        }
    }

    /**
     * Check which resolutions are supported by the device
     * @param deviceCapabilities The capabilities of the device
     * @param desiredResolutions The resolutions to check
     * @returns Object containing supported resolutions and device info
     */
    public checkSupportedResolutions(
        deviceCapabilities: DeviceCapabilities[],
        desiredResolutions: Resolution[],
    ): {
        resolutions: {
            key: string;
            width: number;
            height: number;
            supported: boolean;
        }[];
        deviceInfo: {
            deviceId: string;
            maxWidth: number;
            maxHeight: number;
            minWidth: number;
            minHeight: number;
        };
    } {
        const capability = deviceCapabilities[0];
        const deviceInfo = {
            deviceId: capability.deviceId,
            maxWidth: capability.maxWidth,
            maxHeight: capability.maxHeight,
            minWidth: capability.minWidth,
            minHeight: capability.minHeight,
        };

        const resolutions = desiredResolutions.map((resolution) => {
            const isSupported =
                resolution.width <= capability.maxWidth &&
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

    public async setupChangeListeners(): Promise<void> {
        // Add device change listener
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.enumerateDevices
        ) {
            throw new WebcamError(
                'DEVICE_NOT_FOUND',
                'MediaDevices API is not supported in this browser',
            );
        }

        // Update device list for the first time
        await this.refreshDevices();

        // Set device change listener
        this.deviceChangeListener = async () => {
            await this.refreshDevices();

            // Check if current device still exists
            const currentDevice = this.getCurrentDevice();
            if (this.isActive() && !currentDevice) {
                // If current device is gone, stop the operation
                this.handleError(
                    new WebcamError(
                        'DEVICE_NOT_FOUND',
                        'Current device is no longer available',
                    ),
                );
                this.stop();
            }
        };

        // Set orientation change listener
        this.orientationChangeListener = () => {
            if (this.isActive()) {
                if (screen.orientation) {
                    this.log('Screen orientation is supported');
                    const orientation = screen.orientation.type as OrientationType;
                    const angle = screen.orientation.angle;
                    this.log(
                        `Orientation type: ${orientation}, angle: ${angle}`,
                    );

                    // Store current orientation in state
                    this.state.deviceOrientation = orientation as DeviceOrientation;

                    switch (orientation) {
                        case 'portrait-primary':
                            this.log('Portrait (normal)');
                            break;
                        case 'portrait-secondary':
                            this.log('Portrait (flipped)');
                            break;
                        case 'landscape-primary':
                            this.log('Landscape (normal)');
                            break;
                        case 'landscape-secondary':
                            this.log('Landscape (flipped)');
                            break;
                        default:
                            this.log('Unknown orientation');
                            this.state.deviceOrientation = 'unknown';
                    }
                } else {
                    this.log('screen.orientation is not supported');
                    this.state.deviceOrientation = 'unknown';
                }
            }
        };

        // Add listeners
        navigator.mediaDevices.addEventListener(
            'devicechange',
            this.deviceChangeListener,
        );
        window.addEventListener(
            'orientationchange',
            this.orientationChangeListener,
        );
    }

    private async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
        try {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.enumerateDevices
            ) {
                throw new WebcamError(
                    'DEVICE_NOT_FOUND',
                    'MediaDevices API is not supported in this browser',
                );
            }

            // Get available devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.state.videoDevices = devices.filter((device) => device.kind === 'videoinput');

            return devices;
        } catch (error) {
            this.handleError(
                new WebcamError(
                    'DEVICE_NOT_FOUND',
                    'Failed to get device list',
                    error as Error,
                ),
            );
            return [];
        }
    }

    public async refreshDevices(): Promise<void> {
        // Refresh device list
        await this.getAvailableDevices();
    }

    public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
        // If no device information, call getAvailableDevices first
        if (this.state.videoDevices.length === 0) {
            await this.getAvailableDevices();
        }

        return this.state.videoDevices;
    }

    /**
     * Get all available media devices (video, audio input, audio output)
     * @returns Promise that resolves to an array of all devices
     */
    public async getAllDevices(): Promise<MediaDeviceInfo[]> {
        // If no device information, call getAvailableDevices first
        if (this.state.videoDevices.length === 0) {
            await this.getAvailableDevices();
        }

        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices;
    }

    public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // filter only audio input devices
        return devices.filter(
            (device: MediaDeviceInfo) => device.kind === 'audioinput',
        );
    }

    public async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
        // Get all devices
        const devices = await navigator.mediaDevices.enumerateDevices();

        // filter only audio output devices
        return devices.filter(
            (device: MediaDeviceInfo) => device.kind === 'audiooutput',
        );
    }

    public getCurrentDevice(): MediaDeviceInfo | null {
        if (!this.state.configuration?.deviceInfo) return null;
        return this.state.configuration.deviceInfo;
    }

    public getCurrentResolution(): Resolution | null {
        return this.state.activeResolution || null;
    }

    // Private Methods
    private async initializeWebcam(): Promise<void> {
        this.state.status = WebcamStatus.INITIALIZING;
        this.state.lastError = null;

        const permissions = await this.requestPermissions();
        validatePermissions(
            permissions,
            this.state.configuration!.enableAudio || false,
        );

        await this.openWebcam();
    }

    private async openWebcam(): Promise<void> {
        if (!this.state.configuration!.preferredResolutions) {
            if (!this.state.configuration!.allowFallbackResolution) {
                throw new WebcamError(
                    'NOT_INITIALIZED',
                    'Please specify a resolution or set allowFallbackResolution to true',
                );
            }

            try {
                await this.tryAnyResolution();
                return;
            } catch (error) {
                throw new WebcamError(
                    'STREAM_ERROR',
                    'Failed to open webcam with supported resolution',
                    error as Error,
                );
            }
        }

        const resolutions = Array.isArray(this.state.configuration!.preferredResolutions)
            ? this.state.configuration!.preferredResolutions
            : [this.state.configuration!.preferredResolutions];

        let lastError: Error | null = null;
        for (const resolution of resolutions) {
            try {
                await this.tryResolution(resolution);
                return;
            } catch (error) {
                lastError = new WebcamError(
                    'STREAM_ERROR',
                    `Failed to open webcam with resolution: ${resolution.id}`,
                    error as Error,
                );
                this.log(
                    `Failed to open webcam with resolution: ${resolution.id}. Trying next...`,
                );
            }
        }

        if (this.state.configuration!.allowFallbackResolution) {
            try {
                this.log(
                    'All specified resolutions failed. Trying any supported resolution...',
                );
                await this.tryAnyResolution();
            } catch (error) {
                throw new WebcamError(
                    'STREAM_ERROR',
                    'Failed to open webcam with any resolution',
                    lastError || undefined,
                );
            }
        } else {
            throw lastError;
        }
    }

    private async tryResolution(resolution: Resolution): Promise<void> {
        const resolutionString = `${resolution.width}x${resolution.height}`;
        this.log(`Attempting to open webcam with resolution: ${resolution.id} (${resolutionString})`);

        const constraints = buildMediaConstraints(
            this.state.configuration!.deviceInfo.deviceId,
            resolution,
            this.state.configuration!.allowAutoRotateResolution || false,
            this.state.configuration!.enableAudio || false,
        );
        this.log('Using constraints:', constraints);

        try {
            this.state.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            await this.updateCapabilities();
            await this.setupPreviewElement();

            // Update activeResolution with actual resolution from stream
            const videoTrack = this.state.mediaStream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            this.state.activeResolution = {
                id: resolution.id,
                label: resolution.label,
                width: settings.width || resolution.width,
                height: settings.height || resolution.height,
            };

            this.log(`Successfully opened webcam with resolution: ${resolution.id}`);
            this.state.status = WebcamStatus.READY;
            this.state.configuration?.onStart?.();
        } catch (error) {
            this.log(`Failed to open webcam with resolution: ${resolution.id}`, error);
            throw error;
        }
    }

    private async tryAnyResolution(): Promise<void> {
        this.log('Attempting to open webcam with any supported resolution (ideal: 4K)');
        if (!this.state.configuration!.deviceInfo) {
            throw new WebcamError('DEVICE_NOT_FOUND', 'Selected device not found');
        }

        const constraints: MediaStreamConstraints = {
            audio: this.state.configuration!.enableAudio,
            video: {
                deviceId: { exact: this.state.configuration!.deviceInfo.deviceId },
                width: { ideal: 3840 },
                height: { ideal: 2160 },
            },
        };

        try {
            this.state.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            await this.updateCapabilities();
            await this.setupPreviewElement();

            const videoTrack = this.state.mediaStream!.getVideoTracks()[0];
            const settings = videoTrack.getSettings();

            // Update activeResolution with actual resolution from stream
            this.state.activeResolution = {
                id: `${settings.width}x${settings.height}`,
                label: `${settings.width}x${settings.height}`,
                width: settings.width || 0,
                height: settings.height || 0,
            };

            this.log(`Opened webcam with resolution: ${this.state.activeResolution.id}`);
            this.state.status = WebcamStatus.READY;
            this.state.configuration?.onStart?.();
        } catch (error) {
            this.log('Failed to initialize webcam with any resolution', error);
            throw new WebcamError(
                'STREAM_ERROR',
                'Failed to initialize webcam with any resolution',
                error as Error,
            );
        }
    }

    private async setupPreviewElement(): Promise<void> {
        if (this.state.configuration!.videoElement && this.state.mediaStream) {
            this.state.configuration!.videoElement.srcObject = this.state.mediaStream;
            this.state.configuration!.videoElement.style.transform = this.state.configuration!.mirrorVideo
                ? 'scaleX(-1)'
                : 'none';
            await this.state.configuration!.videoElement.play();
        }
    }

    private async updateCapabilities(): Promise<void> {
        if (!this.state.mediaStream) return;
        const videoTrack = this.state.mediaStream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings;

        this.state.deviceCapabilities = {
            zoomSupported: !!capabilities.zoom,
            torchSupported: !!capabilities.torch,
            focusSupported: !!capabilities.focusMode,
            zoomLevel: settings.zoom || 1,
            minZoomLevel: capabilities.zoom?.min || 1,
            maxZoomLevel: capabilities.zoom?.max || 1,
            torchActive: settings.torch || false,
            focusActive: !!settings.focusMode,
            currentFocusMode: settings.focusMode || 'none',
            supportedFocusModes: capabilities.focusMode || [],
        };
    }

    private checkConfiguration(): void {
        if (!this.state.configuration) {
            throw new WebcamError(
                'NOT_INITIALIZED',
                'Please call setupConfiguration() before using webcam',
            );
        }
    }

    private handleError(error: Error): void {
        this.state.status = WebcamStatus.ERROR;
        this.state.lastError =
            error instanceof WebcamError
                ? error
                : new WebcamError('UNKNOWN_ERROR', error.message, error);

        this.log('Error occurred:', this.state.lastError);
        this.state.configuration?.onError?.(this.state.lastError as WebcamError);
    }

    private stopStream(): void {
        stopMediaStream(this.state.mediaStream, this.state.configuration?.videoElement);
    }

    private resetState(): void {
        this.stopChangeListeners();

        this.state = {
            ...this.state,
            status: WebcamStatus.IDLE,
            mediaStream: null,
            lastError: null,
            deviceCapabilities: DEFAULT_WEBCAM_CAPABILITIES,
            activeResolution: null,
        };
    }

    private async requestMediaPermission(
        mediaType: 'video' | 'audio',
    ): Promise<PermissionStatus> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                [mediaType]: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            const permissionType =
                mediaType === 'video' ? 'camera' : 'microphone';
            this.state.permissionStates[permissionType] = 'granted';
            return 'granted';
        } catch (error) {
            if (error instanceof Error) {
                if (
                    error.name === 'NotAllowedError' ||
                    error.name === 'PermissionDeniedError'
                ) {
                    const permissionType =
                        mediaType === 'video' ? 'camera' : 'microphone';
                    this.state.permissionStates[permissionType] = 'denied';
                    return 'denied';
                }
            }

            const permissionType =
                mediaType === 'video' ? 'camera' : 'microphone';
            this.state.permissionStates[permissionType] = 'prompt';
            return 'prompt';
        }
    }

    private stopChangeListeners(): void {
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener(
                'devicechange',
                this.deviceChangeListener,
            );
            this.deviceChangeListener = null;
        }

        if (this.orientationChangeListener) {
            window.removeEventListener(
                'orientationchange',
                this.orientationChangeListener,
            );
            this.orientationChangeListener = null;
        }
    }
}

export default Webcam;
