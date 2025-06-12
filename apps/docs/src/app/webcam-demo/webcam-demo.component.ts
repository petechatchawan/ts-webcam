import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DeviceCapability,
  DeviceInfo,
  PermissionStates,
  Resolution,
  ResolutionSupportInfo,
  WebcamConfiguration,
  WebcamError
} from 'ts-webcam';
import { WebcamService } from '../services/webcam.service';

@Component({
  selector: 'app-webcam-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './webcam-demo.component.html',
  styleUrls: ['./webcam-demo.component.css']
})
export class WebcamDemoComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false })
  private readonly videoElement!: ElementRef<HTMLVideoElement>;

  // Signals for reactive state management
  devices = signal<DeviceInfo[]>([]);
  selectedDevice = signal<DeviceInfo | null>(null);
  isLoading = signal(true);
  currentResolution = signal<Resolution | null>(null);
  capturedImage = signal<string | null>(null);
  showImagePreview = signal(false);
  resolutions = signal<Resolution[]>([]);
  resolutionSupport = signal<ResolutionSupportInfo | null>(null);
  capabilities = signal<DeviceCapability | null>(null);
  isLoadingCapabilities = signal(false);
  isLoadingResolutions = signal(false);
  lastError = signal<WebcamError | null>(null);
  currentTab = signal<'camera' | 'testing'>('camera');

  // Permission states as signal instead of computed
  permissionStates = signal<PermissionStates>({ camera: 'prompt', microphone: 'prompt' });

  // Computed properties
  status = computed(() => this.webcamService.status);
  error = computed(() => this.webcamService.lastError);
  isWebcamReady = computed(() => this.status() === 'ready');
  hasError = computed(() => this.error() !== null);
  hasPermission = computed(() => this.permissionStates().camera === 'granted');
  permissionDenied = computed(() => this.permissionStates().camera === 'denied');
  closeImagePreview = () => {
    this.showImagePreview.set(false);
    this.capturedImage.set(null);
  };

  statusText = computed(() => {
    switch (this.status()) {
      case 'idle':
        return 'Idle';
      case 'initializing':
        return 'Initializing...';
      case 'ready':
        return 'Ready';
      case 'error':
        return 'Error';
      default:
        return this.status();
    }
  });

  // Computed properties for resolution support filtering
  supportedResolutions = computed(() => {
    const support = this.resolutionSupport();
    return support?.resolutions?.filter((r) => r.supported) || [];
  });

  unsupportedResolutions = computed(() => {
    const support = this.resolutionSupport();
    return support?.resolutions?.filter((r) => !r.supported) || [];
  });

  supportedResolutionsCount = computed(() => this.supportedResolutions().length);
  unsupportedResolutionsCount = computed(() => this.unsupportedResolutions().length);
  totalResolutionsCount = computed(() => {
    const support = this.resolutionSupport();
    return support?.resolutions?.length || 0;
  });

  constructor(private readonly webcamService: WebcamService) {}

  async ngOnInit() {
    await this.init();
  }

  ngOnDestroy(): void {
    this.stopWebcam();
  }

  async init(): Promise<void> {
    // Initialize common resolutions
    this.resolutions.set(this.webcamService.createCommonResolutions());

    // ตรวจสอบ permission ที่มีอยู่แล้ว
    console.log('Checking initial permissions...');
    await this.checkPermissions();

    // ถ้ามี permission แล้ว ให้โหลด devices
    if (this.hasPermission()) {
      console.log('Permission already granted, loading devices...');
      await this.loadDevices();

      // เลือก device แรกถ้ายังไม่มีการเลือก
      if (this.devices().length > 0 && !this.selectedDevice()) {
        this.selectedDevice.set(this.devices()[0]);
        console.log('Auto-selected device in init:', this.selectedDevice());
      }
    }

    this.isLoading.set(false);
  }

  // ====================
  // PERMISSION METHODS
  // ====================

  async checkPermissions(): Promise<void> {
    try {
      console.log('Checking permissions...');
      const result = await this.webcamService.checkPermissions();
      this.permissionStates.set(result);
      console.log('Permission check result:', result);
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      this.isLoading.set(true);
      console.log('Requesting camera permissions...');

      const result = await this.webcamService.requestPermissions();

      // อัปเดต permission states signal
      this.permissionStates.set(result);
      console.log('Permission result:', result);

      // หลังจาก request permission แล้ว ให้ check permission อีกครั้งเพื่อให้แน่ใจ
      await this.checkPermissions();

      // Load devices after getting permission
      if (this.hasPermission()) {
        console.log('Camera permission granted, loading devices...');
        await this.loadDevices();
        console.log('Devices loaded:', this.devices());

        // Auto-select first device if available
        if (this.devices().length > 0 && !this.selectedDevice()) {
          this.selectedDevice.set(this.devices()[0]);
          console.log('Auto-selected first device:', this.selectedDevice());

          // Load capabilities แล้วค่อย start camera
          await this.loadDeviceCapabilities();

          // Auto-start camera after permission granted
          console.log('Permission granted, auto-starting camera...');
          try {
            await this.startWebcam();
            console.log('Auto-start webcam completed. Status:', this.status());
          } catch (startError) {
            console.error('Auto-start webcam failed:', startError);
            this.lastError.set(startError as WebcamError);
            // แสดง error ให้ user ทราบ
            alert(
              `Failed to start camera automatically: ${
                startError instanceof Error ? startError.message : 'Unknown error'
              }`
            );
          }
        } else if (this.devices().length === 0) {
          console.log('No devices found after permission granted');
          alert('No camera devices found. Please check your camera connection.');
        }
      } else {
        console.log('Camera permission denied or not granted:', this.permissionStates().camera);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      this.lastError.set(error as WebcamError);
    } finally {
      this.isLoading.set(false);
    }
  }

  needsPermissionRequest(): boolean {
    const permissionState = this.permissionStates().camera;
    // ใช้ service method แทนการเช็คเอง
    return this.webcamService.needsPermissionRequest().camera;
  }

  hasPermissionDenied(): boolean {
    return this.webcamService.hasPermissionDenied();
  }

  // ====================
  // DEVICE METHODS
  // ====================

  async loadDevices(): Promise<void> {
    try {
      console.log('Loading video devices...');
      const devices = await this.webcamService.getVideoDevices();
      this.devices.set(devices);
      console.log('Video devices found:', devices);
    } catch (error) {
      console.error('Failed to load devices:', error);
      this.lastError.set(error as WebcamError);
    }
  }

  async onDeviceChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const deviceId = select.value;
    const device = this.devices().find((d) => d.deviceId === deviceId) || null;
    this.selectedDevice.set(device);
    this.resolutionSupport.set(null);
    this.capabilities.set(null);
    if (!device) return;

    // ตรวจสอบ permission ก่อน
    if (this.permissionStates().camera !== 'granted') {
      alert('Please grant camera permission first.');
      return;
    }

    // ป้องกัน stream ซ้อน
    this.stopWebcam();

    // โหลด capabilities และ resolutions
    await this.loadDeviceCapabilities();
  }

  async loadDeviceCapabilities(): Promise<void> {
    const selectedDevice = this.selectedDevice();
    if (!selectedDevice) {
      console.log('No selected device for capabilities loading');
      return;
    }

    try {
      this.isLoadingCapabilities.set(true);
      console.log('Loading device capabilities for:', selectedDevice.deviceId);
      console.log('Current permission state:', this.permissionStates());

      // Check if we have camera permission
      if (!this.hasPermission()) {
        console.log('No camera permission, requesting...');
        const permissionResult = await this.webcamService.requestPermissions();

        // ใช้ผลลัพธ์จาก requestPermissions โดยตรง
        if (permissionResult.camera !== 'granted') {
          console.log('Permission denied. Result:', permissionResult);
          throw new Error('Camera permission required to load capabilities');
        }

        console.log('Permission granted successfully');
      }

      const capabilities = await this.webcamService.getDeviceCapabilities(selectedDevice.deviceId);
      this.capabilities.set(capabilities);
      console.log('Device capabilities loaded:', capabilities);

      await this.testResolutions();
    } catch (error) {
      this.lastError.set(error as WebcamError);
      console.error('Failed to load capabilities:', error);

      // Create fallback capabilities based on common camera specs
      console.log('Creating fallback capabilities...');
      const fallbackCapabilities = {
        deviceId: selectedDevice.deviceId,
        maxWidth: 1920,
        maxHeight: 1080,
        minWidth: 320,
        minHeight: 240,
        hasZoom: false,
        hasTorch: false,
        hasFocus: false
      };

      this.capabilities.set(fallbackCapabilities);
      console.log('Using fallback capabilities:', fallbackCapabilities);
      await this.testResolutions();
    } finally {
      this.isLoadingCapabilities.set(false);
    }
  }

  async testResolutions(): Promise<void> {
    const capabilities = this.capabilities();
    if (!capabilities) {
      console.log('No capabilities available for resolution testing');
      this.resolutionSupport.set(null);
      return;
    }

    try {
      this.isLoadingResolutions.set(true);
      console.log('Testing resolutions with capabilities:', capabilities);
      console.log('Available resolutions to test:', this.resolutions());

      const support = this.webcamService.checkSupportedResolutions(
        [capabilities],
        this.resolutions()
      );
      this.resolutionSupport.set(support);

      console.log('Resolution support result:', support);
    } catch (error) {
      this.lastError.set(error as WebcamError);
      console.error('Resolution test failed:', error);
      alert('Resolution test failed');
    } finally {
      this.isLoadingResolutions.set(false);
    }
  }

  // ====================
  // QUICK START METHODS
  // ====================

  async quickStart(): Promise<void> {
    try {
      console.log('Quick start initiated...');

      // Check if we have permissions
      if (!this.hasPermission()) {
        console.log('No permission, requesting...');
        await this.requestPermissions();
        return; // requestPermissions will auto-start the camera
      }

      // Check if we have devices
      if (this.devices().length === 0) {
        console.log('No devices found, loading...');
        await this.loadDevices();
      }

      // Select first device if none selected
      if (!this.selectedDevice() && this.devices().length > 0) {
        this.selectedDevice.set(this.devices()[0]);
        await this.loadDeviceCapabilities();
      }

      // Start the camera
      if (this.selectedDevice()) {
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
    const selectedDevice = this.selectedDevice();
    if (!selectedDevice) {
      console.log('No selected device, available devices:', this.devices());
      alert('Please select a device first');
      return;
    }

    console.log('=== STARTING WEBCAM ===');
    console.log('Selected device:', selectedDevice);
    console.log('Current status before start:', this.status());
    console.log('Has permission:', this.hasPermission());
    console.log('Permission states:', this.permissionStates());

    try {
      this.isLoading.set(true);
      this.clearError();

      // Ensure we have permission
      if (!this.hasPermission()) {
        console.log('Camera permission not granted, requesting...');
        const permissionResult = await this.webcamService.requestPermissions();
        if (permissionResult.camera !== 'granted') {
          throw new Error('Camera permission is required to start webcam');
        }
      }

      // Check if video element is available
      if (!this.videoElement?.nativeElement) {
        console.log('Video element not available, waiting...');
        // Wait a bit for the DOM to update
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!this.videoElement?.nativeElement) {
          throw new Error(
            'Video element not found. Please ensure the camera interface is visible.'
          );
        }
      }

      // Setup configuration
      const config: WebcamConfiguration = {
        deviceInfo: selectedDevice,
        videoElement: this.videoElement.nativeElement,
        preferredResolutions: this.resolutions(),
        enableMirror: true,
        debug: true
      };

      console.log('Starting webcam with config:', config);
      console.log('Video element:', this.videoElement.nativeElement);

      // Setup configuration
      this.webcamService.setupConfiguration(config);

      // Start webcam
      console.log('Calling webcamService.startWebcam()...');
      await this.webcamService.startWebcam();
      console.log('webcamService.startWebcam() completed');
      console.log('New status after start:', this.status());

      // Update current resolution
      this.updateCurrentResolution();

      // Load capabilities if not already loaded
      if (!this.capabilities()) {
        console.log('Loading capabilities after webcam start...');
        await this.loadDeviceCapabilities();
      }

      this.lastError.set(null);
      console.log('=== WEBCAM START COMPLETED ===');
    } catch (error) {
      console.log('=== WEBCAM START FAILED ===');
      this.lastError.set(error as WebcamError);
      console.error('Failed to start webcam:', error);
      alert(`Failed to start webcam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  stopWebcam(): void {
    this.webcamService.stopWebcam();
    this.currentResolution.set(null);
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
      this.capturedImage.set(imageDataUrl);
      this.showImagePreview.set(true);
    } catch (error) {
      console.error('Failed to capture image:', error);
    }
  }

  downloadImage(): void {
    const capturedImage = this.capturedImage();
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `webcam-capture-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  retakePhoto(): void {
    this.capturedImage.set(null);
    this.showImagePreview.set(false);
  }

  // ====================
  // UI CONTROL METHODS (for template)
  // ====================

  async startCamera(): Promise<void> {
    await this.startWebcam();
  }

  stopCamera(): void {
    this.stopWebcam();
  }

  async takeScreenshot(): Promise<void> {
    await this.captureImage();
  }

  async selectDevice(event: Event): Promise<void> {
    await this.onDeviceChange(event);
  }

  async changeResolution(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const [width, height] = select.value.split('x').map(Number);

    if (this.status() === 'ready') {
      // Stop current stream
      this.stopWebcam();

      // Start with new resolution
      const device = this.selectedDevice();
      if (device) {
        const config: WebcamConfiguration = {
          deviceInfo: device,
          preferredResolutions: { name: 'custom', width, height }
        };

        this.webcamService.setupConfiguration(config);
        await this.webcamService.startWebcam();
        this.updateCurrentResolution();
      }
    }
  }

  async testDevice(device: DeviceInfo): Promise<void> {
    this.selectedDevice.set(device);
    await this.loadDeviceCapabilities();
  }

  async refreshDevices(): Promise<void> {
    await this.loadDevices();
  }

  async testAllResolutions(): Promise<void> {
    await this.testResolutions();
  }

  // Computed property for current settings
  currentSettings = computed(() => {
    const resolution = this.currentResolution();
    if (!resolution) return null;

    return {
      video: {
        width: resolution.width,
        height: resolution.height,
        frameRate: 30 // Default frame rate
      }
    };
  });

  // ====================
  // EXISTING METHODS
  // ====================

  private updateCurrentResolution(): void {
    const resolution = this.webcamService.getCurrentResolution();
    this.currentResolution.set(resolution);
  }

  clearError(): void {
    this.webcamService.clearError();
  }

  setTab(tab: 'camera' | 'testing'): void {
    this.currentTab.set(tab);
  }

  // ====================
  // DEBUG METHODS
  // ====================

  debugCameraState(): void {
    console.log('=== CAMERA DEBUG STATE ===');
    console.log('Status:', this.status());
    console.log('Permission States:', this.permissionStates());
    console.log('Selected Device:', this.selectedDevice());
    console.log('Available Devices:', this.devices());
    console.log('Current Resolution:', this.currentResolution());
    console.log('Last Error:', this.lastError());
    console.log('Video Element:', this.videoElement?.nativeElement);
    console.log('Video Element Source:', this.videoElement?.nativeElement?.srcObject);
    console.log('===========================');
  }
}
