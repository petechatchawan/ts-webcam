import { Injectable, signal, Signal } from '@angular/core';
import {
  DeviceCapability,
  PermissionRequestOptions,
  TsWebcam,
  TsWebcamState,
  WebcamConfiguration
} from 'ts-webcam';

@Injectable({ providedIn: 'root' })
export class WebcamService {
  private webcam = new TsWebcam();
  private state = signal<TsWebcamState>(this.webcam.getState());
  private devices = signal<MediaDeviceInfo[]>([]);
  private permissionChecked = signal<boolean>(false);
  private deviceCapabilities = signal<DeviceCapability | null>(null);

  constructor() {
    // No more event listeners needed - we'll use callbacks in configuration
  }

  /**
   * Gets the current webcam state
   * @returns Signal<TsWebcamState> - Reactive state signal
   * @example
   * const state = service.getState()();
   * if (state.status === 'ready') {
   *   console.log('Webcam is ready!');
   * }
   */
  getState(): Signal<TsWebcamState> {
    return this.state.asReadonly();
  }

  /**
   * Gets available video devices
   * @returns Signal<MediaDeviceInfo[]> - Signal of available devices
   */
  getDevices(): Signal<MediaDeviceInfo[]> {
    return this.devices.asReadonly();
  }

  /**
   * Checks if permissions have been requested
   * @returns Signal<boolean> - Permission check status
   */
  getPermissionChecked(): Signal<boolean> {
    return this.permissionChecked.asReadonly();
  }

  /**
   * Gets device capabilities for testing
   * @returns Signal<DeviceCapability | null> - Device capabilities or null
   */
  getDeviceCapabilities(): Signal<DeviceCapability | null> {
    return this.deviceCapabilities.asReadonly();
  }

  /**
   * Requests permissions and loads available devices
   * @param options Permission options for video and audio access
   * @returns Promise<void>
   * @example
   * // Request only camera
   * await service.requestPermissionsAndLoadDevices({ video: true, audio: false });
   *
   * // Request both camera and microphone
   * await service.requestPermissionsAndLoadDevices({ video: true, audio: true });
   */
  async requestPermissionsAndLoadDevices(options: PermissionRequestOptions = { video: true, audio: false }) {
    try {
      const perms = await this.webcam.requestPermissions(options);
      this.permissionChecked.set(true);
      if (!this.isPermissionDenied(perms)) {
        await this.loadDevices();
      }
    } catch (e) {
      console.error('Permission request failed:', e);
      this.permissionChecked.set(false);
    }
  }

  /**
   * Checks if camera or microphone permissions are denied
   * @param perms Optional permissions object, uses current state if not provided
   * @returns boolean - True if any required permission is denied or in prompt state
   * @example
   * if (service.isPermissionDenied()) {
   *   console.log('Please allow camera access');
   * }
   */
  isPermissionDenied(perms?: Record<string, PermissionState>): boolean {
    const p = perms || this.state().permissions;
    return (
      p['camera'] === 'denied' ||
      p['microphone'] === 'denied' ||
      p['camera'] === 'prompt' ||
      p['microphone'] === 'prompt'
    );
  }

  async loadDevices() {
    try {
      const devices = await this.webcam.getVideoDevices();
      this.devices.set(devices);
    } catch (e) {
      console.error('Load devices failed:', e);
    }
  }

  async startCamera(config: WebcamConfiguration) {
    try {
      // Add callbacks to the configuration
      const configWithCallbacks: WebcamConfiguration = {
        ...config,
        onStateChange: (state: TsWebcamState) => {
          console.debug('Webcam state changed:', state);
          this.state.set(state);
        },
        onStreamStart: (stream: MediaStream) => {
          console.debug('Webcam stream started:', stream);
        },
        onStreamStop: () => {
          console.debug('Webcam stream stopped');
        },
        onError: (error) => {
          console.error('Webcam error:', error);
        },
        onPermissionChange: (permissions) => {
          console.debug('Webcam permission changed:', permissions);
          this.permissionChecked.set(true);
        },
        onDeviceChange: (devices) => {
          console.debug('Webcam devices changed:', devices);
          this.devices.set(devices);
        }
      };

      await this.webcam.startCamera(configWithCallbacks);
    } catch (e) {
      console.error('Start camera failed:', e);
    }
  }

  stopCamera() {
    this.webcam.stopCamera();
  }

  async testDeviceCapabilities(deviceId: string) {
    this.deviceCapabilities.set(null);
    try {
      const caps = await this.webcam.getDeviceCapabilities(deviceId);
      this.deviceCapabilities.set(caps);
    } catch (e) {
      console.error('Test device capabilities failed:', e);
    }
  }

  async capture(): Promise<Blob> {
    try {
      return await this.webcam.capture();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'ไม่สามารถจับภาพได้';
      console.error('Capture failed:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  captureImage(): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      this.webcam.capture()
        .then((imageUrl) => {
          resolve(imageUrl);
        })
        .catch((error) => {
          console.error('Capture failed:', error);
          reject(error);
        });
    });
  }

  dispose() {
    this.webcam.dispose();
  }
}
