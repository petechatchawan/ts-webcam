# ts-webcam

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

## Features

- Type-safe configuration with TypeScript interfaces
- Support for multiple resolution options with automatic fallback
- Mirror and auto-rotation capabilities
- Customizable preview element integration
- Event callbacks for start and error handling
- Comprehensive set of basic methods

## Installation

```bash
npm install ts-webcam
```

## Usage

### Basic Example

```typescript
import { Webcam } from "ts-webcam";

// Initialize Webcam
const webcam = new Webcam({
  audio: true,
  device: "your-device-id", // Optional: specific device ID
  resolution: ["1280x720", "640x480"], // Preferred resolutions
  fallbackResolution: "640x480", // Fallback resolution
  mirror: true, // Enable mirror mode
  autoRotation: true, // Auto-rotate based on device orientation
  previewElement: document.getElementById("preview") as HTMLVideoElement, // Preview element
  onStart: () => console.log("Webcam started successfully"),
  onError: (error) => console.error("Error:", error),
});

// Start the webcam
webcam.start();

// Stop the webcam
webcam.stop();
```

### Additional Methods Example

```typescript
// Check active status
console.log("Is active:", webcam.isActive());

// Get current resolution
const resolution = webcam.getCurrentResolution();
console.log("Resolution:", resolution);

// Update configuration
webcam.updateConfig({ mirror: true });
```

## System Requirements

- Browser with MediaDevices API support (Chrome, Firefox, Edge, Safari)
- TypeScript (if using in a TypeScript project)

## License

MIT License

## Support

If you encounter any issues or would like to request new features, please create an issue at our [GitHub repository](https://github.com/yourusername/ts-webcam)
