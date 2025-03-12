# ts-webcam

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

## Features

- Type-safe configuration with TypeScript interfaces
- Support for multiple resolution options with automatic fallback
- Mirror and auto-rotation capabilities
- Customizable preview element integration
- Event callbacks for start and error handling
- Permission management for camera and microphone
- Advanced camera capabilities (zoom, torch, focus mode)
- Device change tracking with callbacks
- Comprehensive status tracking and error handling

## Installation

```bash
npm install ts-webcam
```

## Usage

### Basic Example

```typescript
import { Webcam } from "ts-webcam";

// Create Webcam instance
const webcam = new Webcam();

// Get available video devices
const videoDevices = webcam.getVideoDevices();
const selectedDevice = videoDevices[0]; // หรือให้ผู้ใช้เลือก

// Setup configuration
webcam.setupConfiguration({
  device: selectedDevice.id,
  resolutions: [
    { name: "HD", width: 1280, height: 720, aspectRatio: 16 / 9 },
    { name: "VGA", width: 640, height: 480, aspectRatio: 4 / 3 },
  ],
  allowAnyResolution: true,
  mirror: true,
  autoRotation: true,
  previewElement: document.getElementById("preview") as HTMLVideoElement,
  onStart: () => console.log("Webcam started"),
  onError: (error) => console.error("Error:", error),
});

// Start the webcam
await webcam.start();
```

### Device Management

The library provides methods to track and manage connected devices:

```typescript
// Start tracking device changes
webcam.startDeviceTracking();

// Get current device lists
const allDevices = webcam.getDeviceList();
const videoDevices = webcam.getVideoDevices();
const audioInputDevices = webcam.getAudioInputDevices();
const audioOutputDevices = webcam.getAudioOutputDevices();

// Example: Check for new video devices periodically
setInterval(() => {
  const videoDevices = webcam.getVideoDevices();
  console.log("Current video devices:", videoDevices);
}, 1000);

// Stop tracking when no longer needed
webcam.stopDeviceTracking();
```

### Permission Management

The library provides methods to check and request permissions:

```typescript
// Check individual permissions
const cameraPermission = await webcam.checkCameraPermission();
const micPermission = await webcam.checkMicrophonePermission();
// Returns: 'granted' | 'denied' | 'prompt'

// Check both permissions at once
const permissions = await webcam.requestPermissions();
console.log("Camera permission:", permissions.camera);
console.log("Microphone permission:", permissions.microphone);

// Start webcam only if permissions are granted
if (permissions.camera === "granted") {
  await webcam.start();
}
```

### Advanced Camera Controls

The library supports advanced camera controls when available:

```typescript
// Get camera capabilities
const capabilities = webcam.getCapabilities();

// Zoom control
if (capabilities.zoom) {
  await webcam.setZoom(2.0); // 2x zoom
}

// Torch control
if (capabilities.torch) {
  await webcam.setTorch(true); // Turn on torch
}

// Focus mode control
if (capabilities.focusMode) {
  await webcam.setFocusMode("continuous"); // Set continuous auto-focus
}
```

### Status and Error Handling

```typescript
// Get current status
const status = webcam.getStatus(); // Returns: 'idle' | 'initializing' | 'ready' | 'error'

// Get last error if any
const lastError = webcam.getLastError();

// Get current resolution
const resolution = webcam.getCurrentResolution();
if (resolution) {
  console.log(`Current resolution: ${resolution.width}x${resolution.height}`);
}
```

### Configuration Interface

```typescript
interface WebcamConfig {
  /** Enable/disable audio */
  audio?: boolean;
  /** Device ID (required) */
  device: string;
  /** List of preferred resolutions in priority order */
  resolutions: Resolution[];
  /** Allow any resolution if specified ones fail */
  allowAnyResolution?: boolean;
  /** Mirror the video output */
  mirror?: boolean;
  /** Auto-rotate based on device orientation */
  autoRotation?: boolean;
  /** Video element for preview */
  previewElement?: HTMLVideoElement;
  /** Callback when webcam starts successfully */
  onStart?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface Resolution {
  name: string;
  width: number;
  height: number;
  aspectRatio?: number;
}

interface WebcamCapabilities {
  zoom: boolean;
  torch: boolean;
  focusMode: boolean;
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  torchActive: boolean;
  focusModeActive: boolean;
  currentFocusMode: string;
  supportedFocusModes: string[];
}

interface DeviceInfo {
  id: string;
  label: string;
  kind: "audioinput" | "audiooutput" | "videoinput";
}

type PermissionState = "granted" | "denied" | "prompt";
```

## System Requirements

- Modern browser with MediaDevices API support (Chrome, Firefox, Edge, Safari)
- TypeScript (if using in a TypeScript project)

## Browser Compatibility

The library is compatible with modern browsers that support the MediaDevices API:

- Chrome 47+
- Firefox 44+
- Edge 12+
- Safari 11+
- Chrome for Android 47+
- Safari on iOS 11+

## Error Handling

Common error scenarios and their meanings:

- `NotAllowedError`: User denied permission or the permission was already denied
- `NotFoundError`: No camera device found
- `NotReadableError`: Camera is already in use or hardware error occurred
- `OverconstrainedError`: Requested resolution not supported by the camera
- `TypeError`: Invalid configuration provided

## Best Practices

1. Always check device availability before starting the webcam
2. Handle permission denials gracefully
3. Provide fallback resolutions for better compatibility
4. Use the `allowAnyResolution` option if exact resolution is not critical
5. Clean up resources by calling `stop()` when the webcam is no longer needed

## License

MIT License

## Support

If you encounter any issues or would like to request new features, please create an issue at our [GitHub repository](https://github.com/yourusername/ts-webcam)
