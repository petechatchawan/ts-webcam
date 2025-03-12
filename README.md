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
- Device change tracking
- Comprehensive error handling with error codes
- Detailed status tracking

## Installation

```bash
npm install ts-webcam
```

## Usage

### Basic Example

```typescript
import { Webcam, CameraError } from "ts-webcam";

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
  onError: (error: CameraError) => {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    if (error.originalError) {
      console.error("Original error:", error.originalError);
    }
  },
});

// Start the webcam with error handling
try {
  await webcam.start();
} catch (error) {
  if (error instanceof CameraError) {
    switch (error.code) {
      case "permission-denied":
        console.log("กรุณาอนุญาตให้ใช้งานกล้อง");
        break;
      case "no-device":
        console.log("ไม่พบอุปกรณ์กล้อง");
        break;
      case "camera-already-in-use":
        console.log("กล้องกำลังถูกใช้งานโดยแอพอื่น");
        break;
      default:
        console.log("เกิดข้อผิดพลาด:", error.message);
    }
  }
}
```

### Error Handling

The library provides a comprehensive error handling system with specific error codes:

```typescript
// Get last error
const error = webcam.getLastError();
if (error) {
  console.log("Error code:", error.code);
  console.log("Error message:", error.message);
  if (error.originalError) {
    console.log("Original error:", error.originalError);
  }
}

// Clear error and reset status
webcam.clearError();
```

Error codes are categorized as follows:

1. Permission-related errors:

   - `no-permissions-api`: Browser does not support the Permissions API
   - `permission-denied`: User denied camera access
   - `microphone-permission-denied`: User denied microphone access

2. Device and configuration errors:

   - `configuration-error`: Camera constraints cannot be satisfied
   - `no-device`: No camera device found
   - `no-media-devices-support`: Browser does not support media devices
   - `invalid-device-id`: Invalid device ID provided
   - `no-resolutions`: No resolutions specified

3. Camera initialization and operation errors:

   - `camera-start-error`: Failed to start the camera
   - `camera-initialization-error`: Failed to initialize the camera
   - `no-stream`: No video stream available
   - `camera-settings-error`: Failed to apply camera settings
   - `camera-stop-error`: Failed to stop the camera
   - `camera-already-in-use`: Camera is already in use by another application

4. Camera functionality errors:
   - `zoom-not-supported`: Zoom is not supported
   - `torch-not-supported`: Torch is not supported
   - `focus-not-supported`: Focus mode is not supported
   - `device-list-error`: Failed to get device list

### Device Management

```typescript
// Start tracking device changes
webcam.startDeviceTracking();

// Get current device lists
const allDevices = webcam.getDeviceList();
const videoDevices = webcam.getVideoDevices();
const audioInputDevices = webcam.getAudioInputDevices();
const audioOutputDevices = webcam.getAudioOutputDevices();

// Stop tracking when no longer needed
webcam.stopDeviceTracking();
```

### Permission Management

```typescript
// Check individual permissions
const cameraPermission = await webcam.checkCameraPermission();
const micPermission = await webcam.checkMicrophonePermission();
// Returns: 'granted' | 'denied' | 'prompt'

// Check both permissions at once
const permissions = await webcam.requestPermissions();
console.log("Camera permission:", permissions.camera);
console.log("Microphone permission:", permissions.microphone);
```

### Advanced Camera Controls

```typescript
// Get camera capabilities
const capabilities = webcam.getCapabilities();

// Zoom control
if (capabilities.zoom) {
  try {
    await webcam.setZoom(2.0); // 2x zoom
  } catch (error) {
    if (error instanceof CameraError && error.code === "zoom-not-supported") {
      console.log("Zoom is not supported on this device");
    }
  }
}

// Torch control
if (capabilities.torch) {
  try {
    await webcam.setTorch(true);
  } catch (error) {
    if (error instanceof CameraError && error.code === "torch-not-supported") {
      console.log("Torch is not supported on this device");
    }
  }
}

// Focus mode control
if (capabilities.focusMode) {
  try {
    await webcam.setFocusMode("continuous");
  } catch (error) {
    if (error instanceof CameraError && error.code === "focus-not-supported") {
      console.log("Focus mode is not supported on this device");
    }
  }
}
```

### Status Tracking

```typescript
// Get current status
const status = webcam.getStatus(); // Returns: 'idle' | 'initializing' | 'ready' | 'error'

// Get current state
const state = webcam.getState();
console.log("Current status:", state.status);
console.log("Current capabilities:", state.capabilities);
console.log("Last error:", state.lastError);

// Get current resolution
const resolution = webcam.getCurrentResolution();
if (resolution) {
  console.log(`Current resolution: ${resolution.width}x${resolution.height}`);
}
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

## Best Practices

1. Always check device availability before starting the webcam
2. Handle permission denials gracefully using error codes
3. Provide fallback resolutions for better compatibility
4. Use the `allowAnyResolution` option if exact resolution is not critical
5. Clean up resources by calling `stop()` when the webcam is no longer needed
6. Always handle errors using the provided error codes
7. Check capabilities before using advanced features

## License

MIT License

## Support

If you encounter any issues or would like to request new features, please create an issue at our [GitHub repository](https://github.com/yourusername/ts-webcam)
