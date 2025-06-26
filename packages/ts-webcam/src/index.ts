// Export the simple Webcam class matching npm package API
export { Webcam } from './webcam';

// Export all types for the simple API
export type {
  CaptureOptions,
  DeviceCapability,
  PermissionStates,
  PermissionStatus,
  Resolution,
  ResolutionSupportInfo,
  WebcamConfiguration,
  WebcamError,
  WebcamState,
  WebcamStatus
} from './types';

// Default export for compatibility
export { Webcam as default } from './webcam';
