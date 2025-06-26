import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  signal,
  effect
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Webcam, WebcamConfiguration, Resolution, DeviceCapability } from 'ts-webcam';

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

  // Core webcam instance
  private webcam = new Webcam();

  // Reactive signals
  status = signal<'idle' | 'initializing' | 'ready' | 'error'>('idle');
  devices = signal<MediaDeviceInfo[]>([]);
  selectedDevice = signal<MediaDeviceInfo | null>(null);
  permissionGranted = signal(false);
  error = signal<string | null>(null);
  currentResolution = signal<Resolution | null>(null);
  capabilities = signal<DeviceCapability | null>(null);
  isLoading = signal(false);
  selectedResolution = signal<Resolution | null>(null);

  // Available resolutions
  availableResolutions = signal<Resolution[]>([
    { name: 'QVGA', width: 320, height: 240 },
    { name: 'VGA', width: 640, height: 480 },
    { name: 'HD', width: 1280, height: 720 },
    { name: 'Full HD', width: 1920, height: 1080 },
    { name: '2K', width: 2560, height: 1440 },
    { name: '4K', width: 3840, height: 2160 }
  ]);

  // Computed properties
  hasDevices = signal(false);
  canStart = signal(false);

  constructor() {
    // Update computed signals when dependencies change
    effect(() => {
      this.hasDevices.set(this.devices().length > 0);
      this.canStart.set(
        this.permissionGranted() && 
        this.selectedDevice() !== null && 
        this.status() === 'idle'
      );
    });
  }

  async ngOnInit() {
    await this.checkPermissions();
    if (this.permissionGranted()) {
      await this.loadDevices();
      if (this.devices().length > 0) {
        this.selectedDevice.set(this.devices()[0]);
      }
    }
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  // ====================
  // PERMISSION METHODS
  // ====================

  async checkPermissions(): Promise<void> {
    try {
      const permissions = this.webcam.getPermissionStates();
      this.permissionGranted.set(permissions.camera === 'granted');
    } catch (error) {
      console.error('Failed to check permissions:', error);
      this.permissionGranted.set(false);
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const result = await this.webcam.requestPermissions();
      this.permissionGranted.set(result.camera === 'granted');
      
      if (result.camera === 'granted') {
        await this.loadDevices();
        if (this.devices().length > 0) {
          this.selectedDevice.set(this.devices()[0]);
        }
      } else {
        this.error.set('Camera permission denied');
      }
    } catch (error: any) {
      console.error('Permission request failed:', error);
      this.error.set(error.message || 'Failed to request permissions');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ====================
  // DEVICE METHODS
  // ====================

  async loadDevices(): Promise<void> {
    try {
      const videoDevices = await this.webcam.getVideoDevices();
      this.devices.set(videoDevices);
      console.log('Loaded devices:', videoDevices);
    } catch (error: any) {
      console.error('Failed to load devices:', error);
      this.error.set(error.message || 'Failed to load devices');
    }
  }

  async onDeviceChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const deviceId = select.value;
    const device = this.devices().find(d => d.deviceId === deviceId) || null;
    
    if (device) {
      this.selectedDevice.set(device);
      
      // Stop current stream if running
      if (this.status() === 'ready') {
        this.stopCamera();
      }
      
      // Load capabilities for new device
      await this.loadDeviceCapabilities();
    }
  }

  async onResolutionChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const [width, height] = select.value.split('x').map(Number);
    
    const resolution: Resolution = {
      name: 'Custom',
      width,
      height
    };
    
    this.selectedResolution.set(resolution);
    
    // If camera is running, restart with new resolution
    if (this.status() === 'ready') {
      console.log('Changing resolution to:', resolution);
      await this.restartWithResolution(resolution);
    }
  }

  async restartWithResolution(resolution: Resolution): Promise<void> {
    try {
      // Stop current stream
      this.stopCamera();
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Start with new resolution
      await this.startCameraWithResolution(resolution);
    } catch (error) {
      console.error('Failed to restart with resolution:', error);
      this.error.set('Failed to change resolution');
    }
  }

  async loadDeviceCapabilities(): Promise<void> {
    const device = this.selectedDevice();
    if (!device) return;

    try {
      this.isLoading.set(true);
      const caps = await this.webcam.getDeviceCapabilities(device.deviceId);
      this.capabilities.set(caps);
      console.log('Device capabilities:', caps);
    } catch (error: any) {
      console.error('Failed to load capabilities:', error);
      this.error.set(error.message || 'Failed to load device capabilities');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ====================
  // CAMERA CONTROL
  // ====================

  async startCamera(): Promise<void> {
    const resolution = this.selectedResolution();
    if (resolution) {
      await this.startCameraWithResolution(resolution);
    } else {
      await this.startCameraWithResolution(null);
    }
  }

  async startCameraWithResolution(resolution: Resolution | null): Promise<void> {
    const device = this.selectedDevice();
    if (!device) {
      this.error.set('Please select a camera device');
      return;
    }

    if (!this.videoElement?.nativeElement) {
      this.error.set('Video element not found');
      return;
    }

    try {
      this.status.set('initializing');
      this.error.set(null);

      // Configure webcam
      const config: WebcamConfiguration = {
        deviceInfo: device,
        videoElement: this.videoElement.nativeElement,
        enableMirror: true,
        debug: true,
        preferredResolutions: resolution ? [resolution] : undefined,
        onStart: () => {
          console.log('Webcam started successfully');
          this.status.set('ready');
          this.updateCurrentResolution();
        },
        onError: (error) => {
          console.error('Webcam error:', error);
          this.status.set('error');
          this.error.set(error.message || 'Camera error occurred');
        }
      };

      this.webcam.setupConfiguration(config);
      await this.webcam.start();

      console.log('Camera started, status:', this.status());
    } catch (error: any) {
      console.error('Failed to start camera:', error);
      this.status.set('error');
      this.error.set(error.message || 'Failed to start camera');
    }
  }

  stopCamera(): void {
    try {
      this.webcam.stop();
      this.status.set('idle');
      this.currentResolution.set(null);
      this.error.set(null);
      console.log('Camera stopped');
    } catch (error: any) {
      console.error('Failed to stop camera:', error);
    }
  }

  // ====================
  // UTILITY METHODS
  // ====================

  private updateCurrentResolution(): void {
    try {
      const resolution = this.webcam.getCurrentResolution();
      this.currentResolution.set(resolution);
      console.log('Current resolution:', resolution);
    } catch (error) {
      console.error('Failed to get current resolution:', error);
    }
  }

  async captureImage(): Promise<void> {
    try {
      const imageDataUrl = this.webcam.captureImage();
      
      // Download the image
      const link = document.createElement('a');
      link.href = imageDataUrl;
      link.download = `webcam-capture-${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Failed to capture image:', error);
      this.error.set(error.message || 'Failed to capture image');
    }
  }

  // ====================
  // DEBUG METHODS
  // ====================

  debugStatus(): void {
    console.log('=== WEBCAM DEBUG STATUS ===');
    console.log('Status:', this.status());
    console.log('Permission granted:', this.permissionGranted());
    console.log('Selected device:', this.selectedDevice());
    console.log('Available devices:', this.devices());
    console.log('Current resolution:', this.currentResolution());
    console.log('Error:', this.error());
    console.log('Webcam state:', this.webcam.getState());
    console.log('Video element:', this.videoElement?.nativeElement);
    console.log('========================');
  }

  clearError(): void {
    this.error.set(null);
  }
}
