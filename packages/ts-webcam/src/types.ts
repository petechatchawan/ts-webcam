// Type definitions for ts-webcam
import { WebcamError } from './errors';

export interface Resolution {
  name: string;
  width: number;
  height: number;
}

export type FocusMode = 'manual' | 'single-shot' | 'continuous' | 'auto' | 'none';

export interface DeviceCapability {
  deviceId: string;
  label: string;
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  supportedFrameRates?: number[];
  hasZoom?: boolean;
  hasTorch?: boolean;
  hasFocus?: boolean;
  maxZoom?: number;
  minZoom?: number;
  supportedFocusModes?: FocusMode[];
}

export interface PermissionRequestOptions {
  video?: boolean;
  audio?: boolean;
}

export interface WebcamConfiguration {
  deviceInfo: MediaDeviceInfo;
  preferredResolutions?: Resolution | Resolution[];
  videoElement?: HTMLVideoElement;
  enableAudio?: boolean;
  enableMirror?: boolean;
  allowAnyResolution?: boolean;
  allowAutoRotateResolution?: boolean;
  debug?: boolean;
}

export type TsWebcamStatus = 'idle' | 'initializing' | 'ready' | 'error';

// State interface (internal, not readonly)
export interface TsWebcamStateInternal {
  status: TsWebcamStatus;
  activeStream: MediaStream | null;
  permissions: Record<string, PermissionState>;
  videoElement?: HTMLVideoElement;
  deviceInfo?: MediaDeviceInfo;
  error?: WebcamError | null;
}

// Public state (readonly for outside)
export type TsWebcamState = Readonly<TsWebcamStateInternal>;

// Event types for TsWebcam
export interface TsWebcamEvents {
  'stream:start': MediaStream;
  'stream:stop': void;
  'error': WebcamError;
  'permission:change': PermissionStatus;
  'device:change': MediaDeviceInfo[];
  'device:hotplug': MediaDeviceInfo[];
  'state:change': TsWebcamState;
}
