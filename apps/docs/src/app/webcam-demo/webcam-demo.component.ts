import { CommonModule, DecimalPipe, JsonPipe } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  DeviceCapability,
  DeviceInfo,
  PermissionStates,
  Resolution,
  ResolutionSupportInfo,
  WebcamConfiguration,
  WebcamError,
  WebcamStatus
} from 'ts-webcam';
import { WebcamService } from '../services/webcam.service';

@Component({
  selector: 'app-webcam-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, JsonPipe, DecimalPipe],
  templateUrl: './webcam-demo.component.html',
  styleUrls: ['./webcam-demo.component.css']
})
export class WebcamDemoComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: true })
  private readonly videoElement!: ElementRef<HTMLVideoElement>;

  devices: DeviceInfo[] = [];
  selectedDevice: DeviceInfo | null = null;
  isLoading = true;

  // Current resolution
  currentResolution: Resolution | null = null;

  // Resolution testing
  resolutions: Resolution[] = [];
  resolutionSupport: ResolutionSupportInfo | null = null;

  capabilities: DeviceCapability | null = null;

  lastError: WebcamError | null = null;
  lastAction: (() => Promise<void>) | null = null;

  showCapabilities = false;
  showResolutions = false;

  constructor(private readonly webcamService: WebcamService) {}

  // ====================
  // GETTERS FOR SIMPLE ACCESS
  // ====================

  get status(): WebcamStatus {
    return this.webcamService.status;
  }

  get error(): WebcamError | null {
    return this.webcamService.lastError;
  }

  get permissionStates(): PermissionStates {
    return this.webcamService.permissionStates;
  }

  get statusText(): string {
    switch (this.status) {
      case 'idle':
        return 'Idle';
      case 'initializing':
        return 'Initializing...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return this.status;
    }
  }

  async ngOnInit() {
    await this.init();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  async init(): Promise<void> {
    // Initialize common resolutions
    this.resolutions = this.webcamService.createCommonResolutions();

    // Load initial data
    await this.initializeDemo();
  }

  // ====================
  // INITIALIZATION
  // ====================

  private async initializeDemo(): Promise<void> {
    try {
      this.isLoading = true;

      // Check permissions
      await this.checkPermissions();

      // Load devices if permission granted
      if (this.permissionStates.camera === 'granted') {
        await this.loadDevices();
      }
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // ====================
  // PERMISSION METHODS
  // ====================

  async checkPermissions(): Promise<void> {
    try {
      const result = await this.webcamService.checkPermissions();
      console.log('Permission check result:', result);
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      this.isLoading = true;
      const result = await this.webcamService.requestPermissions();
      console.log('Permission result:', result);

      // Load devices after getting permission
      if (result.camera === 'granted') {
        await this.loadDevices();
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    } finally {
      this.isLoading = false;
    }
  }

  needsPermissionRequest(): boolean {
    const needed = this.webcamService.needsPermissionRequest();
    console.log('Needs permission request:', needed);
    // Check if either camera or microphone permission is needed
    return needed.camera;
  }

  // ====================
  // DEVICE METHODS
  // ====================

  async loadDevices(): Promise<void> {
    try {
      this.devices = await this.webcamService.getVideoDevices();
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  }

  async onDeviceChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const deviceId = select.value;
    this.selectedDevice = this.devices.find((d) => d.deviceId === deviceId) || null;
    this.resolutionSupport = null;
    this.capabilities = null;
    if (!this.selectedDevice) return;

    // ตรวจสอบ permission ก่อน
    if (this.permissionStates.camera !== 'granted') {
      alert('Please grant camera permission first.');
      return;
    }

    // ป้องกัน stream ซ้อน
    this.stopWebcam();

    // โหลด capabilities และ resolutions
    await this.loadDeviceCapabilities();
  }

  async loadDeviceCapabilities(): Promise<void> {
    if (!this.selectedDevice) return;
    try {
      this.capabilities = await this.webcamService.getDeviceCapabilities(
        this.selectedDevice.deviceId
      );
      await this.testResolutions();
    } catch (error) {
      this.lastError = error as WebcamError;
      alert(
        'Failed to load device capabilities. Please make sure no other app is using the camera and permission is granted.'
      );
      console.error('Failed to load capabilities:', error);
    }
  }

  async testResolutions(): Promise<void> {
    if (!this.capabilities) {
      this.resolutionSupport = null;
      return;
    }
    try {
      this.resolutionSupport = this.webcamService.checkSupportedResolutions(
        [this.capabilities],
        this.resolutions
      );
    } catch (error) {
      this.lastError = error as WebcamError;
      alert('Resolution test failed');
      console.error('Resolution test failed:', error);
    }
  }

  // ====================
  // WEBCAM CONTROL
  // ====================

  async startWebcam(): Promise<void> {
    if (!this.selectedDevice) {
      alert('Please select a device first');
      return;
    }
    this.lastAction = this.startWebcam.bind(this);
    try {
      this.isLoading = true;

      // Setup configuration
      const config: WebcamConfiguration = {
        deviceInfo: this.selectedDevice,
        videoElement: this.videoElement.nativeElement,
        preferredResolutions: this.resolutions,
        enableMirror: true,
        debug: true
      };

      console.log('Starting webcam with config:', config);

      // Setup configuration
      this.webcamService.setupConfiguration(config);

      // Start webcam
      await this.webcamService.startWebcam();

      // Update current resolution
      this.updateCurrentResolution();
      this.lastError = null;
    } catch (error) {
      this.lastError = error as WebcamError;
      console.error('Failed to start webcam:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async startWebcamForIdCard(): Promise<void> {
    if (!this.selectedDevice) {
      alert('Please select a device first');
      return;
    }
    this.lastAction = this.startWebcamForIdCard.bind(this);
    try {
      this.isLoading = true;

      // Setup configuration
      const config: WebcamConfiguration = {
        deviceInfo: this.selectedDevice,
        videoElement: this.videoElement.nativeElement,
        preferredResolutions: [
          this.webcamService.createResolution('1920x1920', 1920, 1920),
          this.webcamService.createResolution('1440x1440', 1440, 1440),
          this.webcamService.createResolution('1080x1080', 1080, 1080)
        ],
        allowAnyResolution: false,
        enableMirror: true,
        debug: true
      };

      console.log('Starting webcam with config:', config);

      // Setup configuration
      this.webcamService.setupConfiguration(config);

      // Start webcam
      await this.webcamService.startWebcam();

      // Update current resolution
      this.updateCurrentResolution();
      this.lastError = null;
    } catch (error) {
      this.lastError = error as WebcamError;
      console.error('Failed to start webcam:', error);
    } finally {
      this.isLoading = false;
    }
  }

  stopWebcam(): void {
    this.webcamService.stopWebcam();
    this.currentResolution = null;
  }

  // ====================
  // ADVANCED CONTROLS
  // ====================

  async setZoom(level: number): Promise<void> {
    if (!this.webcamService.isZoomSupported()) {
      alert('Zoom not supported on this device');
      return;
    }

    try {
      await this.webcamService.setZoomLevel(level);
    } catch (error) {
      console.error('Zoom failed:', error);
    }
  }

  async toggleTorch(): Promise<void> {
    if (!this.webcamService.isTorchSupported()) {
      alert('Torch not supported on this device');
      return;
    }

    try {
      await this.webcamService.enableTorch(true);
    } catch (error) {
      console.error('Torch failed:', error);
    }
  }

  toggleMirror(): void {
    this.webcamService.toggleMirror();
  }

  // ====================
  // IMAGE CAPTURE
  // ====================

  captureImage(): void {
    try {
      const dataUrl = this.webcamService.captureImage({
        scale: 1.0,
        mediaType: 'image/jpeg',
        quality: 0.8
      });

      console.log('Captured image data URL:', dataUrl);
    } catch (error) {
      console.error('Capture failed:', error);
    }
  }

  // ====================
  // UTILITY METHODS
  // ====================

  private updateCurrentResolution(): void {
    this.currentResolution = this.webcamService.getCurrentResolution();
  }

  clearError(): void {
    this.webcamService.clearError();
  }

  retryLastAction(): void {
    if (this.lastAction) {
      this.lastAction();
    }
  }

  // ====================
  // HELPER PROPERTIES
  // ====================

  get isWebcamReady(): boolean {
    return this.status === 'ready';
  }

  get hasError(): boolean {
    return this.error !== null;
  }

  get hasPermission(): boolean {
    return this.permissionStates.camera === 'granted';
  }

  get permissionDenied(): boolean {
    return this.permissionStates.camera === 'denied';
  }
}
