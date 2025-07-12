# TS-Webcam 2.0.0

A production-grade TypeScript webcam library with modern APIs, flexible permission handling, and comprehensive device support.

## Features

✨ **Modern TypeScript API** - Full type safety and modern ES6+ features
🎥 **Flexible Device Control** - Support for multiple cameras and resolutions
🔐 **Smart Permissions** - Granular permission control for camera and audio
📱 **Cross-Platform** - Works on desktop and mobile browsers
🎛️ **Advanced Controls** - Torch/flash support, device capabilities detection
🔧 **Callback-Based** - Simple callback system for state management
📦 **Modular Design** - Clean, maintainable architecture

## Installation

```bash
npm install ts-webcam
# or
yarn add ts-webcam
# or
pnpm add ts-webcam
```

## Quick Start

```typescript
import { TsWebcam } from "ts-webcam";

const webcam = new TsWebcam();

// Request permissions
await webcam.requestPermissions({ video: true, audio: false });

// Get available devices
const devices = await webcam.getVideoDevices();

// Start camera
const config = {
	deviceInfo: devices[0],
	preferredResolutions: { width: 1280, height: 720 },
	videoElement: document.getElementById("video") as HTMLVideoElement,

	// Optional callback handlers
	onStateChange: (state) => console.log("State changed:", state.status),
	onError: (error) => console.error("Webcam error:", error.message),
	onStreamStart: (stream) => console.log("Stream started:", stream.id),
	onStreamStop: () => console.log("Stream stopped"),
};

await webcam.startCamera(config);

// Capture image
const blob = await webcam.capture();
```

## API Reference

### TsWebcam Class

#### Methods

- `requestPermissions(options: PermissionRequestOptions)` - Request camera/audio permissions
- `getVideoDevices()` - Get available video devices
- `startCamera(config: WebcamConfiguration)` - Start camera with configuration
- `stopCamera()` - Stop camera and release resources
- `capture()` - Capture image as Blob
- `getDeviceCapabilities(deviceId: string)` - Get device capabilities
- `getState()` - Get current webcam state
- `dispose()` - Clean up resources

#### Callbacks

The webcam configuration supports optional callback handlers for various events:

- `onStateChange` - Called when webcam state changes
- `onStreamStart` - Called when camera stream starts
- `onStreamStop` - Called when camera stream stops
- `onError` - Called when an error occurs
- `onPermissionChange` - Called when permission status changes
- `onDeviceChange` - Called when available devices change

### Types

```typescript
interface WebcamConfiguration {
	deviceInfo: MediaDeviceInfo;
	preferredResolutions?: Resolution | Resolution[];
	videoElement?: HTMLVideoElement;
	enableAudio?: boolean;
	enableMirror?: boolean;
	allowAnyResolution?: boolean;
	allowAutoRotateResolution?: boolean;
	debug?: boolean;

	// Callback-based handlers (optional)
	onStateChange?: (state: TsWebcamState) => void;
	onStreamStart?: (stream: MediaStream) => void;
	onStreamStop?: () => void;
	onError?: (error: WebcamError) => void;
	onPermissionChange?: (permissions: Record<string, PermissionState>) => void;
	onDeviceChange?: (devices: MediaDeviceInfo[]) => void;
}

interface TsWebcamState {
	status: "idle" | "initializing" | "ready" | "error";
	activeStream: MediaStream | null;
	permissions: Record<string, PermissionState>;
	videoElement?: HTMLVideoElement;
	deviceInfo?: MediaDeviceInfo;
	error?: WebcamError | null;
}

interface PermissionRequestOptions {
	video?: boolean;
	audio?: boolean;
}
```

## What's New in 2.0.0

### 🔥 Breaking Changes

- **Modular Architecture**: Split into separate modules (types, errors, core)
- **Callback-Based API**: Replaced event system with simple callbacks
- **New State Management**: Unified `TsWebcamState` interface
- **Updated API**: Simplified and more consistent method signatures
- **Enhanced Error Handling**: Comprehensive error types and better error reporting

### ✨ New Features

- **Flexible Permissions**: Granular control over camera and audio permissions
- **State Observability**: Complete state management with reactive updates
- **Device Capabilities**: Advanced device feature detection
- **Torch Support**: Control camera flash/torch when available
- **Better TypeScript**: Improved type definitions and IntelliSense support

