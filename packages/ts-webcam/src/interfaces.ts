import { PermissionStatus, WebcamStatus, DeviceOrientation } from './types';
import { WebcamError } from './errors';

// ===== Resolution Interfaces =====

/**
 * Represents a specific webcam resolution configuration
 */
export interface Resolution {
    /** Unique identifier for the resolution (typically "widthxheight") */
    id: string;

    /** Human-readable label for the resolution */
    label: string;

    /** Width in pixels */
    width: number;

    /** Height in pixels */
    height: number;
}

// ===== Configuration Interfaces =====

/**
 * Configuration options for initializing a webcam
 */
export interface WebcamConfiguration {
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
    autoSwapResolutionOnMobile?: boolean;

    /** Enable debug mode to show console.log messages */
    debug?: boolean;

    /** Callback when webcam starts successfully */
    onStart?: () => void;

    /** Callback when an error occurs */
    onError?: (error: WebcamError) => void;
}

// ===== State Interfaces =====

/**
 * Comprehensive state interface for managing webcam functionality
 */
export interface WebcamState {
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

// ===== Capability Interfaces =====

/**
 * Interface for managing and checking webcam hardware capabilities
 */
export interface WebcamCapabilities {
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
export interface DeviceCapabilities {
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

// ===== Media API Extensions =====

/**
 * Extended MediaTrackCapabilities with additional webcam-specific capabilities
 * Extends the standard MediaTrackCapabilities with properties specific to webcams
 */
export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
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
export interface ExtendedMediaTrackSettings extends MediaTrackSettings {
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
export interface ExtendedMediaTrackConstraintSet
    extends MediaTrackConstraintSet {
    /** Desired zoom level */
    zoom?: number;

    /** Desired torch/flashlight state */
    torch?: boolean;

    /** Desired focus mode */
    focusMode?: string;
}
