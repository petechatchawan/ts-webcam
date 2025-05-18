# ts-webcam

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

## Demo

Try out the live demo [here](https://ts-webcam-demo.web.app/webcam)

View the demo project source code [here](https://github.com/petechatchawan/ts-webcam-demo.git)

## Features

- Type-safe configuration with TypeScript interfaces
- Support for multiple resolution options with automatic fallback
- Mirror and auto-rotation capabilities
- Customizable preview element integration
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
  device: selectedDevice,
  previewElement: document.getElementById("preview") as HTMLVideoElement,
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
  device: selectedDevice,
  resolution: this.webcam.createResolution('1080p-Landscape', 1920, 1080),
  previewElement: document.getElementById("preview") as HTMLVideoElement,
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
  device: selectedDevice,
  resolution: [
    this.webcam.createResolution('1080p-Landscape', 1920, 1080),
    this.webcam.createResolution('720p-Landscape', 1280, 720),
    this.webcam.createResolution('480p-Landscape', 480, 360),
  ],
  previewElement: document.getElementById("preview") as HTMLVideoElement,
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
      case "permission-denied":
        console.log("Please allow webcam access");
        break;
      case "no-device":
        console.log("No webcam device found");
        break;
      case "webcam-already-in-use":
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
const currentPermissions = webcam.getCurrentPermissions();
console.log("Current permissions:", currentPermissions);
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
    // if use audio please set configuration with audio: true
    // Output example: { camera: 'granted', microphone: 'granted' }

    if (permissions.camera === "granted") {
      console.log("Camera permission granted");
    }

    if (permissions.microphone === "granted") {
      console.log("Microphone permission granted");
    }
  }
} catch (error) {
  if (error instanceof CameraError) {
    switch (error.code) {
      case "permission-denied":
        console.log("User denied camera access");
        break;
      case "microphone-permission-denied":
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
      case "permission-denied":
        console.log("Please allow camera access");
        break;
      case "microphone-permission-denied":
        console.log("Please allow microphone access");
        break;
      case "no-permissions-api":
        console.log("Browser does not support Permissions API");
        break;
    }
  },
});
```

#### Notes:

- `currentPermission` in state stores the current permission status for both camera and microphone
- `getCurrentPermissions()` retrieves current permission status
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

    - `no-permissions-api`: Browser does not support the Permissions API
    - `permission-denied`: User denied webcam access
    - `microphone-permission-denied`: User denied microphone access

2. Device and configuration errors:

    - `configuration-error`: Webcam constraints cannot be satisfied
    - `no-device`: No webcam device found
    - `no-media-devices-support`: Browser does not support media devices
    - `invalid-device-id`: Invalid device ID provided
    - `no-resolutions`: No resolutions specified

3. Webcam initialization and operation errors:

    - `webcam-start-error`: Failed to start the webcam
    - `webcam-initialization-error`: Failed to initialize the webcam
    - `no-stream`: No video stream available
    - `webcam-settings-error`: Failed to apply webcam settings
    - `webcam-stop-error`: Failed to stop the webcam
    - `webcam-already-in-use`: Webcam is already in use by another application

4. Webcam functionality errors:
    - `zoom-not-supported`: Zoom is not supported
    - `torch-not-supported`: Torch is not supported
    - `focus-not-supported`: Focus mode is not supported
    - `device-list-error`: Failed to get device list

### Device Management

Device management in ts-webcam involves the following steps:

1. Get available devices:

```typescript
// Get video devices
const videoDevices = await webcam.getVideoDevices();
const audioInputDevices = await webcam.getAudioInputDevices();
const audioOutputDevices = await webcam.getAudioOutputDevices();

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
                    device: webcams[0],
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
const capabilities = webcam.getCapabilities();

// Zoom control
if (webcam.isZoomSupported()) {
  try {
    await webcam.setZoom(2.0); // 2x zoom
  } catch (error) {
    if (error instanceof WebcamError && error.code === "zoom-not-supported") {
      console.log("Zoom is not supported on this device");
    }
  }
}

// Torch control
if (webcam.isTorchSupported()) {
  try {
    await webcam.setTorch(true);
  } catch (error) {
    if (error instanceof WebcamError && error.code === "torch-not-supported") {
      console.log("Torch is not supported on this device");
    }
  }
}

// Focus mode control
if (webcam.isFocusSupported()) {
  try {
    await webcam.setFocusMode("continuous");
  } catch (error) {
    if (error instanceof WebcamError && error.code === "focus-not-supported") {
      console.log("Focus mode is not supported on this device");
    }
  }
}

// Mirror mode toggle
webcam.toggleMirror(); // Toggle mirror mode

// Check mirror status
const isMirrored = webcam.isMirrorEnabled();
console.log(`Mirror mode is ${isMirrored ? 'enabled' : 'disabled'}`);

// Toggle config about audio
webcam.toggle('audioEnabled');
// and get current audio status
const isAudioEnabled = webcam.isAudioEnabled();
console.log(`Audio is ${isAudioEnabled ? 'enabled' : 'disabled'}`);

// Toggle config about allow any resolution
webcam.toggle('allowAnyResolution');
// and get current allow any resolution status
const isAllowAnyResolution = webcam.isAllowAnyResolution();
console.log(`Allow any resolution is ${isAllowAnyResolution ? 'enabled' : 'disabled'}`);

// Toggle config about allow resolution swap
webcam.toggle('allowResolutionSwap');
// and get current allow resolution swap status
const isAllowResolutionSwap = webcam.isAllowResolutionSwap();
console.log(`Allow resolution swap is ${isAllowResolutionSwap ? 'enabled' : 'disabled'}`);




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
const deviceId = "your-device-id";
const capabilities = await webcam.checkDevicesCapabilitiesData(deviceId);
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