### 🛠️ Improvements

- **Performance**: Optimized resource management and cleanup
- **Reliability**: Better error handling and edge case coverage
- **Developer Experience**: Enhanced debugging and logging capabilities
- **Documentation**: Comprehensive examples and API documentation

## Migration from 1.x

### Updated Imports

```typescript
// Before (1.x)
import { TsWebcam } from "ts-webcam/dist/ts-webcam";

// After (2.0)
import { TsWebcam, TsWebcamState } from "ts-webcam";
```

### State Management

```typescript
// Before (1.x)
webcam.on('statusChange', (status) => { ... });
webcam.on('errorChange', (error) => { ... });

// After (2.0)
const config = {
  // ... other config
  onStateChange: (state: TsWebcamState) => {
    console.log('Status:', state.status);
    console.log('Error:', state.error);
    console.log('Permissions:', state.permissions);
  }
};
await webcam.startCamera(config);
```

### Permission Handling

```typescript
// Before (1.x)
await webcam.requestCameraPermission();

// After (2.0)
await webcam.requestPermissions({ video: true, audio: false });
```

## Advanced Examples

### Complete Usage with All Callbacks

```typescript
import { TsWebcam, TsWebcamState, WebcamError } from "ts-webcam";

const webcam = new TsWebcam();

// Request permissions first
await webcam.requestPermissions({ video: true, audio: false });

// Get available devices
const devices = await webcam.getVideoDevices();
console.log("Available cameras:", devices);

// Configure with all callback handlers
const config = {
	deviceInfo: devices[0],
	preferredResolutions: [
		{ name: "HD", width: 1280, height: 720 },
		{ name: "FHD", width: 1920, height: 1080 },
	],
	videoElement: document.getElementById("video") as HTMLVideoElement,
	enableMirror: true,
	debug: true,

	// State management
	onStateChange: (state: TsWebcamState) => {
		console.log(`Status: ${state.status}`);
		if (state.error) {
			console.error("Error:", state.error.message);
		}
	},

	// Stream lifecycle
	onStreamStart: (stream: MediaStream) => {
		console.log("Camera started:", stream.getVideoTracks()[0].label);
	},

	onStreamStop: () => {
		console.log("Camera stopped");
	},

	// Error handling
	onError: (error: WebcamError) => {
		console.error(`Webcam error [${error.code}]:`, error.message);
	},

	// Permission changes
	onPermissionChange: (permissions) => {
		console.log("Permissions changed:", permissions);
	},

	// Device hotplug
	onDeviceChange: (devices) => {
		console.log("Available devices changed:", devices.length);
	},
};

// Start camera
await webcam.startCamera(config);

// Capture image
const captureButton = document.getElementById("capture");
captureButton?.addEventListener("click", async () => {
	try {
		const blob = await webcam.capture();
		const url = URL.createObjectURL(blob);

		const img = document.getElementById("preview") as HTMLImageElement;
		img.src = url;
	} catch (error) {
		console.error("Capture failed:", error);
	}
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
	webcam.dispose();
});
```

### Device Capabilities Testing

```typescript
// Test what a specific camera can do
const deviceId = devices[0].deviceId;
const capabilities = await webcam.getDeviceCapabilities(deviceId);

console.log("Device capabilities:", {
	maxResolution: `${capabilities.maxWidth}x${capabilities.maxHeight}`,
	hasZoom: capabilities.hasZoom,
	hasTorch: capabilities.hasTorch,
	supportedFocusModes: capabilities.supportedFocusModes,
});
```

### Switching Cameras

```typescript
let currentDeviceIndex = 0;

async function switchCamera() {
	// Stop current camera
	webcam.stopCamera();

	// Switch to next device
	currentDeviceIndex = (currentDeviceIndex + 1) % devices.length;

	// Start with new device
	const newConfig = {
		...config,
		deviceInfo: devices[currentDeviceIndex],
	};

	await webcam.startCamera(newConfig);
}
```

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ iOS Safari 11+
- ✅ Chrome for Android 60+

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © TS-Webcam Team

## Demo

Check out our live demo at [https://ts-webcam.web.app](https://ts-webcam.web.app)
