// Export the main Webcam class
export { Webcam } from './webcam';

// Export error types
export { WebcamError, WebcamErrorCode, createWebcamError } from './errors';

// Export types
export {
  CommonResolutions,
  WebcamState,
  WebcamEventType
} from './types';

export type {
  Resolution,
  DeviceInfo,
  WebcamOptions,
  WebcamEventListener,
  WebcamEventMap,
} from './types';
