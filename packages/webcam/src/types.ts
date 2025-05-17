/**
 * Resolution configuration for the webcam
 */
export interface Resolution {
  width: number;
  height: number;
  aspectRatio?: number;
  frameRate?: number;
}

/**
 * Common resolutions that can be used
 */
export const CommonResolutions = {
  VGA: { width: 640, height: 480 } as Resolution,
  HD: { width: 1280, height: 720 } as Resolution,
  FULL_HD: { width: 1920, height: 1080 } as Resolution,
  QVGA: { width: 320, height: 240 } as Resolution,
  SVGA: { width: 800, height: 600 } as Resolution,
  XGA: { width: 1024, height: 768 } as Resolution,
  UXGA: { width: 1600, height: 1200 } as Resolution,
  QXGA: { width: 2048, height: 1536 } as Resolution,
};

/**
 * Device information
 */
export interface DeviceInfo {
  id: string;
  label: string;
  kind: MediaDeviceKind;
}

/**
 * Webcam configuration options
 */
export interface WebcamOptions {
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
export enum WebcamState {
  IDLE = 'IDLE',
  REQUESTING_PERMISSIONS = 'REQUESTING_PERMISSIONS',
  INITIALIZING = 'INITIALIZING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  STOPPING = 'STOPPING',
}

/**
 * Webcam event types
 */
export enum WebcamEventType {
  STATE_CHANGE = 'STATE_CHANGE',
  ERROR = 'ERROR',
  STREAM_STARTED = 'STREAM_STARTED',
  STREAM_STOPPED = 'STREAM_STOPPED',
  DEVICE_CHANGE = 'DEVICE_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

/**
 * Webcam event listener
 */
export type WebcamEventListener<T = any> = (data: T) => void;

/**
 * Webcam event map
 */
export interface WebcamEventMap {
  [WebcamEventType.STATE_CHANGE]: WebcamState;
  [WebcamEventType.ERROR]: Error;
  [WebcamEventType.STREAM_STARTED]: MediaStream;
  [WebcamEventType.STREAM_STOPPED]: void;
  [WebcamEventType.DEVICE_CHANGE]: DeviceInfo[];
  [WebcamEventType.PERMISSION_CHANGE]: PermissionState;
}
