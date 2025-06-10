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

// Error interface
export interface WebcamError extends Error {
  code: string;
  originalError?: Error;
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
