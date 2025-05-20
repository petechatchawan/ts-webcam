import { UAInfo } from 'ua-info';

/**
 * Represents the permission state for device access
 * - 'granted': Permission has been granted
 * - 'denied': Permission has been denied
 * - 'prompt': Permission has not been requested yet
 */
type PermissionStatus = 'granted' | 'denied' | 'prompt';
/**
 * Standardized error codes for webcam operations
 *
 * - PERMISSION_DENIED: Camera or microphone permission was denied
 * - PERMISSION_PROMPT_BLOCKED: Permission prompt was blocked by the browser
 * - DEVICE_NOT_FOUND: No camera device was found or specified device is unavailable
 * - RESOLUTION_UNSUPPORTED: The requested resolution is not supported by the device
 * - STREAM_ERROR: Error occurred while accessing or manipulating the media stream
 * - NOT_INITIALIZED: Webcam was not properly initialized before use
 * - UNKNOWN_ERROR: An unexpected error occurred
 */
type WebcamErrorCode = 'PERMISSION_DENIED' | 'PERMISSION_PROMPT_BLOCKED' | 'DEVICE_NOT_FOUND' | 'RESOLUTION_UNSUPPORTED' | 'STREAM_ERROR' | 'NOT_INITIALIZED' | 'UNKNOWN_ERROR';
/**
 * Represents the possible device orientations
 *
 * - 'portrait-primary': Device is in portrait mode (normal)
 * - 'portrait-secondary': Device is in portrait mode (upside down)
 * - 'landscape-primary': Device is in landscape mode (normal)
 * - 'landscape-secondary': Device is in landscape mode (upside down)
 * - 'unknown': Device orientation could not be determined
 */
type DeviceOrientation = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'unknown';
/**
 * Enum representing the possible states of a webcam
 *
 * - IDLE: Webcam is not active
 * - INITIALIZING: Webcam is in the process of starting
 * - READY: Webcam is active and ready to use
 * - ERROR: An error occurred while using the webcam
 */
declare enum WebcamStatus {
    /** Webcam is not active */
    IDLE = "idle",
    /** Webcam is in the process of starting */
    INITIALIZING = "initializing",
    /** Webcam is active and ready to use */
    READY = "ready",
    /** An error occurred while using the webcam */
    ERROR = "error"
}

/**
 * Custom error class for webcam-related errors
 * Provides standardized error codes and detailed error information
 */
declare class WebcamError extends Error {
    /**
     * The standardized error code identifying the type of error
     */
    readonly code: WebcamErrorCode;
    /**
     * The original error that caused this WebcamError, if any
     */
    readonly originalError?: Error;
    /**
     * Creates a new WebcamError
     *
     * @param code - Standardized error code
     * @param message - Human-readable error message
     * @param originalError - Original error that caused this error (optional)
     */
    constructor(code: WebcamErrorCode, message: string, originalError?: Error);
    /**
     * Returns a string representation of the error including code and original error
     */
    toString(): string;
}

/**
 * Represents a specific webcam resolution configuration
 */
interface Resolution {
    /** Unique identifier for the resolution (typically "widthxheight") */
    id: string;
    /** Human-readable label for the resolution */
    label: string;
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
}
/**
 * Configuration options for initializing a webcam
 */
interface WebcamConfiguration {
    /** Camera device to use */
    deviceInfo: MediaDeviceInfo;
    /** HTML video element to display the webcam stream */
    videoElement: HTMLVideoElement;
    /** Whether to enable audio capture alongside video */
    enableAudio?: boolean;
    /** Desired resolution(s) to use (in order of preference) */
    preferredResolutions?: Resolution | Resolution[];
    /** Whether to mirror the video display horizontally */
    mirrorVideo?: boolean;
    /** Whether to allow any resolution if specified resolution is not supported */
    allowFallbackResolution?: boolean;
    /** Whether to automatically swap width/height on mobile devices */
    allowAutoRotateResolution?: boolean;
    /** Enable debug mode to show console.log messages */
    debug?: boolean;
    /** Callback when webcam starts successfully */
    onStart?: () => void;
    /** Callback when an error occurs */
    onError?: (error: WebcamError) => void;
}
/**
 * Comprehensive state interface for managing webcam functionality
 */
