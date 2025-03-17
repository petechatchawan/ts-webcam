/**
 * Custom error class for webcam-related errors
 */
export class WebcamError extends Error {
    constructor(type, message, originalError) {
        super(message);
        this.type = type;
        this.originalError = originalError;
        this.name = 'WebcamError';
    }
}
