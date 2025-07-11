// Type definitions for ts-webcam

import { WebcamError } from "./errors";

export interface Resolution {
	name: string;
	width: number;
	height: number;
}

export type FocusMode = "manual" | "single-shot" | "continuous" | "auto" | "none";

export interface DeviceCapability {
	deviceId: string;
	label: string;
	maxWidth: number;
	maxHeight: number;
	minWidth: number;
	minHeight: number;
	supportedFrameRates?: number[];
	hasZoom?: boolean;
	hasTorch?: boolean;
	hasFocus?: boolean;
	maxZoom?: number;
	minZoom?: number;
	supportedFocusModes?: FocusMode[];
}

export interface PermissionRequestOptions {
	video?: boolean;
	audio?: boolean;
}

export interface WebcamConfiguration {
	deviceInfo: MediaDeviceInfo;
	preferredResolutions?: Resolution | Resolution[];
	videoElement?: HTMLVideoElement;
	enableAudio?: boolean;
	enableMirror?: boolean;
	debug?: boolean;

	// Callback-based handlers (optional)
	onStateChange?: (state: WebcamState) => void;
	onStreamStart?: (stream: MediaStream) => void;
	onStreamStop?: () => void;
	onError?: (error: WebcamError) => void;
	onPermissionChange?: (permissions: Record<string, PermissionState>) => void;
	onDeviceChange?: (devices: MediaDeviceInfo[]) => void;
}

export type WebcamStatus = "idle" | "initializing" | "ready" | "error";

// State interface (internal, not readonly)
export interface WebcamStateInternal {
	status: WebcamStatus;
	activeStream: MediaStream | null;
	permissions: Record<string, PermissionState>;
	videoElement?: HTMLVideoElement;
	deviceInfo?: MediaDeviceInfo;
	error?: WebcamError | null;
}

// Public state (readonly for outside)
export type WebcamState = Readonly<WebcamStateInternal>;
