# ts-webcam

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

## Features

- Type-safe configuration with TypeScript interfaces
- Support for multiple resolution options with automatic fallback
- Mirror and auto-rotation capabilities
- Customizable preview element integration
- Event callbacks for start and error handling
- Permission management for camera and microphone
- Comprehensive set of basic methods

## Installation

```bash
npm install ts-webcam
```

## Usage

### Permission Management

The library provides methods to check and request permissions for camera and microphone access. You can check permissions before setting up the webcam configuration:

```typescript
import { Webcam } from "ts-webcam";

// Create Webcam instance
const webcam = new Webcam();

// Check permissions first
const cameraPermission = await webcam.checkCameraPermission();
const micPermission = await webcam.checkMicrophonePermission();

// Or check both at once
const permissions = await webcam.requestPermissions();
console.log("Camera permission:", permissions.camera);
console.log("Microphone permission:", permissions.microphone);

// If permissions are granted, proceed with setup
if (permissions.camera === "granted") {
  // Get available devices
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((device) => device.kind === "videoinput");
  const selectedDevice = videoDevices[0]; // หรือให้ผู้ใช้เลือก

  // Setup configuration
  webcam.setupConfiguration({
    audio: permissions.microphone === "granted", // Enable audio only if permitted
    device: selectedDevice.deviceId,
    resolutions: [
      { name: "HD", width: 1280, height: 720, aspectRatio: 16 / 9 },
      { name: "VGA", width: 640, height: 480, aspectRatio: 4 / 3 },
    ],
    allowAnyResolution: true,
    mirror: true,
    autoRotation: true,
    previewElement: document.getElementById("preview") as HTMLVideoElement,
    onStart: () => console.log("Webcam started successfully"),
    onError: (error) => console.error("Error:", error),
  });

  // Start the webcam
  await webcam.start();
}
```

You can also check permissions individually:

```typescript
// Check camera permission
const cameraPermission = await webcam.checkCameraPermission();
// Returns: 'granted' | 'denied' | 'prompt'

// Check microphone permission
const micPermission = await webcam.checkMicrophonePermission();
// Returns: 'granted' | 'denied' | 'prompt'

// Check both permissions at once
const permissions = await webcam.requestPermissions();
// Returns: { camera: PermissionState, microphone: PermissionState }
```

### Configuration Interface

```typescript
interface WebcamConfig {
  /** Enable/disable audio */
  audio?: boolean;
  /** Device ID (required) - Get from MediaDevices.enumerateDevices() */
  device: string;
  /** List of preferred resolutions in priority order */
  resolutions: Resolution[];
  /** Allow any resolution if specified ones fail */
  allowAnyResolution?: boolean;
  /** Mirror the video output */
  mirror?: boolean;
  /** Auto-rotate width/height based on device orientation */
  autoRotation?: boolean;
  /** Video element for preview */
  previewElement?: HTMLVideoElement;
  /** Callback when webcam starts successfully */
  onStart?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

interface Resolution {
  name: string; // Resolution name (e.g., "HD", "FHD", "VGA")
  width: number; // Width in pixels
  height: number; // Height in pixels
  aspectRatio?: number; // Optional aspect ratio (e.g., 16/9, 4/3)
}

type PermissionState = "granted" | "denied" | "prompt";
```

### Resolution Handling

The library attempts to open the webcam with resolutions in the specified order:

1. Tries each resolution in the `resolutions` array
2. If all fail and `allowAnyResolution` is true, attempts to open with any supported resolution
3. If all fail and `allowAnyResolution` is false, throws an error

### Additional Methods Example

```typescript
// Check active status
console.log("Is active:", webcam.isActive());

// Get current resolution
const resolution = webcam.getCurrentResolution();
console.log("Resolution:", resolution);
// Output: Resolution: { name: "Current", width: 1280, height: 720, aspectRatio: 1.7777777777777777 }

// Update configuration
webcam.updateConfig({
  mirror: true,
  resolutions: [
    { name: "FHD", width: 1920, height: 1080, aspectRatio: 16 / 9 },
  ],
  allowAnyResolution: true,
});
```

## System Requirements

- Browser with MediaDevices API support (Chrome, Firefox, Edge, Safari)
- TypeScript (if using in a TypeScript project)

## License

MIT License

## Support

If you encounter any issues or would like to request new features, please create an issue at our [GitHub repository](https://github.com/yourusername/ts-webcam)
