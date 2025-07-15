# Changelog

All notable changes to the TS-Webcam project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.7] - 2025-07-16

### ✨ New Features

- **Device and Resolution Tracking**: Added `getCurrentDevice()` and `getCurrentResolution()` methods to track active camera and resolution
- **Improved Debugging**: Introduced dedicated debug logging system with `enableDebug()`, `disableDebug()`, and `debugLog()` methods
- **Enhanced Resolution Handling**: Improved support for multiple preferred resolutions with automatic fallback mechanism

### 🛠️ Improvements

- **Resolution Validation**: Made resolution validation mandatory when specifying preferred resolutions
- **Cleaner Configuration**: Removed `validateResolution` and `debug` options from configuration, using dedicated methods instead
- **Better Error Messages**: Enhanced error messages with attempted resolutions and device information
- **Simplified Device Selection**: Made `deviceInfo` optional in configuration, automatically selecting first available device if not provided
- **Resolution Fallback**: Improved resolution fallback mechanism to try multiple resolutions until a working one is found

### 🐛 Bug Fixes

- **Stream Variable Initialization**: Fixed TypeScript error related to stream variable initialization
- **Error Code Consistency**: Fixed incorrect error code usage (NO_DEVICE_FOUND -> DEVICE_NOT_FOUND)

## [2.0.0] - 2025-07-02

### 🔥 Breaking Changes

- **Modular Architecture**: Complete refactor into separate modules (`types.ts`, `errors.ts`, `event-emitter.ts`, `ts-webcam-core.ts`)
- **Unified State Management**: Introduced `TsWebcamState` as single source of truth for all webcam state
- **Updated API**: Simplified and more consistent method signatures
- **Event System Overhaul**: New event naming convention (`state:change`, `stream:start`, etc.)
- **Permission API**: Replaced individual permission methods with unified `requestPermissions(options)`

### ✨ New Features

- **Flexible Permission Requests**: Granular control over camera and audio permissions with `PermissionRequestOptions`
- **State Observability**: Complete reactive state management with `TsWebcamState`
- **Device Capabilities Detection**: Advanced device feature detection with `getDeviceCapabilities()`
- **Torch/Flash Support**: Control camera flash/torch when available on devices
- **Enhanced Error Handling**: Comprehensive `WebcamError` types with detailed error information
- **Debug Mode**: Built-in debugging and logging capabilities
- **Resource Management**: Improved cleanup and resource disposal

### 🛠️ Improvements

- **TypeScript**: Full type safety with comprehensive type definitions
- **Performance**: Optimized resource management and memory usage
- **Reliability**: Better error handling and edge case coverage
- **Developer Experience**: Enhanced debugging, logging, and IntelliSense support
- **Cross-Platform**: Improved compatibility across desktop and mobile browsers
- **Documentation**: Comprehensive API documentation and examples

### 🐛 Bug Fixes

- **Memory Leaks**: Fixed potential memory leaks in event listeners and stream management
- **Permission Handling**: Improved permission state tracking and edge cases
- **Device Detection**: Better handling of device changes and hot-plugging
- **Stream Cleanup**: Enhanced stream disposal and cleanup procedures

### 📦 Dependencies

- **Updated TypeScript**: Support for latest TypeScript features
- **Modern ES Modules**: Full ES6+ module support
- **Browser Compatibility**: Maintained compatibility with modern browsers

### 🔄 Migration Guide

#### Updated Imports

```typescript
// Before (1.x)
import { TsWebcam } from "ts-webcam/dist/ts-webcam";

// After (2.0)
import { TsWebcam, TsWebcamState, WebcamError } from "ts-webcam";
```

#### State Management

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

#### Permission Handling

```typescript
// Before (1.x)
await webcam.requestCameraPermission();

// After (2.0)
await webcam.requestPermissions({ video: true, audio: false });
```

#### Configuration

```typescript
// Before (1.x)
await webcam.startCamera(device, resolution, videoElement);

// After (2.0)
await webcam.startCamera({
	deviceInfo: device,
	preferredResolutions: resolution,
	videoElement: videoElement,
	enableAudio: false,
	enableMirror: true,
});
```

### 🎯 Angular Integration

- **Modern Angular Support**: Full compatibility with Angular 17+ and signals
- **Service Integration**: Enhanced Angular service with reactive state management
- **Component Examples**: Complete Angular component examples with best practices

## [1.x.x] - Previous Versions

Previous versions focused on basic webcam functionality with limited API surface.
