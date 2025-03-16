// ===== Types =====
export type PermissionState = 'granted' | 'denied' | 'prompt';

export type CameraErrorCode =
    // Permission-related errors
    | 'no-permissions-api'
    | 'permission-denied'
    | 'microphone-permission-denied'
    // Device and configuration errors
    | 'configuration-error'
    | 'no-device'
    | 'no-media-devices-support'
    | 'invalid-device-id'
    | 'no-resolutions'
    // Camera initialization and operation errors
    | 'camera-start-error'
    | 'camera-initialization-error'
    | 'no-stream'
    | 'camera-settings-error'
    | 'camera-stop-error'
    | 'camera-already-in-use'
    // Camera functionality errors
    | 'zoom-not-supported'
    | 'torch-not-supported'
    | 'focus-not-supported'
    | 'device-list-error'
    // Miscellaneous errors
    | 'unknown';

// ===== Error Class =====
export class CameraError extends Error {
    constructor(
        public code: CameraErrorCode,
        message: string,
        public originalError?: Error,
    ) {
        super(message);
        this.name = 'CameraError';
    }
}

export interface Resolution {
    key: string;
    width: number;
    height: number;
}

export interface WebcamConfig {
    /** Enable/disable audio */
    audio?: boolean;
    /** Camera device ID (required) */
    device: MediaDeviceInfo;
    /** Desired resolution(s) (optional) */
    resolution?: Resolution | Resolution[];
    /** Allow any resolution if specified resolution is not available */
    allowAnyResolution?: boolean;
    /** Mirror display */
    mirror?: boolean;
    /** Auto-rotate resolution (swap width/height) */
    autoRotation?: boolean;
    /** Video preview element */
    previewElement?: HTMLVideoElement;
    /** Callback when camera starts successfully */
    onStart?: () => void;
    /** Callback when error occurs */
    onError?: (error: CameraError) => void;
}

/**
 * Interface for managing camera features
 * Used for checking and controlling various camera features such as zoom, torch, and focus mode
 */
export interface CameraFeatures {
    /** Whether the camera supports zoom */
    hasZoom: boolean;
    /** Whether the camera has a torch/flashlight */
    hasTorch: boolean;
    /** Whether the camera supports focus adjustment */
    hasFocus: boolean;
    /** Current zoom level (multiplier) */
    currentZoom: number;
    /** Minimum supported zoom level */
    minZoom: number;
    /** Maximum supported zoom level */
    maxZoom: number;
    /** Torch/flashlight status (on/off) */
    isTorchActive: boolean;
    /** Focus status */
    isFocusActive: boolean;
    /** Current active focus mode e.g. 'auto', 'continuous', 'manual' */
    activeFocusMode: string;
    /** List of all supported focus modes */
    availableFocusModes: string[];
}

// ===== MediaDevices API Extensions =====
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
    zoom?: {
        min: number;
        max: number;
        step: number;
    };
    torch?: boolean;
    focusMode?: string[];
    width?: {
        min: number;
        max: number;
        step: number;
    };
    height?: {
        min: number;
        max: number;
        step: number;
    };
    frameRate?: {
        min: number;
        max: number;
        step: number;
    };
}

interface ExtendedMediaTrackSettings extends MediaTrackSettings {
    zoom?: number;
    torch?: boolean;
    focusMode?: string;
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
    zoom?: number;
    torch?: boolean;
    focusMode?: string;
}

// ===== Enums =====
export enum WebcamStatus {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    READY = 'ready',
    ERROR = 'error',
}

export type OrientationType =
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'unknown';

// ===== State Interface =====
export interface WebcamState {
    status: WebcamStatus;
    configuration: WebcamConfig | null;
    stream: MediaStream | null;
    lastError: CameraError | null;
    captureCanvas?: HTMLCanvasElement;
    devices: MediaDeviceInfo[];
    resolutions: Resolution[];
    capabilities: CameraFeatures;
    currentOrientation?: OrientationType;
    currentPermission: {
        camera: PermissionState;
        microphone: PermissionState;
    };
}

export interface DeviceCapabilitiesData {
    deviceId: string;
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
    hasZoom: boolean;
    hasTorch: boolean;
    hasFocus: boolean;
    maxZoom?: number;
    minZoom?: number;
    supportedFocusModes?: string[];
    supportedFrameRates: number[];
}

