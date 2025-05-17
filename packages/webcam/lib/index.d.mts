/**
 * Resolution configuration for the webcam
 */
interface Resolution {
    width: number;
    height: number;
    aspectRatio?: number;
    frameRate?: number;
}
/**
 * Common resolutions that can be used
 */
declare const CommonResolutions: {
    VGA: Resolution;
    HD: Resolution;
    FULL_HD: Resolution;
    QVGA: Resolution;
    SVGA: Resolution;
    XGA: Resolution;
    UXGA: Resolution;
    QXGA: Resolution;
};
/**
 * Device information
 */
interface DeviceInfo {
    id: string;
    label: string;
    kind: MediaDeviceKind;
}
/**
 * Webcam configuration options
 */
interface WebcamOptions {
    /** Preferred resolution for the webcam */
    resolution?: Resolution;
    /** Device ID to use (if not provided, the system default will be used) */
    deviceId?: string;
    /** Whether to enable audio (default: false) */
    audio?: boolean;
    /** Whether to enable debug logging (default: false) */
    debug?: boolean;
    /** Whether to mirror the video (useful for front-facing cameras) (default: false) */
    mirrored?: boolean;
    /** Whether to automatically request permissions on initialization (default: true) */
    autoRequestPermissions?: boolean;
    /** Custom constraints to pass to getUserMedia */
    customConstraints?: MediaStreamConstraints;
}
/**
 * Webcam state
 */
declare enum WebcamState {
    IDLE = "IDLE",
    REQUESTING_PERMISSIONS = "REQUESTING_PERMISSIONS",
    INITIALIZING = "INITIALIZING",
    ACTIVE = "ACTIVE",
    ERROR = "ERROR",
    STOPPING = "STOPPING"
}
/**
 * Webcam event types
 */
declare enum WebcamEventType {
    STATE_CHANGE = "STATE_CHANGE",
    ERROR = "ERROR",
    STREAM_STARTED = "STREAM_STARTED",
    STREAM_STOPPED = "STREAM_STOPPED",
    DEVICE_CHANGE = "DEVICE_CHANGE",
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
}
/**
 * Webcam event listener
 */
type WebcamEventListener<T = any> = (data: T) => void;
/**
 * Webcam event map
 */
interface WebcamEventMap {
    [WebcamEventType.STATE_CHANGE]: WebcamState;
    [WebcamEventType.ERROR]: Error;
    [WebcamEventType.STREAM_STARTED]: MediaStream;
    [WebcamEventType.STREAM_STOPPED]: void;
    [WebcamEventType.DEVICE_CHANGE]: DeviceInfo[];
    [WebcamEventType.PERMISSION_CHANGE]: PermissionState;
}

/**
 * Main webcam class that handles camera operations
 */
declare class Webcam {
    private options;
    private state;
    private stream;
    private videoElement;
    private devices;
    private currentDeviceId;
    private currentResolution;
    private permissionState;
    private operationPromise;
    private eventListeners;
    private deviceChangeListener;
    /**
     * Creates a new Webcam instance
     * @param options Configuration options for the webcam
     */
    constructor(options?: WebcamOptions);
    /**
     * Logs debug messages if debug mode is enabled
     * @param args Arguments to log
     */
    private log;
    /**
     * Sets up the device change listener
     */
    private setupDeviceChangeListener;
    /**
     * Updates the list of available devices
     */
    private updateDeviceList;
    /**
     * Checks if the browser supports the required APIs
     */
    private checkBrowserSupport;
    /**
     * Checks and requests camera permissions
     */
    checkPermissions(): Promise<PermissionState>;
    /**
     * Starts the webcam
     * @param deviceId Optional device ID to use
     * @param resolution Optional resolution to use
     */
    start(deviceId?: string, resolution?: Resolution): Promise<MediaStream>;
    /**
     * Internal start method
     */
    private _start;
    /**
     * Stops the webcam
     */
    stop(): Promise<void>;
    /**
     * Internal stop method
     */
    private _stop;
    /**
     * Attaches the webcam stream to a video element
     * @param videoElement The video element to attach to
     */
    attachToVideo(videoElement: HTMLVideoElement): void;
    /**
     * Detaches the webcam stream from the video element
     */
    detachFromVideo(): void;
    /**
     * Gets the current webcam state
     */
    getState(): WebcamState;
    /**
     * Gets the current stream
     */
    getStream(): MediaStream | null;
    /**
     * Gets the list of available devices
     */
    getDevices(): Promise<DeviceInfo[]>;
    /**
     * Gets the current device ID
     */
    getCurrentDeviceId(): string | null;
    /**
     * Gets the current resolution
     */
    getCurrentResolution(): Resolution | null;
    /**
     * Gets the supported resolutions for the current device
     * Note: This is an approximation as browsers don't provide a direct way to query this
     */
    getSupportedResolutions(): Promise<Resolution[]>;
    /**
     * Takes a snapshot from the current stream
     * @param format Image format (default: 'image/png')
     * @param quality Image quality for JPEG (0-1)
     */
    takeSnapshot(format?: string, quality?: number): string | null;
    /**
     * Changes the current device
     * @param deviceId The ID of the device to switch to
     */
    switchDevice(deviceId: string): Promise<MediaStream>;
    /**
     * Changes the current resolution
     * @param resolution The new resolution to use
     */
    changeResolution(resolution: Resolution): Promise<MediaStream>;
    /**
     * Sets the webcam state and emits a state change event
     * @param state The new state
     */
    private setState;
    /**
     * Adds an event listener
     * @param event The event type
     * @param listener The event listener
     */
    on<T extends WebcamEventType>(event: T, listener: WebcamEventListener<WebcamEventMap[T]>): void;
    /**
     * Removes an event listener
     * @param event The event type
     * @param listener The event listener to remove
     */
    off<T extends WebcamEventType>(event: T, listener: WebcamEventListener<WebcamEventMap[T]>): void;
    /**
     * Emits an event
     * @param event The event type
     * @param data The event data
     */
    private emit;
    /**
     * Cleans up resources when the webcam is no longer needed
     */
    dispose(): void;
}

/**
 * Error codes for the webcam library
 */
declare enum WebcamErrorCode {
    PERMISSION_DENIED = "PERMISSION_DENIED",
    DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND",
    RESOLUTION_UNSUPPORTED = "RESOLUTION_UNSUPPORTED",
    DEVICE_IN_USE = "DEVICE_IN_USE",
    INITIALIZATION_ERROR = "INITIALIZATION_ERROR",
    STREAM_ERROR = "STREAM_ERROR",
    INVALID_STATE = "INVALID_STATE",
    CONCURRENT_OPERATION = "CONCURRENT_OPERATION",
    NOT_SUPPORTED = "NOT_SUPPORTED",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
/**
 * Custom error class for webcam-related errors
 */
declare class WebcamError extends Error {
    code: WebcamErrorCode;
    originalError?: Error;
    constructor(code: WebcamErrorCode, message: string, originalError?: Error);
}
/**
 * Helper function to create webcam errors
 */
declare function createWebcamError(code: WebcamErrorCode, message: string, originalError?: Error): WebcamError;

export { CommonResolutions, type DeviceInfo, type Resolution, Webcam, WebcamError, WebcamErrorCode, type WebcamEventListener, type WebcamEventMap, WebcamEventType, type WebcamOptions, WebcamState, createWebcamError };
