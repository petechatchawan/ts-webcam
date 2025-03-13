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

Device management in ts-webcam involves the following steps:

1. Get available devices:

```typescript
// Request permissions first
const permissions = await webcam.requestPermissions();
if (permissions.camera === 'granted') {
    // Get device list after permission is granted
    await webcam.getAvailableDevices();

    // View device lists
    const allDevices = webcam.getDeviceList();
    const videoDevices = webcam.getVideoDevices();
    const audioInputDevices = webcam.getAudioInputDevices();
    const audioOutputDevices = webcam.getAudioOutputDevices();

    // Get current active device
    const currentDevice = webcam.getCurrentDevice();
}
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
- `setupChangeListeners()` will automatically call `getAvailableDevices()` on initialization
- When devices change, the system will automatically call `getAvailableDevices()`
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
            await webcam.getAvailableDevices();
            const cameras = webcam.getVideoDevices();

            if (cameras.length > 0) {
                // 3. Setup camera configuration
                webcam.setupConfiguration({
                    device: cameras[0].id,
                    // ... other config options
                });

                // 4. Setup device change tracking
                webcam.setupChangeListeners();

                // 5. Start the camera
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

### Permission Management

Permission management for camera and microphone consists of 4 main parts:

1. Check permission status:

```typescript
// Check camera permission status
const cameraStatus = await webcam.checkCameraPermission();
console.log("Camera permission status:", cameraStatus); // 'granted' | 'denied' | 'prompt'

// Check microphone permission status
const micStatus = await webcam.checkMicrophonePermission();
console.log("Microphone permission status:", micStatus); // 'granted' | 'denied' | 'prompt'

// Get all current permissions
const currentPermissions = webcam.getCurrentPermissions();
console.log("Current permissions:", currentPermissions);
```

2. Request permissions:

```typescript
try {
  // Check if permission request is needed
  if (webcam.needsPermissionRequest()) {
    const permissions = await webcam.requestPermissions();

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
  onError: (error: CameraError) => {
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

#### Example usage with UI:

```typescript
// Check permission status when component loads
useEffect(() => {
  const checkPermissions = async () => {
    await webcam.checkCameraPermission();
    await webcam.checkMicrophonePermission();
    const permissions = webcam.getCurrentPermissions();

    // Update UI based on permission status
    if (webcam.hasPermissionDenied()) {
      setShowSettingsButton(true);
    } else if (webcam.needsPermissionRequest()) {
      setShowRequestButton(true);
    }
  };

  checkPermissions();
}, []);

// Display buttons based on permission status
return (
  <div>
    {webcam.needsPermissionRequest() && (
      <button onClick={() => webcam.requestPermissions()}>
        Request Camera Access
      </button>
    )}
    {webcam.hasPermissionDenied() && (
      <button onClick={() => openBrowserSettings()}>
        Open Permission Settings
      </button>
    )}
  </div>
);
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

// Capture image with options
const image = webcam.captureImage({
  scale: 1.0,           // Scale factor for the output image
  mediaType: 'image/jpeg', // 'image/png' or 'image/jpeg'
  quality: 0.8          // Image quality (0.0 - 1.0), applies to JPEG only
});

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

// Mirror mode toggle
webcam.toggleMirrorMode(); // Toggle mirror mode

// Check mirror status
const isMirrored = webcam.getState().config.mirror;
console.log(`Mirror mode is ${isMirrored ? 'enabled' : 'disabled'}`);
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

### State Management

การจัดการ state ใน ts-webcam แบ่งออกเป็น 2 ประเภท:

1. State การทำงานปัจจุบัน (Operational State):

    - `status`: สถานะการทำงานของกล้อง
    - `stream`: MediaStream ปัจจุบัน
    - `lastError`: ข้อผิดพลาดล่าสุด
    - `capabilities`: ความสามารถของกล้องที่ใช้งานอยู่

2. ข้อมูลพื้นฐานของระบบ (System Data):
    - `config`: การตั้งค่าปัจจุบัน
    - `devices`: รายการอุปกรณ์ที่มี
    - `currentOrientation`: การวางแนวของอุปกรณ์
    - `currentPermission`: สถานะสิทธิ์การใช้งาน

เมื่อเรียกใช้ `stop()` จะ reset เฉพาะ state การทำงานปัจจุบันเท่านั้น โดยจะคงค่าข้อมูลพื้นฐานของระบบไว้ เพื่อให้สามารถเริ่มกล้องใหม่ได้โดยใช้การตั้งค่าเดิม

```typescript
// ตัวอย่างการหยุดและเริ่มกล้องใหม่
webcam.stop();  // reset เฉพาะ operational state
await webcam.start();  // เริ่มกล้องใหม่โดยใช้ config เดิม
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
