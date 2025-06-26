import { Injectable } from '@angular/core';
import {
  DeviceCapability,
  PermissionStates,
  Resolution,
  ResolutionSupportInfo,
  Webcam,
  WebcamConfiguration,
  WebcamError,
  WebcamState,
  WebcamStatus
} from 'ts-webcam';

@Injectable({
  providedIn: 'root'
})
export class WebcamService {
  private readonly webcam: Webcam;

  constructor() {
    this.webcam = new Webcam();
  }

  // ====================
  // SIMPLE STATE ACCESS
  // ====================

  get state(): WebcamState {
    return this.webcam.getState();
  }

  get status(): WebcamStatus {
    return this.webcam.getStatus();
  }

  get permissionStates(): PermissionStates {
    return this.webcam.getPermissionStates();
  }

  get currentDevice(): MediaDeviceInfo | null {
    return this.webcam.getCurrentDevice();
  }

  get currentCapabilities(): DeviceCapability | null {
    return this.webcam.getCurrentDeviceCapabilities();
  }

  get lastError(): WebcamError | null {
    return this.webcam.getLastError();
  }

  // ====================
  // PERMISSION METHODS
  // ====================

  async checkPermissions(): Promise<PermissionStates> {
    await this.webcam.checkCameraPermission();
    await this.webcam.checkMicrophonePermission();
    return this.webcam.getPermissionStates();
  }

  async requestPermissions(): Promise<PermissionStates> {
    return await this.webcam.requestPermissions();
  }

  needsPermissionRequest(): { camera: boolean; microphone: boolean } {
    return this.webcam.needsPermissionRequest();
  }

  hasPermissionDenied(): boolean {
    return this.webcam.hasPermissionDenied();
  }

  // ====================
  // DEVICE METHODS
  // ====================

  async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    return await this.webcam.getVideoDevices();
  }

  async getAllDevices(): Promise<MediaDeviceInfo[]> {
    return await this.webcam.getAllDevices();
  }

  async refreshDevices(): Promise<void> {
    await this.webcam.refreshDevices();
  }

  setupChangeListeners(): void {
    this.webcam.setupChangeListeners();
  }

  stopChangeListeners(): void {
    this.webcam.stopChangeListeners();
  }

  // ====================
  // WEBCAM CONTROL
  // ====================

  setupConfiguration(config: Partial<WebcamConfiguration> & { deviceInfo: MediaDeviceInfo }): void {
    const fullConfig: WebcamConfiguration = {
      enableAudio: false,
      enableMirror: true,
      debug: true,
      ...config
    };

    this.webcam.setupConfiguration(fullConfig);
  }

  async startWebcam(): Promise<void> {
    return await this.webcam.start();
  }

  stopWebcam(): void {
    this.webcam.stop();
  }

  // ====================
  // ADVANCED CONTROLS
  // ====================

  async getDeviceCapabilities(deviceId: string): Promise<DeviceCapability> {
    return await this.webcam.getDeviceCapabilities(deviceId);
  }

  isZoomSupported(): boolean {
    return this.webcam.isZoomSupported();
  }

  async setZoomLevel(level: number): Promise<void> {
    return await this.webcam.setZoomLevel(level);
  }

  isTorchSupported(): boolean {
    return this.webcam.isTorchSupported();
  }

  async enableTorch(enabled: boolean): Promise<void> {
    return await this.webcam.enableTorch(enabled);
  }

  toggleMirror(): void {
    this.webcam.toggleMirror();
  }

  isMirrorEnabled(): boolean {
    return this.webcam.isMirrorEnabled();
  }

  // ====================
  // IMAGE CAPTURE
  // ====================

  captureImage(options?: {
    scale?: number;
    mediaType?: 'image/jpeg' | 'image/png';
    quality?: number;
  }): string {
    return this.webcam.captureImage(options);
  }

  // ====================
  // STATUS & STATE
  // ====================

  getCurrentResolution(): Resolution | null {
    return this.webcam.getCurrentResolution();
  }

  clearError(): void {
    this.webcam.clearError();
  }

  // ====================
  // UTILITY METHODS
  // ====================

  checkSupportedResolutions(
    capabilities: DeviceCapability[],
    resolutions: Resolution[]
  ): ResolutionSupportInfo {
    return this.webcam.checkSupportedResolutions(capabilities, resolutions);
  }

  createResolution(name: string, width: number, height: number): Resolution {
    return this.webcam.createResolution(name, width, height);
  }

  createCommonResolutions(): Resolution[] {
    return [
      this.createResolution('1920x1920', 1920, 1920),
      this.createResolution('1440x1440', 1440, 1440),
      this.createResolution('1080x1080', 1080, 1080),
      this.createResolution('720x720', 720, 720),
      this.createResolution('480x480', 480, 480)
    ];
  }
}