export class Webcam {
    // Combine all states in one place
    private state: WebcamState = {
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

    private deviceChangeListener: (() => void) | null = null;
    private orientationChangeListener: (() => void) | null = null;

    // Default values
    private readonly defaultConfiguration: WebcamConfig = {
        audio: false,
        device: null as unknown as MediaDeviceInfo,
        allowAnyResolution: false,
        mirror: false,
        autoRotation: true,
        previewElement: undefined as unknown as HTMLVideoElement,
        onStart: () => {},
        onError: () => {},
    };

    constructor() {
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

    public getWebcamState(): WebcamState {
        return { ...this.state };
    }

    public getWebcamStatus(): WebcamStatus {
        return this.state.status;
    }

    public getCapabilities(): CameraFeatures {
        return { ...this.state.capabilities };
    }

    public getLastError(): CameraError | null {
        return this.state.lastError;
    }

    public setResolutions(resolutions: Resolution[]): void {
        this.state.resolutions = resolutions;
    }

    public getResolutions(): Resolution[] {
        return this.state.resolutions;
    }

    public clearError(): void {
        // Clear error and go back to IDLE state if not active
        this.state.lastError = null;
        if (!this.isActive()) {
            this.state.status = WebcamStatus.IDLE;
        }
    }

    public isActive(): boolean {
        return this.state.stream !== null && this.state.stream.active;
    }

    /**
     * Get current audio status
     * @returns Current audio status or false if not set
     */
    public isAudioEnabled(): boolean {
        return this.state.configuration?.audio || false;
    }

    /**
     * Get current mirror mode status
     * @returns Current mirror status or false if not set
     */
    public isMirrorEnabled(): boolean {
        return this.state.configuration?.mirror || false;
    }

    /**
     * Get current autoRotation status
     * @returns Current autoRotation status or false if not set
     */
    public isAutoRotationEnabled(): boolean {
        return this.state.configuration?.autoRotation || false;
    }

    /**
     * Get current allowAnyResolution status
     * @returns Current allowAnyResolution status or false if not set
     */
    public isAllowAnyResolution(): boolean {
        return this.state.configuration?.allowAnyResolution || false;
    }

    /**
     * Check if camera supports zoom
     * @returns true if camera supports zoom, false otherwise
     */
    public isZoomSupported(): boolean {
        return this.state.capabilities.hasZoom;
    }

    /**
     * Check if camera supports torch/flashlight
     * @returns true if camera supports torch, false otherwise
     */
    public isTorchSupported(): boolean {
        return this.state.capabilities.hasTorch;
    }

    /**
     * Check if camera supports focus
     * @returns true if camera supports focus, false otherwise
     */
    public isFocusSupported(): boolean {
        return this.state.capabilities.hasFocus;
    }

    /**
     * Get current zoom level
     * @returns Current zoom level or 1 if not available
     */
    public getCurrentZoom(): number {
        return this.state.capabilities.currentZoom;
    }

    /**
     * Get minimum supported zoom level
     * @returns Minimum zoom level or 1 if not available
     */
    public getMinZoom(): number {
        return this.state.capabilities.minZoom;
    }

    /**
     * Get maximum supported zoom level
     * @returns Maximum zoom level or 1 if not available
     */
    public getMaxZoom(): number {
        return this.state.capabilities.maxZoom;
    }

    /**
     * Check if torch/flashlight is currently active
     * @returns true if torch is active, false otherwise
     */
    public isTorchActive(): boolean {
        return this.state.capabilities.isTorchActive;
    }

    /**
     * Check if focus is currently active
     * @returns true if focus is active, false otherwise
     */
    public isFocusActive(): boolean {
        return this.state.capabilities.isFocusActive;
    }

    public setupChangeListeners(): void {
        // Add device change listener
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.enumerateDevices
        ) {
            throw new CameraError(
                'no-media-devices-support',
                'MediaDevices API is not supported in this browser',
            );
        }

        // Update device list for the first time
        this.refreshDevices();

        // Set device change listener
        this.deviceChangeListener = async () => {
            await this.refreshDevices();

            // Check if current device still exists
            const currentDevice = this.getCurrentDevice();
            if (this.isActive() && !currentDevice) {
                // If current device is gone, stop the operation
                this.handleError(
                    new CameraError(
                        'no-device',
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
                    console.log('Screen orientation is supported');
                    const orientation = screen.orientation
                        .type as OrientationType;
                    const angle = screen.orientation.angle;
                    console.log(
                        `Orientation type: ${orientation}, angle: ${angle}`,
                    );

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
                } else {
                    console.log('screen.orientation is not supported');
                    this.state.currentOrientation = 'unknown';
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

    public stopChangeListeners(): void {
        // Remove device change listener
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener(
                'devicechange',
                this.deviceChangeListener,
            );
            this.deviceChangeListener = null;
        }

        // Remove orientation change listener
        if (this.orientationChangeListener) {
            window.removeEventListener(
                'orientationchange',
                this.orientationChangeListener,
            );
            this.orientationChangeListener = null;
        }
    }

    /**
     * Get available devices
     * @returns Promise that resolves to an array of MediaDeviceInfo objects
     */
    private async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
        try {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.enumerateDevices
            ) {
                throw new CameraError(
                    'no-media-devices-support',
                    'MediaDevices API is not supported in this browser',
                );
            }

            this.state.devices =
                await navigator.mediaDevices.enumerateDevices();
            return [...this.state.devices];
        } catch (error) {
            this.handleError(
                new CameraError(
                    'device-list-error',
                    'Failed to get device list',
                    error as Error,
                ),
            );
            return [];
        }
    }

    public getDeviceList(): MediaDeviceInfo[] {
        return [...this.state.devices];
    }

    public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
        // If no device information, call getAvailableDevices first
        if (this.state.devices.length === 0) {
            await this.getAvailableDevices();
        }
        return this.state.devices.filter(
            (device) => device.kind === 'videoinput',
        );
    }

    public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
        // If no device information, call getAvailableDevices first
        if (this.state.devices.length === 0) {
            await this.getAvailableDevices();
        }
        return this.state.devices.filter(
            (device) => device.kind === 'audioinput',
        );
    }

    public async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
        // If no device information, call getAvailableDevices first
        if (this.state.devices.length === 0) {
            await this.getAvailableDevices();
        }
        return this.state.devices.filter(
            (device) => device.kind === 'audiooutput',
        );
    }

