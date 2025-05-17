# @repo/webcam

A pure TypeScript webcam library that provides a simple and powerful API for working with webcams in web applications.

## Features

- **Permission Handling**: Check and request camera permissions
- **Camera Controls**: Start, stop, and take snapshots
- **Device Selection**: List and switch between available camera devices
- **Resolution Settings**: Set and detect supported resolutions
- **Lifecycle Management**: Proper resource cleanup and state management
- **UI Decoupling**: Use with or without video elements
- **Concurrency Safety**: Prevents concurrent operations
- **Browser Compatibility**: Fallbacks for different browser implementations
- **Strong Typing**: TypeScript definitions for all APIs
- **Debug Logging**: Optional debug mode for troubleshooting
- **Error Types**: Specific error codes for different failure scenarios

## Installation

```bash
npm install @repo/webcam
# or
yarn add @repo/webcam
# or
pnpm add @repo/webcam
```

## Basic Usage

```typescript
import { Webcam, WebcamState, WebcamEventType } from '@repo/webcam';

// Create a webcam instance
const webcam = new Webcam({
  resolution: { width: 1280, height: 720 },
  debug: true,
});

// Listen for state changes
webcam.on(WebcamEventType.STATE_CHANGE, (state) => {
  console.log('Webcam state changed:', state);
});

// Start the webcam
async function startWebcam() {
  try {
    const stream = await webcam.start();
    
    // Attach to a video element (optional)
    const videoElement = document.getElementById('webcam-video') as HTMLVideoElement;
    webcam.attachToVideo(videoElement);
  } catch (error) {
    console.error('Failed to start webcam:', error);
  }
}

// Stop the webcam
function stopWebcam() {
  webcam.stop().then(() => {
    console.log('Webcam stopped');
  });
}

// Take a snapshot
function takeSnapshot() {
  const snapshot = webcam.takeSnapshot();
  if (snapshot) {
    const img = document.createElement('img');
    img.src = snapshot;
    document.body.appendChild(img);
  }
}

// Clean up when done
function cleanup() {
  webcam.dispose();
}
```

## Advanced Usage

### Switching Devices

```typescript
// Get available devices
const devices = await webcam.getDevices();

// Switch to a different device
if (devices.length > 1) {
  await webcam.switchDevice(devices[1].id);
}
```

### Changing Resolution

```typescript
import { CommonResolutions } from '@repo/webcam';

// Switch to HD resolution
await webcam.changeResolution(CommonResolutions.HD);

// Or use a custom resolution
await webcam.changeResolution({ width: 1920, height: 1080, frameRate: 30 });
```

### Error Handling

```typescript
import { WebcamErrorCode, WebcamError } from '@repo/webcam';

try {
  await webcam.start();
} catch (error) {
  if (error instanceof WebcamError) {
    switch (error.code) {
      case WebcamErrorCode.PERMISSION_DENIED:
        console.error('Please grant camera permissions');
        break;
      case WebcamErrorCode.DEVICE_NOT_FOUND:
        console.error('No camera found');
        break;
      case WebcamErrorCode.RESOLUTION_UNSUPPORTED:
        console.error('Requested resolution not supported');
        break;
      default:
        console.error('Webcam error:', error.message);
    }
  }
}
```

## API Reference

See the TypeScript definitions for complete API documentation.

## License

MIT