interface WebcamState {
    /** Current operational status of the webcam */
    status: WebcamStatus;
    /** Configuration used to start the webcam */
    configuration: WebcamConfiguration | null;
    /** Last encountered error, if any */
    lastError: WebcamError | null;
    /** Canvas element used internally for image capture */
    snapshotCanvas?: HTMLCanvasElement;
    /** List of available video input devices */
    videoDevices: MediaDeviceInfo[];
    /** Capabilities of the currently selected device */
    deviceCapabilities: WebcamCapabilities;
    /** Media stream currently being used */
    mediaStream: MediaStream | null;
    /** Detected device orientation (for mobile responsiveness) */
    deviceOrientation?: DeviceOrientation;
    /** Resolution currently being used by the active stream */
    activeResolution?: Resolution | null;
    /** Permission states for camera and microphone */
    permissionStates: {
        camera: PermissionStatus;
        microphone: PermissionStatus;
    };
}
/**
 * Interface for managing and checking webcam hardware capabilities
 */
interface WebcamCapabilities {
    /** Whether zoom is supported by the device */
    zoomSupported: boolean;
    /** Whether torch/flashlight is supported by the device */
    torchSupported: boolean;
    /** Whether focus control is supported by the device */
    focusSupported: boolean;
    /** Current zoom level */
    zoomLevel: number;
    /** Minimum zoom level supported by the device */
    minZoomLevel: number;
    /** Maximum zoom level supported by the device */
    maxZoomLevel: number;
    /** Whether torch/flashlight is currently active */
    torchActive: boolean;
    /** Whether manual focus is currently active */
    focusActive: boolean;
    /** Current focus mode */
    currentFocusMode: string;
    /** List of focus modes supported by the device */
    supportedFocusModes: string[];
}
/**
 * Information about a webcam device's hardware capabilities
 */
interface DeviceCapabilities {
    /** Device identifier */
    deviceId: string;
    /** Maximum supported width in pixels */
    maxWidth: number;
    /** Maximum supported height in pixels */
    maxHeight: number;
    /** Minimum supported width in pixels */
    minWidth: number;
    /** Minimum supported height in pixels */
    minHeight: number;
    /** List of supported frame rates */
    supportedFrameRates: number[];
    /** Whether zoom is supported */
    zoomSupported: boolean;
    /** Whether torch/flashlight is supported */
    torchSupported: boolean;
    /** Whether focus control is supported */
    focusSupported: boolean;
    /** Maximum zoom level (if zoom is supported) */
    maxZoomLevel?: number;
    /** Minimum zoom level (if zoom is supported) */
    minZoomLevel?: number;
    /** List of supported focus modes (if focus is supported) */
    supportedFocusModes?: string[];
}
/**
 * Extended MediaTrackCapabilities with additional webcam-specific capabilities
 * Extends the standard MediaTrackCapabilities with properties specific to webcams
 */
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
    /** Zoom capability range */
    zoom?: {
        min: number;
        max: number;
        step: number;
    };
    /** Whether torch/flashlight is supported */
    torch?: boolean;
    /** List of supported focus modes */
    focusMode?: string[];
    /** Width capability range */
    width?: {
        min: number;
        max: number;
        step: number;
    };
    /** Height capability range */
    height?: {
        min: number;
        max: number;
        step: number;
    };
    /** Frame rate capability range */
    frameRate?: {
        min: number;
        max: number;
        step: number;
    };
}
/**
 * Extended MediaTrackSettings with additional webcam-specific settings
 * Extends the standard MediaTrackSettings with properties specific to webcams
 */
interface ExtendedMediaTrackSettings extends MediaTrackSettings {
    /** Current zoom level */
    zoom?: number;
    /** Whether torch/flashlight is active */
    torch?: boolean;
    /** Current focus mode */
    focusMode?: string;
}
/**
 * Extended MediaTrackConstraintSet with additional webcam-specific constraints
 * Extends the standard MediaTrackConstraintSet with properties specific to webcams
 */
interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
    /** Desired zoom level */
    zoom?: number;
    /** Desired torch/flashlight state */
    torch?: boolean;
    /** Desired focus mode */
    focusMode?: string;
}

