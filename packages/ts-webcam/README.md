# ts-webcam (v1.5.0)

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

## Demo

Try out the live demo [here](https://ts-webcam.web.app)

View the demo project source code [here](https://github.com/petechatchawan/ts-webcam.git)

## What's New in v1.5.0

- Improved permission management for webcam and microphone
- Enhanced error handling with specific error codes
- Better device change tracking
- Support for advanced webcam controls (zoom, torch, focus)
- Improved resolution handling with auto-swap resolution support for mobile devices
- Comprehensive TypeScript interfaces for better type safety

## Features

- Type-safe configuration with TypeScript interfaces
- Support for multiple resolution options with automatic fallback
- Mirror and auto-swap resolution capabilities for mobile devices
- Customizable video element integration
- Event callbacks for start and error handling
- Permission management for webcam and microphone
- Advanced webcam capabilities (zoom, torch, focus mode)
- Device change tracking
- Comprehensive error handling with error codes
- Detailed status tracking

## Installation

```bash
npm install ts-webcam
```

Or using yarn:

```bash
yarn add ts-webcam
```

Or using pnpm:

```bash
pnpm add ts-webcam
```

## Usage

### Basic Example

Here's how to use ts-webcam in your project:

```typescript
import { Webcam, WebcamError } from "ts-webcam";

// Create Webcam instance
const webcam = new Webcam();

// Get available video devices
const videoDevices = await webcam.getVideoDevices();
const selectedDevice = videoDevices[0]; // or let user select
```

#### Configuration Options

There are three ways to configure the webcam:

##### Option 1: Auto Resolution

Let the webcam use its supported resolution:

```typescript
webcam.setupConfiguration({
  deviceInfo: selectedDevice,
  videoElement: document.getElementById("preview") as HTMLVideoElement,
  onStart: () => console.log("Webcam started"),
  onError: (error: WebcamError) => {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  },
});
```

##### Option 2: Single Resolution

Specify a single preferred resolution:

```typescript
webcam.setupConfiguration({
  deviceInfo: selectedDevice,
  preferredResolutions: webcam.createResolution('1080p-Landscape', 1920, 1080),
  videoElement: document.getElementById("preview") as HTMLVideoElement,
  onStart: () => console.log("Webcam started"),
  onError: (error: WebcamError) => {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  },
});
```

##### Option 3: Multiple Resolutions

Specify multiple resolutions in priority order:

```typescript
webcam.setupConfiguration({
  deviceInfo: selectedDevice,
  preferredResolutions: [
    webcam.createResolution('1080p-Landscape', 1920, 1080),
    webcam.createResolution('720p-Landscape', 1280, 720),
    webcam.createResolution('480p-Landscape', 480, 360),
  ],
  videoElement: document.getElementById("preview") as HTMLVideoElement,
  onStart: () => console.log("Webcam started"),
  onError: (error: WebcamError) => {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  },
});
```

#### Starting the Webcam

After configuration, start the webcam with error handling:

```typescript
try {
  await webcam.start();
} catch (error) {
  if (error instanceof WebcamError) {
    switch (error.code) {
      case "PERMISSION_DENIED":
        console.log("Please allow webcam access");
        break;
      case "DEVICE_NOT_FOUND":
        console.log("No webcam device found");
        break;
      case "DEVICE_IN_USE":
        console.log("Webcam is in use by another application");
        break;
      default:
        console.log("Error:", error.message);
    }
  }
}
```

### Permission Management

Permission management for webcam and microphone consists of 4 main parts:

1. Check permission status:

```typescript
// Check if permission request is needed
const isNeeded = webcam.needsPermissionRequest();
// Output example: { camera: true, microphone: true }

// Check camera permission status
const cameraStatus = await webcam.checkCameraPermission();
console.log("Camera permission status:", cameraStatus);
// Output example: 'granted' | 'denied' | 'prompt'

// Check microphone permission status
const micStatus = await webcam.checkMicrophonePermission();
console.log("Microphone permission status:", micStatus);
// Output example: 'granted' | 'denied' | 'prompt'

// Get all current permissions
const permissionStates = webcam.getPermissionStates();
console.log("Current permissions:", permissionStates);
// Output example: { camera: 'granted', microphone: 'granted' }
```

2. Request permissions:

```typescript
try {
  // Check if permission request is needed
  const isNeeded = webcam.needsPermissionRequest();
  // Output example: { camera: true, microphone: true }
  if (isNeeded.camera || isNeeded.microphone) {
    const permissions = await webcam.requestPermissions();
    console.log("Permissions:", permissions);
    // To use audio, set audioEnabled: true in your configuration
    // Output example: { camera: 'granted', microphone: 'granted' }

    if (permissions.camera === "granted") {
      console.log("Camera permission granted");
    }

    if (permissions.microphone === "granted") {
      console.log("Microphone permission granted");
    }
  }
} catch (error) {
  if (error instanceof WebcamError) {
    switch (error.code) {
      case "PERMISSION_DENIED":
        console.log("User denied camera access");
        break;
      case "MICROPHONE_PERMISSION_DENIED":
        console.log("User denied microphone access");
        break;
    }
  }
}
```
3. Check permission denial status:

```typescript
// Check if permissions were denied
if (webcam.hasPermissionDenied()) {
  console.log("Please enable permissions in browser settings");
}
```

4. Error handling:

```typescript
webcam.setupConfiguration({
  // ...
  onError: (error: WebcamError) => {
    switch (error.code) {
      case "PERMISSION_DENIED":
        console.log("Please allow camera access");
        break;
      case "MICROPHONE_PERMISSION_DENIED":
        console.log("Please allow microphone access");
        break;
      case "PERMISSIONS_API_NOT_SUPPORTED":
        console.log("Browser does not support Permissions API");
        break;
    }
  },
});
```

#### Notes:

- The `permissionStates` property in state stores the current permission status for both camera and microphone
- `getPermissionStates()` retrieves current permission status
- `needsPermissionRequest()` checks if permissions need to be requested
- `hasPermissionDenied()` checks if permissions were denied
- Permission states have 3 types:
    - `granted`: Permission has been granted
    - `denied`: Permission has been denied
    - `prompt`: Permission has not been requested or needs to be requested again

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

    - `PERMISSIONS_API_NOT_SUPPORTED`: Browser does not support the Permissions API
    - `PERMISSION_DENIED`: User denied webcam access
    - `MICROPHONE_PERMISSION_DENIED`: User denied microphone access

2. Device and configuration errors:

    - `NOT_INITIALIZED`: Webcam is not properly initialized
    - `DEVICE_NOT_FOUND`: No webcam device found
    - `MEDIA_DEVICES_NOT_SUPPORTED`: Browser does not support media devices
    - `INVALID_DEVICE_ID`: Invalid device ID provided
    - `RESOLUTION_NOT_SPECIFIED`: No resolutions specified

3. Webcam initialization and operation errors:

    - `STREAM_ERROR`: General stream error (failed to start, initialize, or access stream)
    - `NO_STREAM`: No video stream available
    - `SETTINGS_ERROR`: Failed to apply webcam settings
    - `STOP_ERROR`: Failed to stop the webcam
    - `DEVICE_IN_USE`: Webcam is already in use by another application

4. Webcam functionality errors:
    - `ZOOM_NOT_SUPPORTED`: Zoom is not supported
    - `TORCH_NOT_SUPPORTED`: Torch is not supported
    - `FOCUS_NOT_SUPPORTED`: Focus mode is not supported
    - `DEVICE_LIST_ERROR`: Failed to get device list

### Device Management

Device management in ts-webcam involves the following steps:

1. Get available devices:

```typescript
// Get video devices
const videoDevices = await webcam.getVideoDevices();
const audioInputDevices = await webcam.getAudioInputDevices();
const audioOutputDevices = await webcam.getAudioOutputDevices();

// Get all devices
const allDevices = await webcam.getAllDevices();

// Get current active device
const currentDevice = webcam.getCurrentDevice();

// Refresh device list if needed
await webcam.refreshDevices();
```

2. Track device changes:

```typescript
// Start tracking changes
webcam.setupChangeListeners();

// Stop tracking when no longer needed
webcam.stopChangeListeners();
```

**Notes:**

- Device list will have complete information (e.g., labels) only after permissions are granted
- `setupChangeListeners()` will automatically call `refreshDevices()` on initialization
- When devices change, the system will automatically call `refreshDevices()`
- If the currently active device is removed, the system will stop and send an error
Complete usage example:

```typescript
const webcam = new Webcam();

async function initializeWebcam() {
    try {
        // 1. Request permissions
        const permissions = await webcam.requestPermissions();
        if (permissions.camera === 'granted') {
            // 2. Get device list
            const webcams = await webcam.getVideoDevices();

            if (webcams.length > 0) {
                // 3. Setup webcam configuration
                webcam.setupConfiguration({
                    deviceInfo: webcams[0],
                    // ... other config options
                });

                // 4. Setup device change tracking
                webcam.setupChangeListeners();

                // 5. Start the webcam
                await webcam.start();
            }
        }
    } catch (error) {
        console.error('Error initializing webcam:', error);
    }
}

// Start initialization
initializeWebcam();
```

### Advanced Webcam Controls

```typescript
// Get webcam capabilities
const capabilities = webcam.getCurrentDeviceCapabilities();

// Zoom control
if (webcam.isZoomSupported()) {
  try {
    await webcam.setZoomLevel(2.0); // 2x zoom
  } catch (error) {
    if (error instanceof WebcamError && error.code === "ZOOM_NOT_SUPPORTED") {
      console.log("Zoom is not supported on this device");
    }
  }
}

// Torch control
if (webcam.isTorchSupported()) {
  try {
    await webcam.enableTorch(true);
  } catch (error) {
    if (error instanceof WebcamError && error.code === "TORCH_NOT_SUPPORTED") {
      console.log("Torch is not supported on this device");
    }
  }
}

// Focus mode control
if (webcam.isFocusSupported()) {
  try {
    await webcam.setFocusMode("continuous");
  } catch (error) {
    if (error instanceof WebcamError && error.code === "FOCUS_NOT_SUPPORTED") {
      console.log("Focus mode is not supported on this device");
    }
  }
}

// Mirror mode toggle
webcam.toggleMirror(); // Toggle mirror mode

// Check mirror status
const isMirrored = webcam.isMirrorEnabled();
console.log(`Mirror mode is ${isMirrored ? 'enabled' : 'disabled'}`);

// Toggle audio
webcam.toggleSetting('enableAudio');
// Get current audio status
const isAudioEnabled = webcam.isAudioEnabled();
console.log(`Audio is ${isAudioEnabled ? 'enabled' : 'disabled'}`);

// Toggle allow fallback resolution
webcam.toggleSetting('allowFallbackResolution');
// Get current allow fallback resolution status
const isAllowFallbackResolution = webcam.isFallbackResolutionAllowed();
console.log(`Allow fallback resolution is ${isAllowFallbackResolution ? 'enabled' : 'disabled'}`);

// Toggle auto swap resolution on mobile
webcam.toggleSetting('autoSwapResolutionOnMobile');
// Get current auto swap resolution status
const isAutoSwapResolutionOnMobile = webcam.isResolutionSwapAllowed();
console.log(`Auto swap resolution on mobile is ${isAutoSwapResolutionOnMobile ? 'enabled' : 'disabled'}`);
```

### Status Tracking

```typescript
// Get current status
const status = webcam.getStatus(); // Returns: 'idle' | 'initializing' | 'ready' | 'error'

// Get current state
const state = webcam.getState();
console.log("Current status:", state.status);
console.log("Current capabilities:", state.deviceCapabilities);
console.log("Last error:", state.lastError);

// Get current resolution
const resolution = webcam.getCurrentResolution();
if (resolution) {
  console.log(`Current resolution: ${resolution.width}x${resolution.height}`);
}
```
### Capture Image

```typescript
// Capture image with options
const image = webcam.captureImage({
  scale: 1.0,           // Scale factor for the output image
  mediaType: 'image/jpeg', // 'image/png' or 'image/jpeg'
  quality: 0.8          // Image quality (0.0 - 1.0), applies to JPEG only
});

// Output example:
// 'data:image/jpeg;base64,...',
```

### Device Capabilities and Resolution Support

The library provides methods to check device capabilities and supported resolutions:

```typescript
// Check device capabilities
const deviceId = "your-device-id"; // Use the deviceId from getVideoDevices()
const capabilities = await webcam.getDeviceCapabilities(deviceId);
console.log("Device capabilities:", capabilities);
/* Output example:
{
    deviceId: "device-id-string",
    maxWidth: 1280,
    maxHeight: 720,
    minWidth: 1,
    minHeight: 1,
    hasZoom: true,
    hasTorch: false,
    hasFocus: true,
    maxZoom: 10,
    minZoom: 1,
    supportedFocusModes: ["continuous", "manual"]
    supportedFrameRates: [...],
}
*/

// Check if specific resolutions are supported
const desiredResolutions = [
    { name: "4K", width: 3840, height: 2160 },
    { name: "HD", width: 1280, height: 720 },
    { name: "VGA", width: 640, height: 480 }
];

const supportInfo = webcam.checkSupportedResolutions([capabilities], desiredResolutions);
console.log("Support info:", supportInfo);
/* Output example:
{
    resolutions: [
        { name: "4K", width: 3840, height: 2160, aspectRatio: 1.778, supported: false },
        { name: "HD", width: 1280, height: 720, aspectRatio: 1.778, supported: true },
        { name: "VGA", width: 640, height: 480, aspectRatio: 1.333, supported: true }
    ],
    deviceInfo: {
        deviceId: "device-id-string",
        maxWidth: 1280,
        maxHeight: 720,
        minWidth: 1,
        minHeight: 1
    }
}
*/
```

**Notes:**

- A resolution is considered supported if both its width and height are:
    - Less than or equal to the device's maximum width/height
    - Greater than or equal to the device's minimum width/height
- The aspect ratio is calculated automatically if not provided
- The device info includes the maximum and minimum dimensions supported by the device

## System Requirements

- Modern browser with MediaDevices API support (Chrome, Firefox, Edge, Safari)
- TypeScript (if using in a TypeScript project)

## Browser Compatibility

The library uses the MediaDevices API which has broad support across modern browsers. Here's the detailed compatibility breakdown:

### Desktop Browsers

- Chrome: 47+
- Edge: 12+
- Firefox: 44+
- Safari: 11+
- Opera: 34+

### Mobile Browsers

- Chrome for Android: 47+
- Firefox for Android: 44+
- Safari on iOS: 11+
- Samsung Internet: 5.0+

For the most up-to-date browser compatibility information, please refer to [MDN's MediaDevices compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices#browser_compatibility).

## License

MIT License

## Support

If you encounter any issues or would like to request new features, please create an issue at our [GitHub repository](https://github.com/petechatchawan/ts-webcam)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### v1.5.0
- Added comprehensive permission management
- Improved error handling with specific error codes
- Enhanced device change tracking
- Added support for advanced webcam controls
- Improved TypeScript interfaces and naming conventions
- Improved resolution handling with auto-swap resolution support
- Updated documentation

### v0.1.0
- Initial release
