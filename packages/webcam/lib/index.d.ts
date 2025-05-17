import { UAInfo } from "ua-info";

/**
 * Represents the permission state for device access
 */
type PermissionStatus = "granted" | "denied" | "prompt";
/**
 * Comprehensive list of possible error types that can occur during webcam operations
 * Categorized by error source: permissions, device, initialization, functionality, etc.
 */
type WebcamErrorType =
	| "no-permissions-api"
	| "permission-denied"
	| "microphone-permission-denied"
	| "configuration-error"
	| "no-device"
	| "no-media-devices-support"
	| "invalid-device-id"
	| "no-resolutions"
	| "webcam-start-error"
	| "webcam-initialization-error"
	| "no-stream"
	| "webcam-settings-error"
	| "webcam-stop-error"
	| "webcam-already-in-use"
	| "zoom-not-supported"
	| "torch-not-supported"
	| "focus-not-supported"
	| "device-list-error"
	| "capture-failed"
	| "unknown";
/**
 * Represents the possible device orientations
 */
type DeviceOrientation =
	| "portrait-primary"
	| "portrait-secondary"
	| "landscape-primary"
	| "landscape-secondary"
	| "unknown";
/**
 * Enum representing the possible states of a webcam
 */
declare enum WebcamStatus {
	IDLE = "idle",
	INITIALIZING = "initializing",
	READY = "ready",
	ERROR = "error",
}

/**
 * Custom error class for webcam-related errors
 */
declare class WebcamError extends Error {
	type: WebcamErrorType;
	originalError?: Error | undefined;
	constructor(
		type: WebcamErrorType,
		message: string,
		originalError?: Error | undefined,
	);
}

/**
 * Represents a specific webcam resolution configuration
 */
interface Resolution {
	id: string;
	label: string;
	width: number;
	height: number;
}
/**
 * Configuration options for initializing a webcam
 */
interface WebcamConfiguration {
	device: MediaDeviceInfo;
	previewElement: HTMLVideoElement;
	audioEnabled?: boolean;
	resolution?: Resolution | Resolution[];
	mirrorEnabled?: boolean;
	allowAnyResolution?: boolean;
	allowResolutionSwap?: boolean;
	onStart?: () => void;
	onError?: (error: WebcamError) => void;
	onStop?: () => void;
}
/**
 * Interface for managing and checking webcam hardware capabilities
 */
interface WebcamCapabilities {
	zoomSupported: boolean;
	torchSupported: boolean;
	focusSupported: boolean;
	zoomLevel: number;
	minZoomLevel: number;
	maxZoomLevel: number;
	torchActive: boolean;
	focusActive: boolean;
	currentFocusMode: string;
	supportedFocusModes: string[];
}
/**
 * Comprehensive state interface for managing webcam functionality
 */
interface WebcamState {
	status: WebcamStatus;
	configuration: WebcamConfiguration | null;
	lastError: WebcamError | null;
	captureCanvas?: HTMLCanvasElement;
	availableDevices: MediaDeviceInfo[];
	capabilities: WebcamCapabilities;
	activeStream: MediaStream | null;
	currentOrientation?: DeviceOrientation;
	currentResolution?: Resolution | null;
	permissions: {
		camera: PermissionStatus;
		microphone: PermissionStatus;
	};
}
/**
 * Information about a webcam device's hardware capabilities
 */
interface DeviceCapabilities {
	deviceId: string;
	maxWidth: number;
	maxHeight: number;
	minWidth: number;
	minHeight: number;
	supportedFrameRates: number[];
	zoomSupported: boolean;
	torchSupported: boolean;
	focusSupported: boolean;
	maxZoomLevel?: number;
	minZoomLevel?: number;
	supportedFocusModes?: string[];
}
/**
 * Extended MediaTrackCapabilities with additional webcam-specific capabilities
 */
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
	zoom?: {
		min: number;
		max: number;
		step: number;
	};
	torch?: boolean;
	focusMode?: string[];
	width?: {
		min: number;
		max: number;
		step: number;
	};
	height?: {
		min: number;
		max: number;
		step: number;
	};
	frameRate?: {
		min: number;
		max: number;
		step: number;
	};
}
/**
 * Extended MediaTrackSettings with additional webcam-specific settings
 */
interface ExtendedMediaTrackSettings extends MediaTrackSettings {
	zoom?: number;
	torch?: boolean;
	focusMode?: string;
}
/**
 * Extended MediaTrackConstraintSet with additional webcam-specific constraints
 */
interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
	zoom?: number;
	torch?: boolean;
	focusMode?: string;
}

declare class Webcam {
	private state;
	private deviceChangeListener;
	private orientationChangeListener;
	uaInfo: UAInfo;
	constructor();
	getState(): WebcamState;
	getStatus(): WebcamStatus;
	getCapabilities(): WebcamCapabilities;
	getLastError(): WebcamError | null;
	clearError(): void;
	isActive(): boolean;
	isAudioEnabled(): boolean;
	isMirrorEnabled(): boolean;
	isResolutionSwapAllowed(): boolean;
	isAnyResolutionAllowed(): boolean;
	isZoomSupported(): boolean;
	isTorchSupported(): boolean;
	isFocusSupported(): boolean;
	getZoomLevel(): number;
	getMinZoomLevel(): number;
	getMaxZoomLevel(): number;
	isTorchActive(): boolean;
	isFocusActive(): boolean;
	setupConfiguration(configuration: WebcamConfiguration): void;
	start(): Promise<void>;
	stop(): void;
	previewIsReady(): Promise<boolean>;
	setZoom(zoomLevel: number): Promise<void>;
	setTorch(active: boolean): Promise<void>;
	setFocusMode(mode: string): Promise<void>;
	toggleTorch(): Promise<boolean>;
	toggleMirror(): boolean;
	createResolution(name: string, width: number, height: number): Resolution;
	updateConfiguration(
		configuration: Partial<WebcamConfiguration>,
		options?: {
			restart?: boolean;
		},
	): WebcamConfiguration;
	updateResolution(
		resolution: Resolution | Resolution[],
		options?: {
			restart?: boolean;
		},
	): WebcamConfiguration;
	updateDevice(
		device: MediaDeviceInfo,
		options?: {
			restart?: boolean;
		},
	): WebcamConfiguration;
	toggle(
		setting: "audioEnabled" | "allowResolutionSwap" | "allowAnyResolution",
	): Promise<boolean>;
	getConfiguration(): WebcamConfiguration;
	checkCameraPermission(): Promise<PermissionStatus>;
	checkMicrophonePermission(): Promise<PermissionStatus>;
	requestPermissions(): Promise<{
		camera: PermissionStatus;
		microphone: PermissionStatus;
	}>;
	getCurrentPermissions(): {
		camera: PermissionStatus;
		microphone: PermissionStatus;
	};
	needsPermissionRequest(): boolean;
	hasPermissionDenied(): boolean;
	captureImage(config?: {
		scale?: number;
		mediaType?: "image/png" | "image/jpeg";
		quality?: number;
	}): Promise<string>;
	checkDevicesCapabilitiesData(deviceId: string): Promise<DeviceCapabilities>;
	checkSupportedResolutions(
		deviceCapabilities: DeviceCapabilities[],
		desiredResolutions: Resolution[],
	): {
		resolutions: {
			key: string;
			width: number;
			height: number;
			supported: boolean;
		}[];
		deviceInfo: {
			deviceId: string;
			maxWidth: number;
			maxHeight: number;
			minWidth: number;
			minHeight: number;
		};
	};
	setupChangeListeners(): Promise<void>;
	private getAvailableDevices;
	refreshDevices(): Promise<void>;
	getVideoDevices(): Promise<MediaDeviceInfo[]>;
	getDevices(): Promise<MediaDeviceInfo[]>;
	getAudioInputDevices(): Promise<MediaDeviceInfo[]>;
	getAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
	getCurrentDevice(): MediaDeviceInfo | null;
	getCurrentResolution(): Resolution | null;
	private initializeWebcam;
	private openWebcam;
	private tryResolution;
	private tryAnyResolution;
	private setupPreviewElement;
	private updateCapabilities;
	private checkConfiguration;
	private handleError;
	private stopStream;
	private resetState;
	private requestMediaPermission;
	private stopChangeListeners;
}

export {
	type DeviceCapabilities,
	type DeviceOrientation,
	type ExtendedMediaTrackCapabilities,
	type ExtendedMediaTrackConstraintSet,
	type ExtendedMediaTrackSettings,
	type PermissionStatus,
	type Resolution,
	Webcam,
	type WebcamCapabilities,
	type WebcamConfiguration,
	WebcamError,
	type WebcamErrorType,
	type WebcamState,
	WebcamStatus,
};