    public async refreshDevices(): Promise<void> {
        await this.getAvailableDevices();
    }

    /**
     * Get current device
     * @returns Current device or null if no device
     */
    public getCurrentDevice(): MediaDeviceInfo | null {
        if (!this.state.configuration?.device) return null;
        return this.state.configuration.device;
    }

    /**
     * Get current resolution from active video track
     * @returns Resolution object with current width, height and key, or null if no stream
     */
    public getCurrentResolution(): Resolution | null {
        // If no stream or no configuration, return null
        if (!this.state.stream || !this.state.configuration) return null;

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
    public setupConfiguration(configuration: WebcamConfig): void {
        if (!configuration.device) {
            throw new CameraError('invalid-device-id', 'Device ID is required');
        }

        this.state.configuration = {
            ...this.defaultConfiguration,
            ...configuration,
        };
    }

    /**
     * Start the webcam
     * @returns Promise that resolves when the webcam is started
     */
    public async start(): Promise<void> {
        this.checkConfiguration();
        try {
            await this.initializeWebcam();
        } catch (error) {
            if (error instanceof CameraError) {
                this.handleError(error);
            } else {
                this.handleError(
                    new CameraError(
                        'camera-start-error',
                        'Failed to start camera',
                        error as Error,
                    ),
                );
            }
            throw this.state.lastError;
        }
    }

    /**
     * Stop the webcam
     */
    public stop(): void {
        this.checkConfiguration();
        this.stopStream();
        this.resetState();
    }

    /**
     * Check if video is ready for display
     * @returns Promise that resolves to true if video is ready
     */
    public async previewIsReady(): Promise<boolean> {
        const video = this.state.configuration?.previewElement;

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
    }

    /**
     * Set the zoom level for the camera
     * @param zoomLevel Zoom level to set (will be constrained to min/max range)
     * @throws CameraError if zoom is not supported or camera is not active
     */
    public async setZoom(zoomLevel: number): Promise<void> {
        // Check if camera is active and zoom is supported
        if (!this.state.stream || !this.state.capabilities.hasZoom) {
            throw new CameraError(
                'zoom-not-supported',
                'Zoom is not supported or camera is not active',
            );
        }

        // Get video track and check capabilities
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities =
            videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        // Verify zoom capability is available
        if (!capabilities.zoom) {
            throw new CameraError(
                'zoom-not-supported',
                'Zoom is not supported by this device',
            );
        }

        try {
            // Constrain zoom level to valid range
            const constrainedZoomLevel = Math.min(
                Math.max(zoomLevel, capabilities.zoom.min),
                capabilities.zoom.max,
            );

            // Apply zoom constraint
            await videoTrack.applyConstraints({
                advanced: [
                    {
                        zoom: constrainedZoomLevel,
                    } as ExtendedMediaTrackConstraintSet,
                ],
            });

            // Update internal state
            this.state.capabilities.currentZoom = constrainedZoomLevel;
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to set zoom level',
                error as Error,
            );
        }
    }

