# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-07-02

### 🔥 Breaking Changes

- **REMOVED**: All event emitter/event system code
- **REPLACED**: Event-based API with simple callback-based handlers
- **CHANGED**: API structure - callbacks now part of `WebcamConfiguration`
- **REMOVED**: `TsWebcamEvents` interface and all `.on()`, `.off()`, `.emit()` methods
- **REFACTORED**: Modular architecture split into separate files

### ✨ Added

- **Callback-based API**: Simple handler functions in configuration
  - `onStateChange` - Unified state updates
  - `onStreamStart/onStreamStop` - Stream lifecycle events
  - `onError` - Error handling
  - `onPermissionChange` - Permission status updates
  - `onDeviceChange` - Device hotplug detection

- **Modular Architecture**: Clean separation of concerns
  - `types.ts` - All type definitions
  - `errors.ts` - Error classes and handling
  - `ts-webcam-core.ts` - Core implementation
  - `index.ts` - Public exports

- **Enhanced State Management**: 
  - `TsWebcamState` unified state interface
  - `TsWebcamStateInternal` for internal use
  - Readonly public state access

- **Improved Permission Handling**:
  - `requestPermissions(options)` with granular control
  - Support for video-only, audio-only, or both
  - Permission status tracking in state

- **Device Capabilities**:
  - `getDeviceCapabilities()` method
  - Torch/flash support detection
  - Zoom and focus capabilities
  - Resolution and frame rate support

- **Angular 17+ Integration**:
  - Modern signal-based reactive patterns
  - `WebcamService` with observables
  - Clean component architecture
  - Computed properties and effects

### 🛠️ Improved

- **Developer Experience**:
  - Full TypeScript type safety
  - Comprehensive JSDoc documentation
  - Better error messages with error codes
  - Clean, readable code structure

- **Performance**:
  - No event emitter overhead
  - Optimized resource cleanup
  - Efficient state management
  - Reduced bundle size

- **Reliability**:
  - Better error handling
  - Proper resource disposal
  - Memory leak prevention
  - Cross-browser compatibility

### 📚 Documentation

- **Updated README**: Complete rewrite with callback API examples
- **Advanced Examples**: Comprehensive usage patterns
- **API Reference**: Full method and callback documentation
- **Migration Guide**: Step-by-step upgrade instructions
- **TypeScript Integration**: Full type definitions and examples

### 🔧 Technical Improvements

- **Build System**: Optimized TypeScript compilation
- **Type Safety**: Strict TypeScript configuration
- **Code Quality**: ESLint and Prettier integration
- **Testing**: Updated for callback-based API
- **Packaging**: Clean dist structure with proper exports

## [1.x.x] - Previous Versions

### Event-Based API (Deprecated)

The 1.x versions used an event-based API with EventEmitter:

```typescript
// Old API (1.x)
webcam.on('state:change', (state) => { ... });
webcam.on('error', (error) => { ... });
```

This has been replaced with a cleaner callback-based approach:

```typescript
// New API (2.0)
const config = {
  // ... other config
  onStateChange: (state) => { ... },
  onError: (error) => { ... }
};
```

## Migration Guide

### From 1.x to 2.0

1. **Remove Event Listeners**:
   ```typescript
   // Remove these
   webcam.on('state:change', handler);
   webcam.off('state:change', handler);
   ```

2. **Add Callbacks to Configuration**:
   ```typescript
   // Add these to startCamera config
   const config = {
     deviceInfo: device,
     videoElement: video,
     onStateChange: (state) => { ... },
     onError: (error) => { ... }
   };
   ```

3. **Update Imports**:
   ```typescript
   // Old
   import { TsWebcam, TsWebcamEvents } from 'ts-webcam';
   
   // New
   import { TsWebcam, TsWebcamState } from 'ts-webcam';
   ```

4. **State Access**:
   ```typescript
   // Use getState() for current state
   const currentState = webcam.getState();
   ```

### Benefits of 2.0

- ✅ **Simpler API**: No event listener management
- ✅ **Better TypeScript**: Full type safety for callbacks
- ✅ **Performance**: No EventEmitter overhead
- ✅ **Maintainability**: Cleaner, more readable code
- ✅ **Integration**: Easier to use with any framework

---

For detailed documentation and examples, see [README.md](./README.md).
