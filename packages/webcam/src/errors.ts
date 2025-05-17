import { WebcamErrorType } from "./types";

/**
 * Custom error class for webcam-related errors
 */
export class WebcamError extends Error {
	constructor(
		public type: WebcamErrorType,
		message: string,
		public originalError?: Error,
	) {
		super(message);
		this.name = "WebcamError";
	}
}
