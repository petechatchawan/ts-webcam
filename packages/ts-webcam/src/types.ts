// Core types for the simple API matching npm package exactly

// Permission status type
export type PermissionStatus = 'granted' | 'denied' | 'prompt';

// Webcam status enum
export type WebcamStatus = 'idle' | 'initializing' | 'ready' | 'error';

// Resolution interface
export interface Resolution {
  name: string;
  width: number;
  height: number;
  aspectRatio?: number;
  supported?: boolean;
}

// Device capability interface
export interface DeviceCapability {
  deviceId: string;
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  hasZoom?: boolean;
  hasTorch?: boolean;
  hasFocus?: boolean;
  maxZoom?: number;
  minZoom?: number;
  supportedFocusModes?: string[];
  supportedFrameRates?: number[];
}

// Device info from getUserMedia
export interface DeviceInfo {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
}

// Permission states for camera and microphone
export interface PermissionStates {
  camera: PermissionStatus;
  microphone: PermissionStatus;
}

// Error code enum for all webcam errors
export enum WebcamErrorCode {
  // Permissions
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Device Issues
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  DEVICE_BUSY = 'DEVICE_BUSY',
  DEVICES_ERROR = 'DEVICES_ERROR',

  // Configuration Issues
  INVALID_CONFIG = 'INVALID_CONFIG',
  VIDEO_ELEMENT_NOT_SET = 'VIDEO_ELEMENT_NOT_SET',
  INVALID_VIDEO_ELEMENT = 'INVALID_VIDEO_ELEMENT',

  // Stream & Resolution Issues
  STREAM_FAILED = 'STREAM_FAILED',
  RESOLUTION_NOT_SUPPORTED = 'RESOLUTION_NOT_SUPPORTED',
  RESOLUTION_FAILED = 'RESOLUTION_FAILED',

  // Control Issues (Zoom, Torch, Focus)
  ZOOM_NOT_SUPPORTED = 'ZOOM_NOT_SUPPORTED',
  TORCH_NOT_SUPPORTED = 'TORCH_NOT_SUPPORTED',
  FOCUS_NOT_SUPPORTED = 'FOCUS_NOT_SUPPORTED',
  CONTROL_ERROR = 'CONTROL_ERROR',

  // Capture Issues
  CAPTURE_FAILED = 'CAPTURE_FAILED',
  CANVAS_ERROR = 'CANVAS_ERROR',

  // General
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Custom WebcamError class
export class WebcamError extends Error {
  code: WebcamErrorCode;
  context?: any;
  suggestions?: string[];
  canRetry?: boolean;

  constructor(
    code: WebcamErrorCode,
    message: string,
    context?: any,
    suggestions?: string[],
    canRetry?: boolean
  ) {
    super(message);
    this.name = 'WebcamError';
    this.code = code;
    this.context = context;
    this.suggestions = suggestions;
    this.canRetry = canRetry;
    Object.setPrototypeOf(this, WebcamError.prototype);
  }
}

// Configuration options for setupConfiguration
export interface WebcamConfiguration {
  deviceInfo: DeviceInfo;
  preferredResolutions?: Resolution | Resolution[];
  videoElement?: HTMLVideoElement;
  enableAudio?: boolean;
  enableMirror?: boolean;
  /**
   * If true (default), will allow using any supported resolution if preferredResolutions cannot be used.
   * If false, will only use preferredResolutions and throw if none are available.
   */
  allowAnyResolution?: boolean;
  allowAutoRotateResolution?: boolean;
  debug?: boolean;
  onStart?: () => void;
  onError?: (error: WebcamError) => void;
}

// State interface
export interface WebcamState {
  status: WebcamStatus;
  deviceCapabilities: DeviceCapability | null;
  lastError: WebcamError | null;
  permissionStates: PermissionStates;
}

// Capture options
export interface CaptureOptions {
  scale?: number;
  mediaType?: 'image/jpeg' | 'image/png';
  quality?: number;
}

// Resolution support info
export interface ResolutionSupportInfo {
  resolutions: Resolution[];
  deviceInfo: {
    deviceId: string;
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
  };
}
