/**
 * Represents the permission state for device access
 */
export type PermissionStatus = 'granted' | 'denied' | 'prompt';
/**
 * Comprehensive list of possible error types that can occur during webcam operations
 * Categorized by error source: permissions, device, initialization, functionality, etc.
 */
export type WebcamErrorType = 'no-permissions-api' | 'permission-denied' | 'microphone-permission-denied' | 'configuration-error' | 'no-device' | 'no-media-devices-support' | 'invalid-device-id' | 'no-resolutions' | 'webcam-start-error' | 'webcam-initialization-error' | 'no-stream' | 'webcam-settings-error' | 'webcam-stop-error' | 'webcam-already-in-use' | 'zoom-not-supported' | 'torch-not-supported' | 'focus-not-supported' | 'device-list-error' | 'unknown';
/**
 * Represents the possible device orientations
 */
export type DeviceOrientation = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'unknown';
/**
 * Enum representing the possible states of a webcam
 */
export declare enum WebcamStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    ERROR = "error"
}
