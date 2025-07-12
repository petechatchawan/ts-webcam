# TS-Webcam API Documentation

## Table of Contents

- [TsWebcam Class](#tswebcam-class)
- [Configuration Interfaces](#configuration-interfaces)
- [State Management](#state-management)
- [Error Handling](#error-handling)
- [Callback Reference](#callback-reference)
- [TypeScript Types](#typescript-types)

## TsWebcam Class

The main class for webcam interaction.

### Constructor

```typescript
const webcam = new TsWebcam();
```

No parameters required. Creates a new instance ready for use.

### Methods

#### `requestPermissions(options: PermissionRequestOptions): Promise<void>`

Request camera and/or audio permissions from the browser.

**Parameters:**

- `options.video` (boolean, optional) - Request video permission (default: true)
- `options.audio` (boolean, optional) - Request audio permission (default: false)

**Example:**

```typescript
// Request only video permission
await webcam.requestPermissions({ video: true, audio: false });

// Request both video and audio
await webcam.requestPermissions({ video: true, audio: true });
```

#### `getVideoDevices(): Promise<MediaDeviceInfo[]>`

Get list of available video input devices.

**Returns:** Array of MediaDeviceInfo objects representing cameras.

**Example:**

```typescript
const devices = await webcam.getVideoDevices();
console.log(
	"Available cameras:",
	devices.map((d) => d.label),
);
```

#### `startCamera(config: WebcamConfiguration): Promise<void>`

Start camera with the specified configuration.

**Parameters:**

- `config` - Complete webcam configuration (see [WebcamConfiguration](#webcamconfiguration))

**Example:**

```typescript
await webcam.startCamera({
	deviceInfo: devices[0],
	videoElement: videoElement,
	onStateChange: (state) => console.log(state.status),
});
```

#### `stopCamera(): void`

Stop the current camera stream and release resources.

**Example:**

```typescript
webcam.stopCamera();
```

#### `capture(): Promise<Blob>`

Capture a still image from the current video stream.

**Returns:** Promise resolving to a Blob containing the image data (JPEG format).

**Throws:** WebcamError if no active stream or capture fails.

**Example:**

```typescript
try {
	const imageBlob = await webcam.capture();
	const url = URL.createObjectURL(imageBlob);
	document.getElementById("preview").src = url;
} catch (error) {
	console.error("Capture failed:", error.message);
}
```

#### `getDeviceCapabilities(deviceId: string): Promise<DeviceCapability>`

Get detailed capabilities of a specific camera device.

**Parameters:**

- `deviceId` - The deviceId from MediaDeviceInfo

**Returns:** Promise resolving to DeviceCapability object.

**Example:**

```typescript
const capabilities = await webcam.getDeviceCapabilities(device.deviceId);
console.log("Max resolution:", capabilities.maxWidth, "x", capabilities.maxHeight);
console.log("Has torch:", capabilities.hasTorch);
```

#### `getState(): TsWebcamState`

Get the current state of the webcam.

**Returns:** Current TsWebcamState (readonly).

**Example:**

```typescript
const state = webcam.getState();
console.log("Current status:", state.status);
console.log("Active stream:", state.activeStream?.id);
```

#### `dispose(): void`

Clean up all resources, stop streams, and remove event listeners.

**Example:**

```typescript
// Call when done with webcam
webcam.dispose();

// Or on page unload
window.addEventListener("beforeunload", () => webcam.dispose());
```

## Configuration Interfaces

### WebcamConfiguration

Main configuration object for starting the camera.

```typescript
interface WebcamConfiguration {
	// Required
	deviceInfo: MediaDeviceInfo;

	// Optional basic settings
	preferredResolutions?: Resolution | Resolution[];
	videoElement?: HTMLVideoElement;
	enableAudio?: boolean;
	enableMirror?: boolean;
	allowAnyResolution?: boolean;
	allowAutoRotateResolution?: boolean;
	debug?: boolean;

	// Optional callback handlers
	onStateChange?: (state: TsWebcamState) => void;
	onStreamStart?: (stream: MediaStream) => void;
	onStreamStop?: () => void;
	onError?: (error: WebcamError) => void;
	onPermissionChange?: (permissions: Record<string, PermissionState>) => void;
	onDeviceChange?: (devices: MediaDeviceInfo[]) => void;
}
```

**Required Properties:**

- `deviceInfo` - The camera device to use (from getVideoDevices())

**Optional Properties:**

- `preferredResolutions` - Desired resolution(s) to try
- `videoElement` - HTML video element to attach stream to
- `enableAudio` - Include audio in the stream (default: false)
- `enableMirror` - Mirror the video horizontally (default: false)
- `allowAnyResolution` - Accept any resolution if preferred not available
- `allowAutoRotateResolution` - Allow automatic portrait/landscape switching
- `debug` - Enable debug logging

### Resolution

Defines a video resolution.

```typescript
interface Resolution {
	name: string; // Display name (e.g., "HD", "Full HD")
	width: number; // Width in pixels
	height: number; // Height in pixels
}
```

**Example:**

```typescript
const resolutions = [
	{ name: "HD", width: 1280, height: 720 },
	{ name: "Full HD", width: 1920, height: 1080 },
	{ name: "4K", width: 3840, height: 2160 },
];
```

### PermissionRequestOptions

Options for requesting permissions.

```typescript
interface PermissionRequestOptions {
	video?: boolean; // Request video permission (default: true)
	audio?: boolean; // Request audio permission (default: false)
}
```

### DeviceCapability

Detailed capabilities of a camera device.

```typescript
interface DeviceCapability {
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
```

## State Management

### TsWebcamState

The unified state interface providing read-only access to webcam status.

```typescript
interface TsWebcamState {
	readonly status: TsWebcamStatus;
	readonly activeStream: MediaStream | null;
	readonly permissions: Record<string, PermissionState>;
	readonly videoElement?: HTMLVideoElement;
	readonly deviceInfo?: MediaDeviceInfo;
	readonly error?: WebcamError | null;
}
```

### TsWebcamStatus

Possible status values:

- `'idle'` - Not initialized or stopped
- `'initializing'` - Starting up, requesting permissions
- `'ready'` - Camera active and ready
- `'error'` - Error occurred (check state.error)

## Error Handling

### WebcamError

All webcam errors are instances of WebcamError with specific error codes.

```typescript
class WebcamError extends Error {
	code: WebcamErrorCode;
	message: string;
	originalError?: Error;
}
```

### WebcamErrorCode

```typescript
enum WebcamErrorCode {
	// Permissions
	PERMISSION_DENIED = "PERMISSION_DENIED",

	// Device Issues
	DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND",
	DEVICE_BUSY = "DEVICE_BUSY",
	DEVICES_ERROR = "DEVICES_ERROR",

	// Configuration Issues
	INVALID_CONFIG = "INVALID_CONFIG",
	VIDEO_ELEMENT_NOT_SET = "VIDEO_ELEMENT_NOT_SET",
	INVALID_VIDEO_ELEMENT = "INVALID_VIDEO_ELEMENT",

	// Stream & Resolution Issues
	STREAM_FAILED = "STREAM_FAILED",
	RESOLUTION_NOT_SUPPORTED = "RESOLUTION_NOT_SUPPORTED",

	// Capture Issues
	CAPTURE_FAILED = "CAPTURE_FAILED",
	NO_ACTIVE_STREAM = "NO_ACTIVE_STREAM",

	// Capability Issues
	CAPABILITY_NOT_SUPPORTED = "CAPABILITY_NOT_SUPPORTED",
	CAPABILITY_ERROR = "CAPABILITY_ERROR",

	// General Issues
	BROWSER_NOT_SUPPORTED = "BROWSER_NOT_SUPPORTED",
	INVALID_OPERATION = "INVALID_OPERATION",
}
```

## Callback Reference

### onStateChange

Called whenever the webcam state changes.

```typescript
onStateChange?: (state: TsWebcamState) => void;
```

**Use cases:**

- Update UI based on status
- Handle errors
- Track permission changes

### onStreamStart

Called when camera stream starts successfully.

```typescript
onStreamStart?: (stream: MediaStream) => void;
```

**Use cases:**

- Log stream information
- Set up additional stream processing
- Update UI to show camera is active

### onStreamStop

Called when camera stream stops.

```typescript
onStreamStop?: () => void;
```

**Use cases:**

- Clean up UI
- Log stream stop
- Reset application state

### onError

Called when any error occurs.

```typescript
onError?: (error: WebcamError) => void;
```

**Use cases:**

- Display error messages to user
- Log errors for debugging
- Implement error recovery

### onPermissionChange

Called when browser permission status changes.

```typescript
onPermissionChange?: (permissions: Record<string, PermissionState>) => void;
```

**Use cases:**

- Update permission UI
- Request additional permissions
- Guide user through permission flow

### onDeviceChange

Called when available devices change (hotplug).

```typescript
onDeviceChange?: (devices: MediaDeviceInfo[]) => void;
```

**Use cases:**

- Update device selection UI
- Auto-switch to newly connected cameras
- Handle device disconnection

## TypeScript Types

### FocusMode

```typescript
type FocusMode = "manual" | "single-shot" | "continuous" | "auto" | "none";
```

### PermissionState

Standard browser permission states:

```typescript
type PermissionState = "granted" | "denied" | "prompt";
```

## Complete Example

```typescript
import { TsWebcam, TsWebcamState, WebcamError, Resolution } from "ts-webcam";

class WebcamApp {
	private webcam = new TsWebcam();
	private devices: MediaDeviceInfo[] = [];

	async init() {
		try {
			// Request permissions
			await this.webcam.requestPermissions({ video: true });

			// Get devices
			this.devices = await this.webcam.getVideoDevices();

			// Start with first device
			if (this.devices.length > 0) {
				await this.startCamera(this.devices[0]);
			}
		} catch (error) {
			console.error("Initialization failed:", error);
		}
	}

	async startCamera(device: MediaDeviceInfo) {
		const config = {
			deviceInfo: device,
			videoElement: document.getElementById("video") as HTMLVideoElement,
			preferredResolutions: [
				{ name: "HD", width: 1280, height: 720 },
				{ name: "VGA", width: 640, height: 480 },
			],
			enableMirror: true,

			onStateChange: (state: TsWebcamState) => {
				this.updateUI(state);
			},

			onError: (error: WebcamError) => {
				this.showError(error);
			},

			onStreamStart: (stream: MediaStream) => {
				console.log("Camera started:", stream.id);
			},

			onDeviceChange: (devices: MediaDeviceInfo[]) => {
				this.devices = devices;
				this.updateDeviceList();
			},
		};

		await this.webcam.startCamera(config);
	}

	async capture() {
		try {
			const blob = await this.webcam.capture();
			this.showCapturedImage(blob);
		} catch (error) {
			console.error("Capture failed:", error);
		}
	}

	private updateUI(state: TsWebcamState) {
		// Update UI based on state
	}

	private showError(error: WebcamError) {
		// Display error to user
	}

	private showCapturedImage(blob: Blob) {
		// Display captured image
	}

	private updateDeviceList() {
		// Update device selection UI
	}

	cleanup() {
		this.webcam.dispose();
	}
}
```
