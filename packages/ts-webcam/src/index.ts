// Export the simple Webcam class matching npm package API
export { Webcam } from './Webcam';

// Export all types for the simple API
export type {
  WebcamConfiguration,
  WebcamStatus,
  WebcamState,
  DeviceInfo,
  DeviceCapability,
  Resolution,
  PermissionStatus,
  PermissionStates,
  WebcamError,
  CaptureOptions,
  ResolutionSupportInfo
} from './types';

// Default export for compatibility
export { Webcam as default } from './Webcam';
