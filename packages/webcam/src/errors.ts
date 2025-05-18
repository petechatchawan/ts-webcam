import { WebcamErrorCode } from './types';

/**
 * Custom error class for webcam-related errors
 */
export class WebcamError extends Error {
    /**
     * The standardized error code
     */
    public code: WebcamErrorCode;

    constructor(
        code: WebcamErrorCode,
        public message: string,
        public originalError?: Error,
    ) {
        super(message);
        this.name = 'WebcamError';
        this.code = code;
    }
}
