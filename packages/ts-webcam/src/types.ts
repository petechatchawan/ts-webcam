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

export interface ResolutionInfo {
	width: number;
	height: number;
	name: string;
}

export interface WebcamConfiguration {
	deviceInfo?: MediaDeviceInfo;
	preferredResolutions?: Resolution | Resolution[];
	videoElement?: HTMLVideoElement;
	enableAudio?: boolean;
	enableMirror?: boolean;

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
	zoom?: number;
	focusMode?: FocusMode;
	torch?: boolean;
}

// Public state (readonly for outside)
export type WebcamState = Readonly<WebcamStateInternal>;

export interface CaptureOptions {
  /** Image type, e.g., 'image/jpeg' or 'image/png' (default: 'image/jpeg') */
  imageType?: string;
  /** Image quality from 0 to 1 (only applicable for image/jpeg) (default: 0.92) */
  quality?: number;
  /** Scale factor (0.1-2) to resize the captured image (default: 1.0) */
  scale?: number;
  /** Whether to include base64 string in the result (default: true) */
  returnBase64?: boolean;
}

export interface CaptureResult {
  /** Captured image as Blob */
  blob: Blob;
  /** Base64 encoded image data */
  base64: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** MIME type of the image */
  mimeType: string;
  /** Timestamp when the capture was taken */
  timestamp: number;
}
