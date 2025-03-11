ต่อไปนี้คือไฟล์ `.md` ที่อธิบายโครงสร้างและการใช้งานของ library `ts-webcam` ซึ่งเป็นชื่อที่เราเลือกใช้ตามการวิเคราะห์:

````markdown
# ts-webcam

A TypeScript library for managing webcam access using the MediaDevices API. This library provides a simple, type-safe interface for initializing and controlling webcam streams in web applications.

## Features

- Type-safe configuration with TypeScript interfaces
- Support for multiple resolution options with automatic fallback
- Mirror and auto-rotation capabilities
- Customizable preview element integration
- Event callbacks for start and error handling
- Methods to start, stop, and check webcam status

## Installation

1. Clone or download the library files:
   ```bash
   git clone <repository-url>
   ```
````

2. Compile the TypeScript files:
   ```bash
   tsc ts-webcam.ts
   ```
3. Include the compiled JavaScript in your project:
   ```html
   <script src="path/to/ts-webcam.js"></script>
   ```
   Or import it as a module in your TypeScript project:
   ```typescript
   import { Webcam } from "ts-webcam";
   ```

**Note**: If published to npm, install via:

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
  fallbackResolution: "640x480", // Fallback if preferred resolutions fail
  mirror: true, // Mirror the video
  autoRotation: true, // Auto-rotate based on device orientation
  previewElement: document.getElementById("preview") as HTMLVideoElement, // Video element for preview
  onStart: () => console.log("Webcam started"),
  onError: (error) => console.error("Error: ", error),
});

// Start the webcam
webcam.start();

// Stop the webcam
webcam.stop();
```

### Configuration Options

The `Webcam` class accepts an object with the following optional properties:

| Property             | Type                     | Default       | Description                                       |
| -------------------- | ------------------------ | ------------- | ------------------------------------------------- |
| `audio`              | `boolean`                | `false`       | Enable audio capture                              |
| `device`             | `string`                 | `undefined`   | Specific device ID to use                         |
| `resolution`         | `string[]`               | `['640x480']` | Array of preferred resolutions (e.g., '1280x720') |
| `fallbackResolution` | `string`                 | `'640x480'`   | Fallback resolution if preferred ones fail        |
| `mirror`             | `boolean`                | `false`       | Mirror the video horizontally                     |
| `autoRotation`       | `boolean`                | `true`        | Automatically rotate based on device orientation  |
| `previewElement`     | `HTMLVideoElement`       | `undefined`   | Element to display the webcam stream              |
| `onStart`            | `() => void`             | `undefined`   | Callback when webcam starts successfully          |
| `onError`            | `(error: Error) => void` | `undefined`   | Callback for error handling                       |

### Methods

| Method                   | Return Type                                 | Description                               |
| ------------------------ | ------------------------------------------- | ----------------------------------------- |
| `start()`                | `Promise<void>`                             | Starts the webcam stream                  |
| `stop()`                 | `void`                                      | Stops the webcam stream                   |
| `isActive()`             | `boolean`                                   | Checks if the webcam is currently active  |
| `getCurrentResolution()` | `{ width: number; height: number } \| null` | Gets the current resolution               |
| `updateConfig(config)`   | `void`                                      | Updates the configuration with new values |

### Example with Additional Methods

```typescript
import { Webcam } from "ts-webcam";

const webcam = new Webcam({
  previewElement: document.getElementById("preview") as HTMLVideoElement,
});

async function initWebcam() {
  try {
    await webcam.start();
    console.log("Current resolution:", webcam.getCurrentResolution());
    console.log("Is active:", webcam.isActive());

    // Update config later if needed
    webcam.updateConfig({ mirror: true });
  } catch (error) {
    console.error("Failed to start webcam:", error);
  }
}

initWebcam();
```

## Project Structure

```
ts-webcam/
├── src/
│   └── ts-webcam.ts    # Main TypeScript source file
├── dist/
│   └── ts-webcam.js    # Compiled JavaScript file
├── README.md           # This file
└── package.json        # (Optional) If publishing to npm
```

## Development

To contribute or modify the library:

1. Edit `src/ts-webcam.ts`
2. Compile changes:
   ```bash
   tsc src/ts-webcam.ts --outDir dist
   ```
3. Test in your project

## Requirements

- Modern browser with MediaDevices API support (Chrome, Firefox, Edge, Safari)
- TypeScript (if using in a TypeScript project)

## Limitations

- Does not yet support device enumeration (coming soon)
- No frame capture functionality (planned feature)
- Basic error handling; may need extension for specific use cases

## License

MIT License (or specify your preferred license)

## Contributing

Feel free to submit issues or pull requests to enhance functionality!

```

### คำอธิบาย
- **โครงสร้าง**: ไฟล์ `.md` นี้รวมข้อมูลสำคัญทั้งหมด เช่น การติดตั้ง, การใช้งาน, รายการเมธอด, และโครงสร้างโปรเจค
- **ความยืดหยุ่น**: ออกแบบให้สามารถปรับแต่งได้ เช่น การเพิ่ม license หรือฟีเจอร์ในอนาคต
- **ความชัดเจน**: ใช้ตารางและตัวอย่างโค้ดเพื่อให้เข้าใจง่าย

ถ้าต้องการปรับแต่งเพิ่มเติม เช่น เพิ่ม section เฉพาะ, เปลี่ยน license, หรือเพิ่มตัวอย่างการใช้งานอื่นๆ บอกมาได้เลยครับ!
```
