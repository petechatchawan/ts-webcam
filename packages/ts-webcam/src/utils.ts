import { UAInfo } from "ua-info";
import { WebcamError } from "./errors";
import { Resolution } from "./interfaces";

// ===== Resolution Management =====

/**
 * Creates a new Resolution object with standardized ID format
 *
 * @param name - Display name for the resolution
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @returns A Resolution object with id, label, width, and height
 */
export function createResolution(name: string, width: number, height: number): Resolution {
	const resolutionKey = `${width}x${height}`;
	return {
		id: resolutionKey,
		label: name,
		width,
		height,
	};
}

/**
 * Builds MediaStreamConstraints for getUserMedia based on resolution
 *
 * @param deviceId - Camera device ID
 * @param resolution - Desired resolution
 * @param allowAutoRotateResolution - Whether to swap width/height for mobile devices
 * @param audioEnabled - Whether to enable audio capture
 * @returns MediaStreamConstraints object for getUserMedia
 */
export function buildMediaConstraints(
	deviceId: string,
	resolution: Resolution,
	allowAutoRotateResolution: boolean,
	audioEnabled: boolean,
): MediaStreamConstraints {
	const videoConstraints: MediaTrackConstraints = {
		deviceId: { exact: deviceId },
	};

	// If resolution swap is allowed (for mobile devices), swap width and height
	if (allowAutoRotateResolution) {
		videoConstraints.width = { exact: resolution.height };
		videoConstraints.height = { exact: resolution.width };
	} else {
		videoConstraints.width = { exact: resolution.width };
		videoConstraints.height = { exact: resolution.height };
	}

	return {
		video: videoConstraints,
		audio: audioEnabled,
	};
}

// ===== Permission Management =====

/**
 * Validates camera and microphone permissions
 * Throws appropriate errors if permissions are denied
 *
 * @param permissions - Current permission states
 * @param audioEnabled - Whether audio is enabled
 * @throws WebcamError if permissions are denied
 */
export function validatePermissions(
	permissions: { camera: PermissionState; microphone: PermissionState },
	audioEnabled: boolean,
): void {
	if (permissions.camera === "denied") {
		throw new WebcamError(
			"PERMISSION_DENIED",
			"Camera access is denied. Please allow camera access in your browser settings.",
		);
	}
	if (audioEnabled && permissions.microphone === "denied") {
		throw new WebcamError(
			"PERMISSION_DENIED",
			"Microphone access is denied. Please allow microphone access in your browser settings.",
		);
	}
}

// ===== Stream Management =====

/**
 * Safely stops a media stream and cleans up resources
 *
 * @param stream - MediaStream to stop
 * @param previewElement - Video element to clear
 */
export function stopMediaStream(stream: MediaStream | null, previewElement?: HTMLVideoElement): void {
	if (stream) {
		stream.getTracks().forEach((track) => track.stop());
	}

	if (previewElement) {
		previewElement.srcObject = null;
	}
}

// ===== Device Detection =====

/**
 * Detects if the device is mobile or tablet and should auto-swap resolution
 * Uses multiple detection methods for better accuracy
 *
 * @returns true if resolution should be swapped (mobile/tablet in portrait)
 */
export function shouldAutoSwapResolution(): boolean {
	const uaInfo = new UAInfo();
	uaInfo.setUserAgent(navigator.userAgent);

	// Use UAInfo library for primary detection
	const isMobile = uaInfo.isMobile();
	const isTablet = uaInfo.isTablet();

	// Fallback detection methods
	const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

	// Mobile detection regex
	const mobileRegex =
		/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;

	// Tablet detection regex
	const tabletRegex = /android|ipad|playbook|silk/i;

	// Check if screen orientation is available (typically mobile/tablet devices)
	const hasOrientation = typeof window.orientation !== "undefined";

	// Check screen size (most tablets are less than 1200px wide)
	const isSmallScreen = window.innerWidth <= 1024;

	return (
		isMobile ||
		isTablet ||
		mobileRegex.test(userAgent) ||
		tabletRegex.test(userAgent) ||
		(hasOrientation && isSmallScreen)
	);
}
