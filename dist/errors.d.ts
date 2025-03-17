import { WebcamErrorType } from './types';
/**
 * Custom error class for webcam-related errors
 */
export declare class WebcamError extends Error {
    type: WebcamErrorType;
    originalError?: Error | undefined;
    constructor(type: WebcamErrorType, message: string, originalError?: Error | undefined);
}
