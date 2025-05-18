/**
 * Represents the permission state for device access
 */
export type PermissionStatus = 'granted' | 'denied' | 'prompt';

/**
 * Standardized error codes for webcam operations
 */
export type WebcamErrorCode =
  | 'PERMISSION_DENIED'
  | 'PERMISSION_PROMPT_BLOCKED'
  | 'DEVICE_NOT_FOUND'
  | 'RESOLUTION_UNSUPPORTED'
  | 'STREAM_ERROR'
  | 'NOT_INITIALIZED'
  | 'UNKNOWN_ERROR';

/**
 * Represents the possible device orientations
 */
export type DeviceOrientation =
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'unknown';

/**
 * Enum representing the possible states of a webcam
 */
export enum WebcamStatus {
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    READY = 'ready',
    ERROR = 'error',
}
