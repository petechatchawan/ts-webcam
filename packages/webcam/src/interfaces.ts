import { PermissionStatus, WebcamStatus, DeviceOrientation } from './types';
import { WebcamError } from './errors';

/**
 * Represents a specific webcam resolution configuration
 */
export interface Resolution {
    id: string;
    label: string;
    width: number;
    height: number;
}

/**
 * Configuration options for initializing a webcam
 */
export interface WebcamConfig {
    device: MediaDeviceInfo;
    previewElement: HTMLVideoElement;
    audioEnabled?: boolean;
    resolution?: Resolution | Resolution[];
    mirrorEnabled?: boolean;
    allowAnyResolution?: boolean;
    allowResolutionSwap?: boolean;
    onStart?: () => void;
    onError?: (error: WebcamError) => void;
}

/**
 * Interface for managing and checking webcam hardware capabilities
 */
export interface WebcamCapabilities {
    zoomSupported: boolean;
    torchSupported: boolean;
    focusSupported: boolean;
    zoomLevel: number;
    minZoomLevel: number;
    maxZoomLevel: number;
    torchActive: boolean;
    focusActive: boolean;
    currentFocusMode: string;
    supportedFocusModes: string[];
}

/**
 * Comprehensive state interface for managing webcam functionality
 */
export interface WebcamState {
    status: WebcamStatus;
    config: WebcamConfig | null;
    lastError: WebcamError | null;
    captureCanvas?: HTMLCanvasElement;
    availableDevices: MediaDeviceInfo[];
    capabilities: WebcamCapabilities;
    activeStream: MediaStream | null;
    currentOrientation?: DeviceOrientation;
    currentResolution?: Resolution | null;
    permissions: {
        camera: PermissionStatus;
        microphone: PermissionStatus;
    };
}

/**
 * Information about a webcam device's hardware capabilities
 */
export interface DeviceCapabilities {
    deviceId: string;
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
    supportedFrameRates: number[];
    zoomSupported: boolean;
    torchSupported: boolean;
    focusSupported: boolean;
    maxZoomLevel?: number;
    minZoomLevel?: number;
    supportedFocusModes?: string[];
}

/**
 * Extended MediaTrackCapabilities with additional webcam-specific capabilities
 */
export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
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

/**
 * Extended MediaTrackSettings with additional webcam-specific settings
 */
export interface ExtendedMediaTrackSettings extends MediaTrackSettings {
    zoom?: number;
    torch?: boolean;
    focusMode?: string;
}

/**
 * Extended MediaTrackConstraintSet with additional webcam-specific constraints
 */
export interface ExtendedMediaTrackConstraintSet
    extends MediaTrackConstraintSet {
    zoom?: number;
    torch?: boolean;
    focusMode?: string;
}
