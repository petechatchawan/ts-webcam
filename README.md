# ts-webcam

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

[![npm version](https://img.shields.io/npm/v/ts-webcam.svg)](https://www.npmjs.com/package/ts-webcam)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Documentation & Demo

- **Live Demo**: [https://ts-webcam.web.app](https://ts-webcam.web.app)
- **Full Documentation**: [View on GitHub](https://github.com/petechatchawan/ts-webcam/blob/main/packages/ts-webcam/README.md)
- **Source Code**: [GitHub Repository](https://github.com/petechatchawan/ts-webcam)
- **NPM Package**: [ts-webcam on npm](https://www.npmjs.com/package/ts-webcam)

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

Or using yarn:

```bash
yarn add ts-webcam
```

Or using pnpm:

```bash
pnpm add ts-webcam
```

## Quick Start

```typescript
import { Webcam, WebcamError } from "ts-webcam";

// Create Webcam instance
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

## License

MIT License
