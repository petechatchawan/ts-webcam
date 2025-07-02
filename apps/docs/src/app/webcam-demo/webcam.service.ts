import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  DeviceCapability,
  TsWebcam,
  TsWebcamState,
  WebcamConfiguration,
  PermissionRequestOptions
} from 'ts-webcam';

@Injectable({ providedIn: 'root' })
export class WebcamService {
  private webcam = new TsWebcam();
  private state$ = new BehaviorSubject<TsWebcamState>(this.webcam.getState());
  private devices$ = new BehaviorSubject<MediaDeviceInfo[]>([]);
  private permissionChecked$ = new BehaviorSubject<boolean>(false);
  private deviceCapabilities$ = new BehaviorSubject<DeviceCapability | null>(null);

  constructor() {
    this.webcam.on('state:change', (state: TsWebcamState) => {
      console.debug('Webcam state changed:', state);
      this.state$.next(state);
    });
    this.webcam.on('device:change', (devices) => {
      console.debug('Webcam devices changed:', devices);
      this.devices$.next(devices);
    });
    this.webcam.on('permission:change', () => {
      console.debug('Webcam permission changed');
      this.permissionChecked$.next(true);
    });
  }

  // State getter
  getState(): Observable<TsWebcamState> {
    return this.state$.asObservable();
  }

  getDevices(): Observable<MediaDeviceInfo[]> {
    return this.devices$.asObservable();
  }
  
  getPermissionChecked(): Observable<boolean> {
    return this.permissionChecked$.asObservable();
  }
  
  getDeviceCapabilities(): Observable<DeviceCapability | null> {
    return this.deviceCapabilities$.asObservable();
  }

  async requestPermissionsAndLoadDevices(options: PermissionRequestOptions = { video: true, audio: false }) {
    try {
      const perms = await this.webcam.requestPermissions(options);
      this.permissionChecked$.next(true);
      if (!this.isPermissionDenied(perms)) {
        await this.loadDevices();
      }
    } catch (e) {
      console.error('Permission request failed:', e);
      this.permissionChecked$.next(false);
    }
  }

  isPermissionDenied(perms?: Record<string, PermissionState>): boolean {
    const p = perms || this.state$.value.permissions;
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
      this.devices$.next(devices);
    } catch (e) {
      console.error('Load devices failed:', e);
    }
  }

  async startCamera(config: WebcamConfiguration) {
    try {
      await this.webcam.startCamera(config);
    } catch (e) {
      console.error('Start camera failed:', e);
    }
  }

  stopCamera() {
    this.webcam.stopCamera();
  }

  async testDeviceCapabilities(deviceId: string) {
    this.deviceCapabilities$.next(null);
    try {
      const caps = await this.webcam.getDeviceCapabilities(deviceId);
      this.deviceCapabilities$.next(caps);
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
