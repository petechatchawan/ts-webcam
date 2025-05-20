// ===== Permission Types =====

/**
 * Represents the permission state for device access
 * - 'granted': Permission has been granted
 * - 'denied': Permission has been denied
 * - 'prompt': Permission has not been requested yet
 */
export type PermissionStatus = "granted" | "denied" | "prompt";

// ===== Error Types =====

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
export type WebcamErrorCode =
	| "PERMISSION_DENIED"
	| "PERMISSION_PROMPT_BLOCKED"
	| "DEVICE_NOT_FOUND"
	| "RESOLUTION_UNSUPPORTED"
	| "STREAM_ERROR"
	| "NOT_INITIALIZED"
	| "UNKNOWN_ERROR";

// ===== Device Types =====

/**
 * Represents the possible device orientations
 *
 * - 'portrait-primary': Device is in portrait mode (normal)
 * - 'portrait-secondary': Device is in portrait mode (upside down)
 * - 'landscape-primary': Device is in landscape mode (normal)
 * - 'landscape-secondary': Device is in landscape mode (upside down)
 * - 'unknown': Device orientation could not be determined
 */
export type DeviceOrientation =
	| "portrait-primary"
	| "portrait-secondary"
	| "landscape-primary"
	| "landscape-secondary"
	| "unknown";

// ===== Status Types =====

/**
 * Enum representing the possible states of a webcam
 *
 * - IDLE: Webcam is not active
 * - INITIALIZING: Webcam is in the process of starting
 * - READY: Webcam is active and ready to use
 * - ERROR: An error occurred while using the webcam
 */
export enum WebcamStatus {
	/** Webcam is not active */
	IDLE = "idle",

	/** Webcam is in the process of starting */
	INITIALIZING = "initializing",

	/** Webcam is active and ready to use */
	READY = "ready",

	/** An error occurred while using the webcam */
	ERROR = "error",
}
