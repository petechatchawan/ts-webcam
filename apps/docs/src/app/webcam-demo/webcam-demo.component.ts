import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DeviceCapability, PermissionRequestOptions, Resolution, TsWebcamState, WebcamConfiguration } from 'ts-webcam';
import { WebcamService } from './webcam.service';

interface UiState {
  isLoading: boolean;
  isReady: boolean;
  isError: boolean;
  canStart: boolean;
  canStop: boolean;
  canCapture: boolean;
  canSwitchDevice: boolean;
  canSwitchResolution: boolean;
}

@Component({
  selector: 'app-webcam-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './webcam-demo.component.html',
  styleUrls: ['./webcam-demo.component.css']
})
export class WebcamDemoComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false })
  videoElementRef!: ElementRef<HTMLVideoElement>;

  // Static data
  readonly resolutions: Resolution[] = [
    { name: 'HD', width: 1280, height: 720 },
    { name: 'Full HD', width: 1920, height: 1080 },
    { name: 'VGA', width: 640, height: 480 },
    { name: 'SQUARE-720', width: 720, height: 720 },
    { name: '4K', width: 3840, height: 2160 }
  ];

  // Reactive state using signals
  readonly permissionOptions = signal<PermissionRequestOptions>({ video: true, audio: false });
  readonly selectedDeviceId = signal<string | null>(null);
  readonly selectedResolution = signal<Resolution>(this.resolutions[0]);
  readonly enableMirror = signal<boolean>(true);
  readonly enableAudio = signal<boolean>(false);
  readonly capturedImageUrl = signal<string | null>(null);
  readonly isLoadingCapabilities = signal<boolean>(false);
  readonly showAdvancedOptions = signal<boolean>(false);
  readonly torchEnabled = signal<boolean>(false);
  readonly hasTorch = signal<boolean>(false);
  readonly videoReady = signal<boolean>(false);

  // Store event listeners for cleanup
  private videoEventListeners: { [key: string]: () => void } = {};

  // Reactive computed properties
  readonly currentConfig = computed(() => {
    const deviceInfo = this.devices().find((d: MediaDeviceInfo) => d.deviceId === this.selectedDeviceId());
    if (!deviceInfo || !this.videoElementRef?.nativeElement) return null;

    return {
      deviceInfo,
      preferredResolutions: this.selectedResolution(),
      videoElement: this.videoElementRef.nativeElement,
      enableMirror: this.enableMirror(),
      enableAudio: this.enableAudio(),
      debug: true
    } as WebcamConfiguration;
  });

  // Reactive state from service
  readonly devices = signal<MediaDeviceInfo[]>([]);
  readonly webcamState = signal<TsWebcamState | null>(null);
  readonly permissionChecked = signal<boolean>(false);
  readonly deviceCapabilities = signal<DeviceCapability | null>(null);

  // Computed properties from webcam state
  readonly error = computed(() => this.webcamState()?.error?.message || null);
  readonly status = computed(() => this.webcamState()?.status || 'idle');
  readonly permissions = computed(() => this.webcamState()?.permissions || {});

  // UI State computed from service data
  readonly uiState = computed<UiState>(() => {
    const currentStatus = this.status();
    const isLoading = currentStatus === 'initializing';
    const isReady = currentStatus === 'ready';
    const isError = currentStatus === 'error';
    const hasSelectedDevice = !!this.selectedDeviceId();
    const hasVideoElement = !!this.videoElementRef?.nativeElement;
    const isPermissionGranted = this.permissionChecked() && !this.isPermissionDenied();

    return {
      isLoading,
      isReady,
      isError,
      canStart: isPermissionGranted && hasSelectedDevice && hasVideoElement && !isLoading && !isReady,
      canStop: isReady,
      canCapture: isReady,
      canSwitchDevice: hasSelectedDevice && !isLoading,
      canSwitchResolution: hasSelectedDevice && !isLoading
    };
  });

  private destroy$ = new Subject<void>();

  constructor(public webcamService: WebcamService) {
    // Auto-select first device when devices change
    effect(() => {
      const devices = this.devices();
      if (devices.length > 0 && !this.selectedDeviceId()) {
        this.selectedDeviceId.set(devices[0].deviceId);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Subscribe to unified state from service
    this.webcamService.getState().pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('Webcam state changed:', state); // Debug log
        this.webcamState.set(state);

        // Reset video ready state when status changes to non-ready states
        if (state.status !== 'ready') {
          this.videoReady.set(false);

          // Also clear video source if status is idle or error
          if (state.status === 'idle' || state.status === 'error') {
            const videoElement = this.videoElementRef?.nativeElement;
            if (videoElement) {
              videoElement.srcObject = null;
            }
          }
        }
      });

    // Subscribe to devices from service
    this.webcamService.getDevices().pipe(takeUntil(this.destroy$))
      .subscribe(devices => this.devices.set(devices));

    // Subscribe to permission checked status
    this.webcamService.getPermissionChecked().pipe(takeUntil(this.destroy$))
      .subscribe(checked => this.permissionChecked.set(checked));

    // Subscribe to device capabilities
    this.webcamService.getDeviceCapabilities().pipe(takeUntil(this.destroy$))
      .subscribe(caps => this.deviceCapabilities.set(caps));

    // Initial permission/device check
    this.requestPermissionsAndLoadDevices();
  }

  // Permission methods
  async requestPermissionsAndLoadDevices() {
    await this.webcamService.requestPermissionsAndLoadDevices(this.permissionOptions());
  }

  isPermissionDenied(): boolean {
    return this.webcamService.isPermissionDenied();
  }

  // Camera control methods
  async startCamera() {
    const config = this.currentConfig();
    if (!config) {
      console.error('Configuration is invalid, please check settings');
      return;
    }

    await this.webcamService.startCamera(config);

    // Check torch support and set video ready state
    setTimeout(() => {
      this.checkTorchSupport();
      this.checkVideoReady();
    }, 100);
  }

  stopCamera() {
    console.log('stopCamera() called'); // Debug log
    this.webcamService.stopCamera();

    // Reset torch state and video ready state when stopping camera
    this.hasTorch.set(false);
    this.torchEnabled.set(false);
    this.videoReady.set(false);

    // Clear video source and clean up event listeners
    const videoElement = this.videoElementRef?.nativeElement;
    if (videoElement) {
      // Clear the video source
      videoElement.srcObject = null;

      // Clean up video event listeners using stored references
      Object.keys(this.videoEventListeners).forEach(eventName => {
        videoElement.removeEventListener(eventName, this.videoEventListeners[eventName]);
      });
      this.videoEventListeners = {};
    }
  }

  async switchDevice() {
    if (!this.uiState().canSwitchDevice) return;

    this.stopCamera();
    await this.startCamera();
  }

  async switchResolution() {
    if (!this.uiState().canSwitchResolution) return;

    this.stopCamera();
    await this.startCamera();
  }

  // Capture method
  async capture() {
    if (!this.uiState().canCapture) return;

    try {
      const blob = await this.webcamService.capture();
      const url = URL.createObjectURL(blob);
      this.capturedImageUrl.set(url);
    } catch (error) {
      console.error('Capture failed:', error);
    }
  }

  // Device capabilities
  async testDeviceCapabilities() {
    const deviceId = this.selectedDeviceId();
    if (!deviceId) return;

    this.isLoadingCapabilities.set(true);
    try {
      await this.webcamService.testDeviceCapabilities(deviceId);
    } finally {
      this.isLoadingCapabilities.set(false);
    }
  }

  // Advanced options toggle
  toggleAdvancedOptions() {
    this.showAdvancedOptions.set(!this.showAdvancedOptions());
  }

  // Permission options methods
  updatePermissionOptions(options: Partial<PermissionRequestOptions>) {
    this.permissionOptions.set({ ...this.permissionOptions(), ...options });
  }

  // Helper methods for event handling with proper type casting
  onVideoPermissionChange(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.updatePermissionOptions({ video: checked });
  }

  onAudioPermissionChange(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.updatePermissionOptions({ audio: checked });
  }

  onDeviceChange(event: Event) {
    const value = (event.target as HTMLSelectElement)?.value ?? '';
    this.selectedDeviceId.set(value);
    // Only auto-switch if camera is already running
    if (this.uiState().isReady) {
      this.switchDevice();
    }
  }

  onResolutionChange(event: Event) {
    const value = (event.target as HTMLSelectElement)?.value ?? '0';
    const index = parseInt(value, 10);
    if (index >= 0 && index < this.resolutions.length) {
      this.selectedResolution.set(this.resolutions[index]);
      // Only auto-switch if camera is already running
      if (this.uiState().isReady) {
        this.switchResolution();
      }
    }
  }

  onMirrorChange(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.enableMirror.set(checked);
  }

  onAudioChange(event: Event) {
    const checked = (event.target as HTMLInputElement)?.checked ?? false;
    this.enableAudio.set(checked);
  }

  // Torch control
  async toggleTorch() {
    if (!this.hasTorch()) return;

    try {
      const stream = this.videoElementRef?.nativeElement?.srcObject as MediaStream;
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track && 'torch' in track.getCapabilities()) {
          const currentTorch = this.torchEnabled();
          const constraints = {
            advanced: [{ torch: !currentTorch }]
          };
          await track.applyConstraints(constraints as MediaTrackConstraints);
          this.torchEnabled.set(!currentTorch);
        }
      }
    } catch (error) {
      console.error('Failed to toggle torch:', error);
    }
  }

  // Check if device supports torch
  private checkTorchSupport() {
    const stream = this.videoElementRef?.nativeElement?.srcObject as MediaStream;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities();
        this.hasTorch.set('torch' in capabilities);
      }
    }
  }

  // Check if video is ready and playing
  private checkVideoReady() {
    const videoElement = this.videoElementRef?.nativeElement;
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject as MediaStream;
      const isActive = stream.active && stream.getVideoTracks().length > 0;
      this.videoReady.set(isActive);

      // Clean up previous event listeners
      Object.keys(this.videoEventListeners).forEach(eventName => {
        videoElement.removeEventListener(eventName, this.videoEventListeners[eventName]);
      });

      // Create new event listener function
      const updateVideoReady = () => {
        const hasStream = !!(videoElement.srcObject);
        const streamActive = hasStream && (videoElement.srcObject as MediaStream).active;
        const isPlaying = !videoElement.paused && !videoElement.ended;
        const hasActiveTracks = hasStream && (videoElement.srcObject as MediaStream).getVideoTracks().length > 0;

        this.videoReady.set(hasStream && streamActive && isPlaying && hasActiveTracks);
      };

      // Store event listeners for proper cleanup
      this.videoEventListeners = {
        'loadedmetadata': updateVideoReady,
        'play': updateVideoReady,
        'pause': updateVideoReady,
        'ended': updateVideoReady
      };

      // Add event listeners
      Object.keys(this.videoEventListeners).forEach(eventName => {
        videoElement.addEventListener(eventName, this.videoEventListeners[eventName]);
      });
    } else {
      // No video source, definitely not ready
      this.videoReady.set(false);
    }
  }

  // Cleanup captured image URL
  clearCapturedImage() {
    const url = this.capturedImageUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.capturedImageUrl.set(null);
    }
  }

  // Helper methods for device info display
  getCurrentCameraName(): string {
    const selectedId = this.selectedDeviceId();
    if (!selectedId) return 'No camera selected';

    const device = this.devices().find(d => d.deviceId === selectedId);
    if (!device) return 'Unknown camera';

    return device.label || `Camera (${device.deviceId.slice(0, 8)}...)`;
  }

  getDeviceType(): string {
    // Detect device type based on user agent
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'iOS';
    if (/mac/.test(userAgent)) return 'macOS';
    if (/win/.test(userAgent)) return 'Windows';
    if (/linux/.test(userAgent)) return 'Linux';
    return 'Desktop';
  }

  getStatusText(): string {
    const currentStatus = this.status();
    switch (currentStatus) {
      case 'ready': return 'Active';
      case 'initializing': return 'Starting...';
      case 'error': return 'Error';
      case 'idle': return 'Inactive';
      default: return 'Unknown';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearCapturedImage();

    // Clean up video event listeners
    const videoElement = this.videoElementRef?.nativeElement;
    if (videoElement) {
      Object.keys(this.videoEventListeners).forEach(eventName => {
        videoElement.removeEventListener(eventName, this.videoEventListeners[eventName]);
      });
    }

    this.webcamService.dispose();
  }
}
