import { WebcamErrorCode } from "./types";

/**
 * Custom error class for webcam-related errors
 * Provides standardized error codes and detailed error information
 */
export class WebcamError extends Error {
	/**
	 * The standardized error code identifying the type of error
	 */
	public readonly code: WebcamErrorCode;

	/**
	 * The original error that caused this WebcamError, if any
	 */
	public readonly originalError?: Error;

	/**
	 * Creates a new WebcamError
	 *
	 * @param code - Standardized error code
	 * @param message - Human-readable error message
	 * @param originalError - Original error that caused this error (optional)
	 */
	constructor(code: WebcamErrorCode, message: string, originalError?: Error) {
		// Enhance message with error code for better debugging
		const enhancedMessage = `[${code}] ${message}`;
		super(enhancedMessage);

		this.name = "WebcamError";
		this.code = code;
		this.originalError = originalError;

		// Capture stack trace for better debugging
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, WebcamError);
		}
	}

	/**
	 * Returns a string representation of the error including code and original error
	 */
	public toString(): string {
		let result = `${this.name}: ${this.message}`;
		if (this.originalError) {
			result += `\nCaused by: ${this.originalError.toString()}`;
		}
		return result;
	}
}
