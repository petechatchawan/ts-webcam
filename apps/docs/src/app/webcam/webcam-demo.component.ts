import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  CommonResolutions,
  DeviceInfo,
  Resolution,
  Webcam,
  WebcamError,
  WebcamErrorCode,
  WebcamEventType,
  WebcamState
} from '@repo/webcam';

@Component({
  selector: 'app-webcam-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Webcam Demo</h1>

      <div
        *ngIf="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        {{ error }}
      </div>

      <div class="flex flex-col md:flex-row gap-4">
        <div class="w-full md:w-2/3">
          <div class="bg-gray-100 rounded-lg overflow-hidden relative">
            <video #videoElement class="w-full h-auto" autoplay playsinline></video>

            <div
              *ngIf="state !== 'ACTIVE'"
              class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white"
            >
              {{ state === 'IDLE' ? 'Camera Off' : 'Starting Camera...' }}
            </div>
          </div>

          <div *ngIf="snapshot" class="mt-4">
            <h3 class="text-lg font-semibold mb-2">Snapshot</h3>
            <img [src]="snapshot" alt="Snapshot" class="max-w-full h-auto border rounded" />
          </div>
        </div>

        <div class="w-full md:w-1/3">
          <div class="bg-white p-4 rounded-lg shadow">
            <h2 class="text-xl font-semibold mb-4">Controls</h2>

            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-1">
                Status: <span class="font-medium">{{ state }}</span>
              </p>

              <div class="flex gap-2 mt-2">
                <button
                  *ngIf="state !== 'ACTIVE'"
                  (click)="startWebcam()"
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  [disabled]="state === 'INITIALIZING' || state === 'REQUESTING_PERMISSIONS'"
                >
                  Start Camera
                </button>

                <button
                  *ngIf="state === 'ACTIVE'"
                  (click)="stopWebcam()"
                  class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Stop Camera
                </button>

                <button
                  (click)="takeSnapshot()"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  [disabled]="state !== 'ACTIVE'"
                >
                  Take Snapshot
                </button>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"> Camera Device </label>
              <select
                class="w-full p-2 border rounded"
                (change)="switchDevice($event)"
                [value]="currentDevice || ''"
                [disabled]="state !== 'ACTIVE'"
              >
                <option value="">Select a device</option>
                <option *ngFor="let device of devices" [value]="device.id">
                  {{ device.label }}
                </option>
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1"> Resolution </label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  (click)="changeResolution('VGA')"
                  class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
                  [disabled]="state !== 'ACTIVE'"
                >
                  VGA (640×480)
                </button>
                <button
                  (click)="changeResolution('HD')"
                  class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
                  [disabled]="state !== 'ACTIVE'"
                >
                  HD (1280×720)
                </button>
                <button
                  (click)="changeResolution('FULL_HD')"
                  class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
                  [disabled]="state !== 'ACTIVE'"
                >
                  Full HD (1920×1080)
                </button>
                <button
                  (click)="changeResolution('QVGA')"
                  class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-sm"
                  [disabled]="state !== 'ACTIVE'"
                >
                  QVGA (320×240)
                </button>
              </div>
            </div>

            <div *ngIf="currentResolution" class="mb-4">
              <h3 class="text-sm font-medium text-gray-700 mb-1">Current Resolution</h3>
              <p class="text-sm">
                {{ currentResolution.width }}×{{ currentResolution.height }}
                {{ currentResolution.frameRate ? ' @ ' + currentResolution.frameRate + 'fps' : '' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class WebcamDemoComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;

  webcam: Webcam | null = null;
  state: WebcamState = WebcamState.IDLE;
  devices: DeviceInfo[] = [];
  currentDevice: string | null = null;
  currentResolution: Resolution | null = null;
  error: string | null = null;
  snapshot: string | null = null;

  ngOnInit(): void {
    this.initWebcam();
  }

  ngOnDestroy(): void {
    if (this.webcam) {
      this.webcam.dispose();
    }
  }

  initWebcam(): void {
    this.webcam = new Webcam({
      resolution: CommonResolutions.HD,
      debug: true,
      mirrored: true
    });

    // Set up event listeners
    this.webcam.on(WebcamEventType.STATE_CHANGE, (newState) => {
      this.state = newState;
    });

    this.webcam.on(WebcamEventType.ERROR, (err) => {
      this.error = err.message;
    });

    this.webcam.on(WebcamEventType.DEVICE_CHANGE, (newDevices) => {
      this.devices = newDevices;
    });

    // Get available devices
    this.webcam
      .getDevices()
      .then((deviceList) => {
        this.devices = deviceList;
      })
      .catch((err) => {
        this.error = `Failed to get devices: ${err.message}`;
      });
  }

  async startWebcam(): Promise<void> {
    if (!this.webcam) return;

    try {
      this.error = null;
      const stream = await this.webcam.start();

      if (this.videoElement?.nativeElement) {
        this.webcam.attachToVideo(this.videoElement.nativeElement);
      }

      this.currentDevice = this.webcam.getCurrentDeviceId();
      this.currentResolution = this.webcam.getCurrentResolution();
    } catch (err) {
      if (err instanceof WebcamError) {
        switch (err.code) {
          case WebcamErrorCode.PERMISSION_DENIED:
            this.error = 'Camera permission denied. Please allow access to your camera.';
            break;
          case WebcamErrorCode.DEVICE_NOT_FOUND:
            this.error = 'No camera device found.';
            break;
          default:
            this.error = `Error: ${err.message}`;
        }
      } else {
        this.error = `Unknown error: ${err instanceof Error ? err.message : String(err)}`;
      }
    }
  }

  async stopWebcam(): Promise<void> {
    if (!this.webcam) return;

    try {
      await this.webcam.stop();
      this.snapshot = null;
    } catch (err) {
      this.error = `Failed to stop webcam: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  takeSnapshot(): void {
    if (!this.webcam || this.state !== WebcamState.ACTIVE) return;

    const snapshotData = this.webcam.takeSnapshot();
    this.snapshot = snapshotData;
  }

  async switchDevice(event: Event): Promise<void> {
    if (!this.webcam) return;

    const select = event.target as HTMLSelectElement;
    const deviceId = select.value;

    try {
      await this.webcam.switchDevice(deviceId);
      this.currentDevice = this.webcam.getCurrentDeviceId();
      this.currentResolution = this.webcam.getCurrentResolution();
    } catch (err) {
      this.error = `Failed to switch device: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  async changeResolution(resolutionName: string): Promise<void> {
    if (!this.webcam) return;

    let resolution: Resolution;

    switch (resolutionName) {
      case 'VGA':
        resolution = CommonResolutions.VGA;
        break;
      case 'HD':
        resolution = CommonResolutions.HD;
        break;
      case 'FULL_HD':
        resolution = CommonResolutions.FULL_HD;
        break;
      case 'QVGA':
        resolution = CommonResolutions.QVGA;
        break;
      default:
        resolution = CommonResolutions.HD;
    }

    try {
      await this.webcam.changeResolution(resolution);
      this.currentResolution = this.webcam.getCurrentResolution();
    } catch (err) {
      this.error = `Failed to change resolution: ${
        err instanceof Error ? err.message : String(err)
      }`;
    }
  }
}