declare class Webcam {
    private state;
    private deviceChangeListener;
    private orientationChangeListener;
    uaInfo: UAInfo;
    constructor();
    /**
     * Internal logging function that only logs when debug mode is enabled
     * @param message The message to log
     * @param data Optional data to log
     */
    private log;
    /**
     * Get the current state of the webcam
     */
    getState(): WebcamState;
    /**
     * Get the current status of the webcam (IDLE, INITIALIZING, READY, ERROR)
     */
    getStatus(): WebcamStatus;
    /**
     * Check if the webcam is currently active
     */
    isActive(): boolean;
    /**
     * Get the last error that occurred
     */
    getLastError(): WebcamError | null;
    /**
     * Clear the last error and reset status if not active
     */
    clearError(): void;
    /**
     * Check if audio is enabled in the configuration
     */
    isAudioEnabled(): boolean;
    /**
     * Check if video mirroring is enabled
     */
    isMirrorEnabled(): boolean;
    /**
     * Check if resolution swap is allowed on mobile devices
     */
    isResolutionSwapAllowed(): boolean;
    /**
     * Check if fallback to any supported resolution is allowed
     */
    isFallbackResolutionAllowed(): boolean;
    /**
     * Check if debug mode is enabled
     */
    isDebugEnabled(): boolean;
    /**
     * Get current device capabilities
     */
    getCurrentDeviceCapabilities(): WebcamCapabilities;
    /**
     * Check if zoom is supported by the device
     */
    isZoomSupported(): boolean;
    /**
     * Check if torch/flashlight is supported by the device
     */
    isTorchSupported(): boolean;
    /**
     * Check if focus control is supported by the device
     */
    isFocusSupported(): boolean;
    /**
     * Get the current zoom level
     */
    getZoomLevel(): number;
    /**
     * Get the minimum supported zoom level
     */
    getMinZoomLevel(): number;
    /**
     * Get the maximum supported zoom level
     */
    getMaxZoomLevel(): number;
    /**
     * Check if torch/flashlight is currently active
     */
    isTorchActive(): boolean;
    /**
     * Check if focus control is currently active
     */
    isFocusActive(): boolean;
    /**
     * Set up the webcam configuration
     * @param configuration The configuration to use
     */
    setupConfiguration(configuration: WebcamConfiguration): void;
    /**
     * Start the webcam with the current configuration
     * @throws WebcamError if the webcam fails to start
     */
    start(): Promise<void>;
    /**
     * Stop the webcam and reset the state
     */
    stop(): void;
    /**
     * Check if the video preview element is ready to display content
     * @returns Promise that resolves to true if the preview is ready, false otherwise
     */
    isVideoPreviewReady(): Promise<boolean>;
    /**
     * Set the zoom level of the camera
     * @param zoomLevel The zoom level to set
     * @throws WebcamError if zoom is not supported or fails to set
     */
    setZoomLevel(zoomLevel: number): Promise<void>;
    /**
     * Enable or disable the torch/flashlight
     * @param active Whether to enable the torch
     * @throws WebcamError if torch is not supported or fails to set
     */
    enableTorch(active: boolean): Promise<void>;
    /**
     * Set the focus mode of the camera
     * @param mode The focus mode to set
     * @throws WebcamError if focus mode is not supported or fails to set
     */
    setFocusMode(mode: string): Promise<void>;
    /**
     * Toggle the torch/flashlight on/off
     * @returns The new torch state (true = on, false = off)
     * @throws WebcamError if torch is not supported
     */
    toggleTorch(): Promise<boolean>;
    /**
     * Toggle video mirroring on/off
     * @returns The new mirror state (true = mirrored, false = normal)
     */
    toggleMirror(): boolean;
    /**
     * Toggle debug mode on/off
     * @returns The new debug state (true = enabled, false = disabled)
     */
    toggleDebug(): boolean;
    /**
     * Create a resolution object with the specified parameters
     * @param name The name/identifier for the resolution
     * @param width The width in pixels
     * @param height The height in pixels
     * @returns A Resolution object
     */
    createResolution(name: string, width: number, height: number): Resolution;
    /**
     * Get the current webcam configuration
     * @returns The current configuration
     */
    getConfiguration(): WebcamConfiguration;
    /**
     * Update the webcam configuration
     * @param configuration The configuration properties to update
     * @param options Options for the update (restart: whether to restart the webcam)
     * @returns The updated configuration
     */
    updateConfiguration(configuration: Partial<WebcamConfiguration>, options?: {
        restart?: boolean;
    }): WebcamConfiguration;
    /**
     * Update the preferred resolution(s)
     * @param resolution The resolution or array of resolutions to use
     * @param options Options for the update (restart: whether to restart the webcam)
     * @returns The updated configuration
     */
    updateResolution(resolution: Resolution | Resolution[], options?: {
        restart?: boolean;
    }): WebcamConfiguration;
    /**
     * Update the camera device
     * @param device The device to use
     * @param options Options for the update (restart: whether to restart the webcam)
     * @returns The updated configuration
     */
    updateDevice(device: MediaDeviceInfo, options?: {
        restart?: boolean;
    }): WebcamConfiguration;
    /**
     * Toggle a boolean setting in the configuration
     * @param setting The setting to toggle
     * @returns The new value of the setting
     * @throws WebcamError if microphone permission is denied when enabling audio
     */
    toggleSetting(setting: "enableAudio" | "allowAutoRotateResolution" | "allowFallbackResolution" | "debug"): Promise<boolean>;
    /**
     * Check the current camera permission status
     * @returns The current permission status (granted, denied, prompt)
     */
    checkCameraPermission(): Promise<PermissionStatus>;
    /**
     * Check the current microphone permission status
     * @returns The current permission status (granted, denied, prompt)
     */
    checkMicrophonePermission(): Promise<PermissionStatus>;
    /**
     * Request camera and microphone permissions
     * @returns Object containing the permission status for camera and microphone
     */
    requestPermissions(): Promise<{
        camera: PermissionStatus;
        microphone: PermissionStatus;
    }>;
    /**
     * Get the current permission states for camera and microphone
     * @returns Object containing the current permission states
     */
    getPermissionStates(): {
        camera: PermissionStatus;
        microphone: PermissionStatus;
    };
    /**
     * Check if permission request is needed for camera or microphone
     * @returns True if permission request is needed, false otherwise
     */
    needsPermissionRequest(): Promise<boolean>;
    /**
     * Check if permission has been denied for camera or microphone
     * @returns True if permission has been denied, false otherwise
     */
    hasPermissionDenied(): boolean;
    /**
     * Capture an image from the current webcam stream
     * @param config Configuration options for the capture (scale, mediaType, quality)
     * @returns Promise that resolves to a data URL of the captured image
     * @throws WebcamError if capture fails
     */
    captureImage(config?: {
        scale?: number;
        mediaType?: "image/png" | "image/jpeg";
        quality?: number;
    }): Promise<string>;
    /**
     * Get detailed capabilities of a specific device
     * @param deviceId The ID of the device to check
     * @returns Promise that resolves to the device capabilities
     * @throws WebcamError if capabilities check fails
     */
    getDeviceCapabilities(deviceId: string): Promise<DeviceCapabilities>;
    /**
     * Check which resolutions are supported by the device
     * @param deviceCapabilities The capabilities of the device
     * @param desiredResolutions The resolutions to check
     * @returns Object containing supported resolutions and device info
     */
    checkSupportedResolutions(deviceCapabilities: DeviceCapabilities[], desiredResolutions: Resolution[]): {
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
    setupChangeListeners(): Promise<void>;
    private getAvailableDevices;
    refreshDevices(): Promise<void>;
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    /**
     * Get all available media devices (video, audio input, audio output)
     * @returns Promise that resolves to an array of all devices
     */
    getAllDevices(): Promise<MediaDeviceInfo[]>;
    getAudioInputDevices(): Promise<MediaDeviceInfo[]>;
    getAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
    getCurrentDevice(): MediaDeviceInfo | null;
    getCurrentResolution(): Resolution | null;
    private initializeWebcam;
    private openWebcam;
    private tryResolution;
    private tryAnyResolution;
    private setupPreviewElement;
    private updateCapabilities;
    private checkConfiguration;
    private handleError;
    private stopStream;
    private resetState;
    private requestMediaPermission;
    private stopChangeListeners;
}

export { type DeviceCapabilities, type DeviceOrientation, type ExtendedMediaTrackCapabilities, type ExtendedMediaTrackConstraintSet, type ExtendedMediaTrackSettings, type PermissionStatus, type Resolution, Webcam, type WebcamCapabilities, type WebcamConfiguration, WebcamError, type WebcamErrorCode, type WebcamState, WebcamStatus };
