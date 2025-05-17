/**
 * Error codes for the webcam library
 */
export enum WebcamErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  RESOLUTION_UNSUPPORTED = 'RESOLUTION_UNSUPPORTED',
  DEVICE_IN_USE = 'DEVICE_IN_USE',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  STREAM_ERROR = 'STREAM_ERROR',
  INVALID_STATE = 'INVALID_STATE',
  CONCURRENT_OPERATION = 'CONCURRENT_OPERATION',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for webcam-related errors
 */
export class WebcamError extends Error {
  code: WebcamErrorCode;
  originalError?: Error;

  constructor(code: WebcamErrorCode, message: string, originalError?: Error) {
    super(message);
    this.name = 'WebcamError';
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Helper function to create webcam errors
 */
export function createWebcamError(
  code: WebcamErrorCode,
  message: string,
  originalError?: Error
): WebcamError {
  return new WebcamError(code, message, originalError);
}