    /**
     * Set the torch mode for the camera
     * @param active Whether to activate (true) or deactivate (false) the torch
     * @throws CameraError if torch is not supported or camera is not active
     */
    public async setTorch(active: boolean): Promise<void> {
        // Check if camera is active and torch is supported
        if (!this.state.stream || !this.state.capabilities.hasTorch) {
            throw new CameraError(
                'torch-not-supported',
                'Torch is not supported or camera is not active',
            );
        }

        // Get video track and check capabilities
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities =
            videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        // Verify torch capability is available
        if (!capabilities.torch) {
            throw new CameraError(
                'torch-not-supported',
                'Torch is not supported by this device',
            );
        }

        try {
            // Apply torch constraint
            await videoTrack.applyConstraints({
                advanced: [
                    { torch: active } as ExtendedMediaTrackConstraintSet,
                ],
            });

            // Update internal state
            this.state.capabilities.isTorchActive = active;
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to set torch mode',
                error as Error,
            );
        }
    }

    /**
     * Set the focus mode for the camera
     * @param mode The focus mode to set (e.g., 'auto', 'continuous', 'manual')
     * @throws CameraError if focus mode is not supported or camera is not active
     */
    public async setFocusMode(mode: string): Promise<void> {
        // Check if camera is active and focus is supported
        if (!this.state.stream || !this.state.capabilities.hasFocus) {
            throw new CameraError(
                'focus-not-supported',
                'Focus mode is not supported or camera is not active',
            );
        }
        // Get video track and check capabilities
        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities =
            videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        // Verify requested focus mode is supported
        if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
            throw new CameraError(
                'focus-not-supported',
                `Focus mode '${mode}' is not supported by this device`,
            );
        }

        try {
            // Apply focus mode constraint
            await videoTrack.applyConstraints({
                advanced: [
                    { focusMode: mode } as ExtendedMediaTrackConstraintSet,
                ],
            });

            // Update internal state
            this.state.capabilities.activeFocusMode = mode;
            this.state.capabilities.isFocusActive = true;
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to set focus mode',
                error as Error,
            );
        }
    }

    /**
     * Toggle torch/flashlight on/off
     * @returns New torch state after toggle (true = on, false = off)
     * @throws CameraError if torch is not supported or camera is not active
     */
    public async toggleTorch(): Promise<boolean> {
        // Check if torch is supported
        if (!this.isTorchSupported()) {
            throw new CameraError(
                'torch-not-supported',
                'Torch is not supported by this device',
            );
        }

        // Toggle torch state to opposite of current state
        const newTorchState = !this.state.capabilities.isTorchActive;

        // Apply the new torch state
        await this.setTorch(newTorchState);

        // Return the new state
        return newTorchState;
    }

    /**
     * Toggle mirror mode
     * @returns New mirror state after toggle (true = on, false = off)
     */
    public toggleMirror(): boolean {
        this.checkConfiguration();
        const newValue = !this.state.configuration!['mirror'];

        this.updateConfiguration({ mirror: newValue }, { restart: false });

        return newValue;
    }

    /**
     * Create a new Resolution object with key
     * @param width Width in pixels
     * @param height Height in pixels
     * @returns Resolution object with key in format "widthxheight"
     */
    public createResolution(width: number, height: number): Resolution {
        const resolutionKey = `${width}x${height}`;
        return { key: resolutionKey, width, height };
    }

    /**
     * Update webcam configuration
     * @param configuration Configuration to update
     * @param options Additional options for updating
     * @returns Current configuration after update
     */
    public updateConfiguration(
        configuration: Partial<WebcamConfig>,
        options: { restart?: boolean } = { restart: true },
    ): WebcamConfig {
        this.checkConfiguration();
        const wasActive = this.isActive();

        if (wasActive && options.restart) {
            this.stop();
        }

        // Update configuration
        this.state.configuration = {
            ...this.state.configuration!,
            ...configuration,
        };

        // Update preview element CSS if mirror mode is changed
        if (
            'mirror' in configuration &&
            this.state.configuration!.previewElement
        ) {
            this.state.configuration!.previewElement.style.transform = this
                .state.configuration!.mirror
                ? 'scaleX(-1)'
                : 'none';
        }

        if (wasActive && options.restart) {
            this.start().catch(this.handleError);
        }

        return { ...this.state.configuration };
    }

    /**
     * Adjust resolution dimensions for rotation
     * Swaps width and height for all resolutions in the state
     * and updates their keys accordingly
     * @returns Promise that resolves when resolution adjustment is complete
     */
    private async getAdjustedResolutionRotation(): Promise<void> {
        return new Promise((resolve) => {
            const currentResolutions = this.getResolutions();
            if (!currentResolutions || currentResolutions.length === 0) {
                resolve();
                return;
            }

            try {
                // สร้าง array ใหม่เพื่อเก็บ resolutions ที่ปรับแล้ว
                const adjustedResolutions = currentResolutions.map(
                    (resolution) => {
                        // สร้าง object ใหม่เพื่อไม่ให้กระทบกับ original object
                        const adjustedResolution = { ...resolution };

                        // Swap width and height
                        const tempWidth = adjustedResolution.width;
                        adjustedResolution.width = adjustedResolution.height;
                        adjustedResolution.height = tempWidth;

                        // Update key with new dimensions
                        adjustedResolution.key = `${adjustedResolution.width}x${adjustedResolution.height}`;

                        return adjustedResolution;
                    },
                );

                // อัพเดท state ด้วย resolutions ที่ปรับแล้ว
                this.state.resolutions = adjustedResolutions;

                console.log('Resolution rotation adjustment completed');
                resolve();
            } catch (error) {
                console.error('Error adjusting resolutions:', error);
                // ถึงแม้จะมี error ก็ให้ resolve เพื่อให้โปรแกรมทำงานต่อได้
                resolve();
            }
        });
    }

    /**
     * Update resolution configuration
     * @param resolution Single resolution or array of resolutions in priority order
     * @returns Current configuration after update
     */
    public updateResolution(
        resolution: Resolution | Resolution[],
    ): WebcamConfig {
        return this.updateConfiguration({ resolution }, { restart: true });
    }

    /**
     * Update device configuration
     * @param deviceId ID of the camera device to use
     * @returns Current configuration after update
     */
    public updateDevice(device: MediaDeviceInfo): WebcamConfig {
        return this.updateConfiguration({ device }, { restart: true });
    }

    /**
     * toggle boolean setting
     * @param setting setting to toggle ('mirror', 'autoRotation', 'allowAnyResolution', 'audio')
     * @returns Promise that returns the current value after toggling
     * @throws CameraError if microphone permission is denied
     */
    public async toggle(
        setting: 'audio' | 'autoRotation' | 'allowAnyResolution',
    ): Promise<boolean> {
        this.checkConfiguration();
        const newValue = !this.state.configuration![setting];

        // if audio, check permission before
        if (setting === 'audio' && newValue) {
            // check microphone permission
            const micPermission = await this.checkMicrophonePermission();

            // if never requested permission, request permission before
            if (micPermission === 'prompt') {
                const permission = await this.requestMediaPermission('audio');
                if (permission === 'denied') {
                    throw new CameraError(
                        'microphone-permission-denied',
                        'Please allow microphone access',
                    );
                }
            }
            // if denied, throw error
            else if (micPermission === 'denied') {
                throw new CameraError(
                    'microphone-permission-denied',
                    'Please allow microphone access',
                );
            }
        }

        // Update resolution if autoRotation is enabled
        if (setting === 'autoRotation') {
            await this.getAdjustedResolutionRotation();
        }

        // update configuration
        const shouldRestart = setting === 'audio' || setting === 'autoRotation';
        this.updateConfiguration(
            { [setting]: newValue },
            { restart: shouldRestart },
        );

        return newValue;
    }

    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    public getConfiguration(): WebcamConfig {
        this.checkConfiguration();
        return { ...this.state.configuration! };
    }

    // Permission management
    public async checkCameraPermission(): Promise<PermissionState> {
        try {
            if (navigator?.permissions?.query) {
                const { state } = await navigator.permissions.query({
                    name: 'camera' as PermissionName,
                });
                this.state.currentPermission.camera = state as PermissionState;
                return state as PermissionState;
            }
            this.state.currentPermission.camera = 'prompt';
            return 'prompt';
        } catch (error) {
            console.warn('Permissions API error:', error);
            this.state.currentPermission.camera = 'prompt';
            return 'prompt';
        }
    }

    public async checkMicrophonePermission(): Promise<PermissionState> {
        try {
            if (navigator?.permissions?.query) {
                const { state } = await navigator.permissions.query({
                    name: 'microphone' as PermissionName,
                });
                this.state.currentPermission.microphone =
                    state as PermissionState;
                return state as PermissionState;
            }

            this.state.currentPermission.microphone = 'prompt';
            return 'prompt';
        } catch (error) {
            console.warn('Permissions API error:', error);
            this.state.currentPermission.microphone = 'prompt';
            return 'prompt';
        }
    }

    private async requestMediaPermission(
        mediaType: 'video' | 'audio',
    ): Promise<PermissionState> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                [mediaType]: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            const permissionType =
                mediaType === 'video' ? 'camera' : 'microphone';
            this.state.currentPermission[permissionType] = 'granted';
            return 'granted';
        } catch (error) {
            if (error instanceof Error) {
                if (
                    error.name === 'NotAllowedError' ||
                    error.name === 'PermissionDeniedError'
                ) {
                    const permissionType =
                        mediaType === 'video' ? 'camera' : 'microphone';
                    this.state.currentPermission[permissionType] = 'denied';
                    return 'denied';
                }
            }
            const permissionType =
                mediaType === 'video' ? 'camera' : 'microphone';
            this.state.currentPermission[permissionType] = 'prompt';
            return 'prompt';
        }
    }

    public async requestPermissions(): Promise<{
        camera: PermissionState;
        microphone: PermissionState;
    }> {
        // Request camera permission first
        const cameraPermission = await this.requestMediaPermission('video');

        // Request microphone permission only if needed
        let microphonePermission: PermissionState = 'prompt';
        if (this.state.configuration?.audio) {
            microphonePermission = await this.requestMediaPermission('audio');
        }

        return {
            camera: cameraPermission,
            microphone: microphonePermission,
        };
    }

    // Add new method for checking current permission status
    public getCurrentPermissions(): {
        camera: PermissionState;
        microphone: PermissionState;
    } {
        return { ...this.state.currentPermission };
    }

    // Add method for checking if permission is needed
    public needsPermissionRequest(): boolean {
        return (
            this.state.currentPermission.camera === 'prompt' ||
            (!!this.state.configuration?.audio &&
                this.state.currentPermission.microphone === 'prompt')
        );
    }

    // Add method for checking if permission is denied
    public hasPermissionDenied(): boolean {
        return (
            this.state.currentPermission.camera === 'denied' ||
            (!!this.state.configuration?.audio &&
                this.state.currentPermission.microphone === 'denied')
        );
    }

    // Method for capturing image
    public captureImage(
        config: {
            scale?: number;
            mediaType?: 'image/png' | 'image/jpeg';
            quality?: number; // 0.0 - 1.0
        } = {},
    ): string {
        this.checkConfiguration();
        if (!this.state.stream) {
            throw new CameraError(
                'no-stream',
                'No active stream to capture image from',
            );
        }

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        // Use canvas from state
        const canvas = this.state.captureCanvas!;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to get canvas context',
            );
        }

        const scale = config.scale || 1;
        canvas.width = (settings.width || 640) * scale;
        canvas.height = (settings.height || 480) * scale;

        if (this.state.configuration!.mirror) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(
            this.state.configuration!.previewElement!,
            0,
            0,
            canvas.width,
            canvas.height,
        );

        // Reset transform matrix
        if (this.state.configuration!.mirror) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }

        const mediaType = config.mediaType || 'image/png';
        const quality =
            typeof config.quality === 'number'
                ? Math.min(Math.max(config.quality, 0), 1) // Constrain value between 0-1
                : mediaType === 'image/jpeg'
                  ? 0.92
                  : undefined; // Default value for JPEG

        return canvas.toDataURL(mediaType, quality);
    }

    // Add method for checking device capabilities
    public async checkDevicesCapabilitiesData(
        deviceId: string,
    ): Promise<DeviceCapabilitiesData> {
        try {
            // Request camera permission first
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
            });

            const videoTrack = stream.getVideoTracks()[0];
            const capabilities =
                videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

            // Check width and height support
            if (
                capabilities.width?.max &&
                capabilities.width?.min &&
                capabilities.width?.step &&
                capabilities.height?.max &&
                capabilities.height?.min &&
                capabilities.height?.step
            ) {
                const widths = Array.from(
                    {
                        length:
                            Math.floor(
                                (capabilities.width.max -
                                    capabilities.width.min) /
                                    capabilities.width.step,
                            ) + 1,
                    },
                    (_, i) =>
                        capabilities.width!.min + i * capabilities.width!.step,
                );
                const heights = Array.from(
                    {
                        length:
                            Math.floor(
                                (capabilities.height.max -
                                    capabilities.height.min) /
                                    capabilities.height.step,
                            ) + 1,
                    },
                    (_, i) =>
                        capabilities.height!.min +
                        i * capabilities.height!.step,
                );
            }

            // Store frame rate information
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

            // Stop camera usage
            stream.getTracks().forEach((track) => track.stop());

            return {
                deviceId,
                maxWidth: capabilities.width?.max || 0,
                maxHeight: capabilities.height?.max || 0,
                minWidth: capabilities.width?.min || 0,
                minHeight: capabilities.height?.min || 0,
                supportedFrameRates: frameRates,
                hasZoom: !!capabilities.zoom,
                hasTorch: !!capabilities.torch,
                hasFocus: !!capabilities.focusMode,
                maxZoom: capabilities.zoom?.max,
                minZoom: capabilities.zoom?.min,
                supportedFocusModes: capabilities.focusMode,
            };
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to check device capabilities',
                error as Error,
            );
        }
    }

    // Add method for checking resolution support
    public checkSupportedResolutions(
        deviceCapabilities: DeviceCapabilitiesData[],
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
            const isSupported =
                resolution.width <= capability.maxWidth &&
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

    private async initializeWebcam(): Promise<void> {
        // set status to initializing
        this.state.status = WebcamStatus.INITIALIZING;
        this.state.lastError = null;

        // request permissions
        const permissions = await this.requestPermissions();
        this.validatePermissions(permissions);

        // open camera
        await this.openCamera();
    }

    /**
     * Open camera with appropriate resolution based on configuration
     * Handles different scenarios:
     * 1. No resolution specified + allowAnyResolution = true
     * 2. Resolution specified
     * 3. Allow any resolution
     * @throws CameraError if camera cannot be opened
     */
    private async openCamera(): Promise<void> {
        // Case 1: No resolution specified
        if (!this.state.configuration!.resolution) {
            if (!this.state.configuration!.allowAnyResolution) {
                throw new CameraError(
                    'configuration-error',
                    'Please specify a resolution or set allowAnyResolution to true',
                );
            }

            try {
                await this.tryAnyResolution();
                return;
            } catch (error) {
                throw new CameraError(
                    'camera-initialization-error',
                    'Failed to open camera with supported resolution',
                    error as Error,
                );
            }
        }

        // Get resolutions from configuration
        const resolutions = Array.isArray(this.state.configuration!.resolution)
            ? this.state.configuration!.resolution
            : [this.state.configuration!.resolution];

        // Case 2: Try specified resolutions
        let lastError: Error | null = null;
        for (const resolution of resolutions) {
            try {
                await this.tryResolution(resolution);
                return; // Success, exit function
            } catch (error) {
                lastError = error as Error;
                console.log(
                    `Failed to open camera with resolution: ${resolution.key}. Trying next...`,
                );
            }
        }

        // Case 3: All specified resolutions failed
        if (this.state.configuration!.allowAnyResolution) {
            try {
                console.log(
                    'All specified resolutions failed. Trying any supported resolution...',
                );
                await this.tryAnyResolution();
            } catch (error) {
                throw new CameraError(
                    'camera-initialization-error',
                    'Failed to open camera with any resolution',
                    lastError || (error as Error),
                );
            }
        } else {
            // If allowAnyResolution is false, throw error immediately
            throw new CameraError(
                'camera-initialization-error',
                'Failed to open camera with specified resolutions and allowAnyResolution is false',
                lastError || undefined,
            );
        }
    }

    /**
     * Try to open camera with specific resolution
     * @param resolution Resolution to try
     * @throws CameraError if camera cannot be opened with specified resolution
     */
    private async tryResolution(resolution: Resolution): Promise<void> {
        const resolutionString = `${resolution.width}x${resolution.height}`;
        console.log(
            `Attempting to open camera with resolution: ${resolution.key} (${resolutionString})`,
        );

        // Build constraints based on resolution
        const constraints = this.buildConstraints(resolution);
        console.log('Using constraints:', constraints);

        try {
            // Request camera access with constraints
            this.state.stream =
                await navigator.mediaDevices.getUserMedia(constraints);

            // Update capabilities and setup preview
            await this.updateCapabilities();
            await this.setupPreviewElement();

            console.log(
                `Successfully opened camera with resolution: ${resolution.key}`,
            );

            // Update status and call onStart callback
            this.state.status = WebcamStatus.READY;
            this.state.configuration?.onStart?.();
        } catch (error) {
            console.error(
                `Failed to open camera with resolution: ${resolution.key}`,
                error,
            );
            throw error;
        }
    }

    /**
     * Try to open camera with any supported resolution
     * Uses 4K as ideal resolution but allows browser to choose best available
     * @throws CameraError if camera cannot be opened with any resolution
     */
    private async tryAnyResolution(): Promise<void> {
        console.log(
            'Attempting to open camera with any supported resolution (ideal: 4K)',
        );

        // Check if device is available
        if (!this.state.configuration!.device) {
            throw new CameraError('no-device', 'Selected device not found');
        }

        // Create constraints with ideal resolution as 4K
        const constraints: MediaStreamConstraints = {
            audio: this.state.configuration!.audio,
            video: {
                deviceId: { exact: this.state.configuration!.device.deviceId },
                width: { ideal: 3840 },
                height: { ideal: 2160 },
            },
        };

        try {
            // Request camera access with constraints
            this.state.stream =
                await navigator.mediaDevices.getUserMedia(constraints);

            // Update capabilities and setup preview
            await this.updateCapabilities();
            await this.setupPreviewElement();

            // Log actual resolution obtained
            const videoTrack = this.state.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            const actualResolution = `${settings.width}x${settings.height}`;
            console.log(`Opened camera with resolution: ${actualResolution}`);

            // Update status and call onStart callback
            this.state.status = WebcamStatus.READY;
            this.state.configuration?.onStart?.();
        } catch (error) {
            console.error(
                'Failed to initialize camera with any resolution',
                error,
            );
            throw new CameraError(
                'camera-initialization-error',
                'Failed to initialize camera with any resolution',
                error as Error,
            );
        }
    }

    private async setupPreviewElement(): Promise<void> {
        if (this.state.configuration!.previewElement && this.state.stream) {
            this.state.configuration!.previewElement.srcObject =
                this.state.stream;
            this.state.configuration!.previewElement.style.transform = this
                .state.configuration!.mirror
                ? 'scaleX(-1)'
                : 'none';
            await this.state.configuration!.previewElement.play();
        }
    }

    private async updateCapabilities(): Promise<void> {
        if (!this.state.stream) return;

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities =
            videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings;

        this.state.capabilities = {
            hasZoom: !!capabilities.zoom,
            hasTorch: !!capabilities.torch,
            hasFocus: !!capabilities.focusMode,
            currentZoom: settings.zoom || 1,
            minZoom: capabilities.zoom?.min || 1,
            maxZoom: capabilities.zoom?.max || 1,
            isTorchActive: settings.torch || false,
            isFocusActive: !!settings.focusMode,
            activeFocusMode: settings.focusMode || 'none',
            availableFocusModes: capabilities.focusMode || [],
        };
    }

    /**
     * Build media constraints for getUserMedia based on resolution
     * @param resolution Resolution to use for constraints
     * @returns MediaStreamConstraints object
     */
    private buildConstraints(resolution: Resolution): MediaStreamConstraints {
        // Create video constraints with device ID
        const videoConstraints: MediaTrackConstraints = {
            deviceId: { exact: this.state.configuration!.device.deviceId },
            width: { exact: resolution.width },
            height: { exact: resolution.height },
        };

        // Create complete constraints object
        return {
            video: videoConstraints,
            audio: this.state.configuration!.audio,
        };
    }

    private checkConfiguration(): void {
        if (!this.state.configuration) {
            throw new CameraError(
                'configuration-error',
                'Please call setupConfiguration() before using webcam',
            );
        }
    }

    private handleError(error: Error): void {
        // Store error and change state to ERROR
        this.state.status = WebcamStatus.ERROR;
        this.state.lastError =
            error instanceof CameraError
                ? error
                : new CameraError('unknown', error.message, error);

        // Call callback onError if configuration exists
        this.state.configuration?.onError?.(
            this.state.lastError as CameraError,
        );
    }

    private stopStream(): void {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach((track) => track.stop());
            this.state.stream = null;
        }

        if (this.state.configuration!.previewElement) {
            this.state.configuration!.previewElement.srcObject = null;
        }
    }

    private resetState(): void {
        this.stopChangeListeners();

        // Reset only basic system state
        this.state = {
            ...this.state,
            status: WebcamStatus.IDLE,
            stream: null,
            lastError: null,
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
        };
    }

    private validatePermissions(permissions: {
        camera: PermissionState;
        microphone: PermissionState;
    }): void {
        if (permissions.camera === 'denied') {
            throw new CameraError(
                'permission-denied',
                'Please allow camera access',
            );
        }
        if (
            this.state.configuration!.audio &&
            permissions.microphone === 'denied'
        ) {
            throw new CameraError(
                'microphone-permission-denied',
                'Please allow microphone access',
            );
        }
    }
}

export default Webcam;
