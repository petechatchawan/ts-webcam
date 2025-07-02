# TS-Webcam 2.0.0

A production-grade TypeScript webcam library with modern APIs, flexible permission handling, and comprehensive device support.

## Features

✨ **Modern TypeScript API** - Full type safety and modern ES6+ features
🎥 **Flexible Device Control** - Support for multiple cameras and resolutions
🔐 **Smart Permissions** - Granular permission control for camera and audio
📱 **Cross-Platform** - Works on desktop and mobile browsers
🎛️ **Advanced Controls** - Torch/flash support, device capabilities detection
🔧 **Event-Driven** - Comprehensive event system for state management
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
import { TsWebcam } from 'ts-webcam';

const webcam = new TsWebcam();

// Request permissions
await webcam.requestPermissions({ video: true, audio: false });

// Get available devices
const devices = await webcam.getVideoDevices();

// Start camera
const config = {
  deviceInfo: devices[0],
  preferredResolutions: { width: 1280, height: 720 },
  videoElement: document.getElementById('video') as HTMLVideoElement
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

#### Events

- `stream:start` - Camera stream started
- `stream:stop` - Camera stream stopped
- `error` - Error occurred
- `permission:change` - Permission status changed
- `device:change` - Available devices changed
- `state:change` - Webcam state changed

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
}

interface TsWebcamState {
  status: 'idle' | 'initializing' | 'ready' | 'error';
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
- **Modular Architecture**: Split into separate modules (types, errors, event-emitter, core)
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
import { TsWebcam } from 'ts-webcam/dist/ts-webcam';

// After (2.0)
import { TsWebcam, TsWebcamState } from 'ts-webcam';
```

### State Management
```typescript
// Before (1.x)
webcam.on('statusChange', (status) => { ... });
webcam.on('errorChange', (error) => { ... });

// After (2.0)
webcam.on('state:change', (state: TsWebcamState) => {
  console.log('Status:', state.status);
  console.log('Error:', state.error);
  console.log('Permissions:', state.permissions);
});
```

### Permission Handling
```typescript
// Before (1.x)
await webcam.requestCameraPermission();

// After (2.0)
await webcam.requestPermissions({ video: true, audio: false });
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
