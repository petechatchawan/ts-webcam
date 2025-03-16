export type PermissionState = 'granted' | 'denied' | 'prompt';
export type CameraErrorCode = 'no-permissions-api' | 'permission-denied' | 'microphone-permission-denied' | 'configuration-error' | 'no-device' | 'no-media-devices-support' | 'invalid-device-id' | 'no-resolutions' | 'camera-start-error' | 'camera-initialization-error' | 'no-stream' | 'camera-settings-error' | 'camera-stop-error' | 'camera-already-in-use' | 'zoom-not-supported' | 'torch-not-supported' | 'focus-not-supported' | 'device-list-error' | 'unknown';
export declare class CameraError extends Error {
    code: CameraErrorCode;
    originalError?: Error | undefined;
    constructor(code: CameraErrorCode, message: string, originalError?: Error | undefined);
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
export declare enum WebcamStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    ERROR = "error"
}
export type OrientationType = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'unknown';
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
export declare class Webcam {
    private state;
    private deviceChangeListener;
    private orientationChangeListener;
    private readonly defaultConfiguration;
    constructor();
    getWebcamState(): WebcamState;
    getWebcamStatus(): WebcamStatus;
    getCapabilities(): CameraFeatures;
    getLastError(): CameraError | null;
    setResolutions(resolutions: Resolution[]): void;
    getResolutions(): Resolution[];
    clearError(): void;
    isActive(): boolean;
    /**
     * Get current audio status
     * @returns Current audio status or false if not set
     */
    isAudioEnabled(): boolean;
    /**
     * Get current mirror mode status
     * @returns Current mirror status or false if not set
     */
    isMirrorEnabled(): boolean;
    /**
     * Get current autoRotation status
     * @returns Current autoRotation status or false if not set
     */
    isAutoRotationEnabled(): boolean;
    /**
     * Get current allowAnyResolution status
     * @returns Current allowAnyResolution status or false if not set
     */
    isAllowAnyResolution(): boolean;
    /**
     * Check if camera supports zoom
     * @returns true if camera supports zoom, false otherwise
     */
    isZoomSupported(): boolean;
    /**
     * Check if camera supports torch/flashlight
     * @returns true if camera supports torch, false otherwise
     */
    isTorchSupported(): boolean;
    /**
     * Check if camera supports focus
     * @returns true if camera supports focus, false otherwise
     */
    isFocusSupported(): boolean;
    /**
     * Get current zoom level
     * @returns Current zoom level or 1 if not available
     */
    getCurrentZoom(): number;
    /**
     * Get minimum supported zoom level
     * @returns Minimum zoom level or 1 if not available
     */
    getMinZoom(): number;
    /**
     * Get maximum supported zoom level
     * @returns Maximum zoom level or 1 if not available
     */
    getMaxZoom(): number;
    /**
     * Check if torch/flashlight is currently active
     * @returns true if torch is active, false otherwise
     */
    isTorchActive(): boolean;
    /**
     * Check if focus is currently active
     * @returns true if focus is active, false otherwise
     */
    isFocusActive(): boolean;
    setupChangeListeners(): void;
    stopChangeListeners(): void;
    /**
     * Get available devices
     * @returns Promise that resolves to an array of MediaDeviceInfo objects
     */
    private getAvailableDevices;
    getDeviceList(): MediaDeviceInfo[];
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    getAudioInputDevices(): Promise<MediaDeviceInfo[]>;
    getAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
    refreshDevices(): Promise<void>;
    /**
     * Get current device
     * @returns Current device or null if no device
     */
    getCurrentDevice(): MediaDeviceInfo | null;
    /**
     * Get current resolution from active video track
     * @returns Resolution object with current width, height and key, or null if no stream
     */
    getCurrentResolution(): Resolution | null;
    /**
     * Setup configuration for the webcam
     * @param configuration - Configuration object
     */
    setupConfiguration(configuration: WebcamConfig): void;
    /**
     * Start the webcam
     * @returns Promise that resolves when the webcam is started
     */
    start(): Promise<void>;
    /**
     * Stop the webcam
     */
    stop(): void;
    /**
     * Check if video is ready for display
     * @returns Promise that resolves to true if video is ready
     */
    previewIsReady(): Promise<boolean>;
    /**
     * Set the zoom level for the camera
     * @param zoomLevel Zoom level to set (will be constrained to min/max range)
     * @throws CameraError if zoom is not supported or camera is not active
     */
    setZoom(zoomLevel: number): Promise<void>;
    /**
     * Set the torch mode for the camera
     * @param active Whether to activate (true) or deactivate (false) the torch
     * @throws CameraError if torch is not supported or camera is not active
     */
    setTorch(active: boolean): Promise<void>;
    /**
     * Set the focus mode for the camera
     * @param mode The focus mode to set (e.g., 'auto', 'continuous', 'manual')
     * @throws CameraError if focus mode is not supported or camera is not active
     */
    setFocusMode(mode: string): Promise<void>;
    /**
     * Toggle torch/flashlight on/off
     * @returns New torch state after toggle (true = on, false = off)
     * @throws CameraError if torch is not supported or camera is not active
     */
    toggleTorch(): Promise<boolean>;
    /**
     * Toggle mirror mode
     * @returns New mirror state after toggle (true = on, false = off)
     */
    toggleMirror(): boolean;
    /**
     * Create a new Resolution object with key
     * @param width Width in pixels
     * @param height Height in pixels
     * @returns Resolution object with key in format "widthxheight"
     */
    createResolution(width: number, height: number): Resolution;
    /**
     * Update webcam configuration
     * @param configuration Configuration to update
     * @param options Additional options for updating
     * @returns Current configuration after update
     */
    updateConfiguration(configuration: Partial<WebcamConfig>, options?: {
        restart?: boolean;
    }): WebcamConfig;
    /**
     * Adjust resolution dimensions for rotation
     * Swaps width and height for all resolutions in the state
     * and updates their keys accordingly
     * @returns Promise that resolves when resolution adjustment is complete
     */
    private getAdjustedResolutionRotation;
    /**
     * Update resolution configuration
     * @param resolution Single resolution or array of resolutions in priority order
     * @returns Current configuration after update
     */
    updateResolution(resolution: Resolution | Resolution[]): WebcamConfig;
    /**
     * Update device configuration
     * @param deviceId ID of the camera device to use
     * @returns Current configuration after update
     */
    updateDevice(device: MediaDeviceInfo): WebcamConfig;
    /**
     * toggle boolean setting
     * @param setting setting to toggle ('mirror', 'autoRotation', 'allowAnyResolution', 'audio')
     * @returns Promise that returns the current value after toggling
     * @throws CameraError if microphone permission is denied
     */
    toggle(setting: 'audio' | 'autoRotation' | 'allowAnyResolution'): Promise<boolean>;
    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfiguration(): WebcamConfig;
    checkCameraPermission(): Promise<PermissionState>;
    checkMicrophonePermission(): Promise<PermissionState>;
    private requestMediaPermission;
    requestPermissions(): Promise<{
        camera: PermissionState;
        microphone: PermissionState;
    }>;
    getCurrentPermissions(): {
        camera: PermissionState;
        microphone: PermissionState;
    };
    needsPermissionRequest(): boolean;
    hasPermissionDenied(): boolean;
    captureImage(config?: {
        scale?: number;
        mediaType?: 'image/png' | 'image/jpeg';
        quality?: number;
    }): string;
    checkDevicesCapabilitiesData(deviceId: string): Promise<DeviceCapabilitiesData>;
    checkSupportedResolutions(deviceCapabilities: DeviceCapabilitiesData[], desiredResolutions: Resolution[]): {
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
    };
    private initializeWebcam;
    /**
     * Open camera with appropriate resolution based on configuration
     * Handles different scenarios:
     * 1. No resolution specified + allowAnyResolution = true
     * 2. Resolution specified
     * 3. Allow any resolution
     * @throws CameraError if camera cannot be opened
     */
    private openCamera;
    /**
     * Try to open camera with specific resolution
     * @param resolution Resolution to try
     * @throws CameraError if camera cannot be opened with specified resolution
     */
    private tryResolution;
    /**
     * Try to open camera with any supported resolution
     * Uses 4K as ideal resolution but allows browser to choose best available
     * @throws CameraError if camera cannot be opened with any resolution
     */
    private tryAnyResolution;
    private setupPreviewElement;
    private updateCapabilities;
    /**
     * Build media constraints for getUserMedia based on resolution
     * @param resolution Resolution to use for constraints
     * @returns MediaStreamConstraints object
     */
    private buildConstraints;
    private checkConfiguration;
    private handleError;
    private stopStream;
    private resetState;
    private validatePermissions;
}
export default Webcam;
