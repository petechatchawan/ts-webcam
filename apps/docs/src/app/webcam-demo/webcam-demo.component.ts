import { CommonModule, JsonPipe } from '@angular/common';
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
  imports: [CommonModule, FormsModule, RouterModule, JsonPipe],
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

  // Image capture
  capturedImage: string | null = null;
  showImagePreview = false;

  // Video recording
  isRecording = false;
  recordedVideo: string | null = null;
  showVideoPreview = false;
  recordingDuration = 0;

  // Resolution testing
  resolutions: Resolution[] = [];
  resolutionSupport: ResolutionSupportInfo | null = null;
  capabilities: DeviceCapability | null = null;

  // Loading states
  isLoadingCapabilities = false;
  isLoadingResolutions = false;

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
      console.log('Requesting camera permissions...');
      const result = await this.webcamService.requestPermissions();
      console.log('Permission result:', result);

      // Load devices after getting permission
      if (result.camera === 'granted') {
        console.log('Camera permission granted, loading devices...');
        await this.loadDevices();

        // Auto-select first device if available
        if (this.devices.length > 0 && !this.selectedDevice) {
          this.selectedDevice = this.devices[0];
          console.log('Auto-selected first device:', this.selectedDevice);
          await this.loadDeviceCapabilities();

          // Auto-start camera after permission granted
          console.log('Permission granted, auto-starting camera...');
          setTimeout(() => {
            this.startWebcam();
          }, 500);
        }
      } else {
        console.log('Camera permission denied or not granted:', result.camera);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      this.lastError = error as WebcamError;
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
      console.log('Loading video devices...');
      this.devices = await this.webcamService.getVideoDevices();
      console.log('Video devices found:', this.devices);
    } catch (error) {
      console.error('Failed to load devices:', error);
      this.lastError = error as WebcamError;
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
    if (!this.selectedDevice) {
      console.log('No selected device for capabilities loading');
      return;
    }

    try {
      this.isLoadingCapabilities = true;
      console.log('Loading device capabilities for:', this.selectedDevice.deviceId);

      // Check if we have camera permission
      if (!this.hasPermission) {
        console.log('No camera permission, requesting...');
        await this.requestPermissions();
        if (!this.hasPermission) {
          throw new Error('Camera permission required to load capabilities');
        }
      }

      this.capabilities = await this.webcamService.getDeviceCapabilities(
        this.selectedDevice.deviceId
      );
      console.log('Device capabilities loaded:', this.capabilities);

      await this.testResolutions();
    } catch (error) {
      this.lastError = error as WebcamError;
      console.error('Failed to load capabilities:', error);

      // Create fallback capabilities based on common camera specs
      console.log('Creating fallback capabilities...');
      this.capabilities = {
        deviceId: this.selectedDevice.deviceId,
        maxWidth: 1920,
        maxHeight: 1080,
        minWidth: 320,
        minHeight: 240,
        hasZoom: false,
        hasTorch: false,
        hasFocus: false
      };

      console.log('Using fallback capabilities:', this.capabilities);
      await this.testResolutions();
    } finally {
      this.isLoadingCapabilities = false;
    }
  }

  async testResolutions(): Promise<void> {
    if (!this.capabilities) {
      console.log('No capabilities available for resolution testing');
      this.resolutionSupport = null;
      return;
    }

    try {
      this.isLoadingResolutions = true;
      console.log('Testing resolutions with capabilities:', this.capabilities);
      console.log('Available resolutions to test:', this.resolutions);

      this.resolutionSupport = this.webcamService.checkSupportedResolutions(
        [this.capabilities],
        this.resolutions
      );

      console.log('Resolution support result:', this.resolutionSupport);
    } catch (error) {
      this.lastError = error as WebcamError;
      console.error('Resolution test failed:', error);
      alert('Resolution test failed');
    } finally {
      this.isLoadingResolutions = false;
    }
  }

  // ====================
  // QUICK START METHODS
  // ====================

  async quickStart(): Promise<void> {
    try {
      console.log('Quick start initiated...');

      // Check if we have permissions
      if (!this.hasPermission) {
        console.log('No permission, requesting...');
        await this.requestPermissions();
        return; // requestPermissions will auto-start the camera
      }

      // Check if we have devices
      if (this.devices.length === 0) {
        console.log('No devices found, loading...');
        await this.loadDevices();
      }

      // Select first device if none selected
      if (!this.selectedDevice && this.devices.length > 0) {
        this.selectedDevice = this.devices[0];
        await this.loadDeviceCapabilities();
      }

      // Start the camera
      if (this.selectedDevice) {
        await this.startWebcam();
      } else {
        alert('No camera devices found. Please check your camera connection.');
      }
    } catch (error) {
      console.error('Quick start failed:', error);
      alert(`Failed to start camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    console.log('Starting webcam with device:', this.selectedDevice);
    this.lastAction = this.startWebcam.bind(this);

    try {
      this.isLoading = true;
      this.clearError();

      // Ensure we have permission
      if (!this.hasPermission) {
        console.log('Camera permission not granted, requesting...');
        await this.requestPermissions();
        if (!this.hasPermission) {
          throw new Error('Camera permission is required to start webcam');
        }
      }

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
      console.log('Webcam started successfully, status:', this.status);

      // Update current resolution
      this.updateCurrentResolution();

      // Load capabilities if not already loaded
      if (!this.capabilities) {
        console.log('Loading capabilities after webcam start...');
        await this.loadDeviceCapabilities();
      }

      this.lastError = null;
    } catch (error) {
      this.lastError = error as WebcamError;
      console.error('Failed to start webcam:', error);
      alert(`Failed to start webcam: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async captureImage(): Promise<void> {
    try {
      const imageDataUrl = this.webcamService.captureImage();
      this.capturedImage = imageDataUrl;
      this.showImagePreview = true;
    } catch (error) {
      console.error('Failed to capture image:', error);
    }
  }

  downloadImage(): void {
    if (!this.capturedImage) return;

    const link = document.createElement('a');
    link.href = this.capturedImage;
    link.download = `webcam-capture-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  retakePhoto(): void {
    this.capturedImage = null;
    this.showImagePreview = false;
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

  // ====================
  // DEBUG METHODS
  // ====================

  debugCameraState(): void {
    console.log('=== CAMERA DEBUG STATE ===');
    console.log('Status:', this.status);
    console.log('Permission States:', this.permissionStates);
    console.log('Selected Device:', this.selectedDevice);
    console.log('Available Devices:', this.devices);
    console.log('Current Resolution:', this.currentResolution);
    console.log('Last Error:', this.lastError);
    console.log('Video Element:', this.videoElement?.nativeElement);
    console.log('Video Element Source:', this.videoElement?.nativeElement?.srcObject);
    console.log('===========================');
  }
}
