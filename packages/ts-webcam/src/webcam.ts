import {
  CaptureOptions,
  DeviceCapability,
  DeviceInfo,
  PermissionStates,
  PermissionStatus,
  Resolution,
  ResolutionSupportInfo,
  WebcamConfiguration,
  WebcamError,
  WebcamErrorCode,
  WebcamState,
  WebcamStatus
} from './types';

/**
 * Simple webcam implementation matching the original npm package API exactly
 */
export class Webcam {
  private state: WebcamState;
  private configuration: WebcamConfiguration | null = null;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private currentDeviceId: string | null = null;
  private devices: DeviceInfo[] = [];
  private changeListenerActive = false;

  constructor() {
    this.state = {
      status: 'idle',
      deviceCapabilities: null,
      lastError: null,
      permissionStates: {
        camera: 'prompt',
        microphone: 'prompt'
      }
    };
  }

  // ====================
  // DEVICE MANAGEMENT
  // ====================

  /**
   * Get available video devices
   */
  async getVideoDevices(): Promise<DeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label
        }));
      this.devices = videoDevices;
      return videoDevices;
    } catch (error) {
      const webcamError = this.createError(
        WebcamErrorCode.DEVICES_ERROR,
        'Failed to get video devices',
        error
      );
      this.state.lastError = webcamError;
      throw webcamError;
    }
  }

  /**
   * Get available audio input devices
   */
  async getAudioInputDevices(): Promise<DeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label
        }));
    } catch (error) {
      throw this.createError(
        WebcamErrorCode.DEVICES_ERROR,
        'Failed to get audio input devices',
        error
      );
    }
  }

  /**
   * Get available audio output devices
   */
  async getAudioOutputDevices(): Promise<DeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device) => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label
        }));
    } catch (error) {
      throw this.createError(
        WebcamErrorCode.DEVICES_ERROR,
        'Failed to get audio output devices',
        error
      );
    }
  }

  /**
   * Get all available devices
   */
  async getAllDevices(): Promise<DeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.map((device) => ({
        deviceId: device.deviceId,
        groupId: device.groupId,
        kind: device.kind,
        label: device.label
      }));
    } catch (error) {
      throw this.createError(WebcamErrorCode.DEVICES_ERROR, 'Failed to get all devices', error);
    }
  }

  /**
   * Get current active device
   */
  getCurrentDevice(): DeviceInfo | null {
    if (!this.currentDeviceId) return null;
    return this.devices.find((device) => device.deviceId === this.currentDeviceId) || null;
  }

  /**
   * Refresh device list
   */
  async refreshDevices(): Promise<void> {
    await this.getVideoDevices();
  }

  /**
   * Setup device change listeners
   */
  setupChangeListeners(): void {
    if (this.changeListenerActive) return;

    navigator.mediaDevices.addEventListener('devicechange', this.handleDeviceChange.bind(this));
    this.changeListenerActive = true;
    this.refreshDevices();
  }

  /**
   * Stop device change listeners
   */
  stopChangeListeners(): void {
    if (!this.changeListenerActive) return;

    navigator.mediaDevices.removeEventListener('devicechange', this.handleDeviceChange.bind(this));
    this.changeListenerActive = false;
  }

  private handleDeviceChange(): void {
    this.refreshDevices();
    if (this.configuration?.onError) {
      // Check if current device is still available
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const currentDeviceExists = devices.some(
          (device) => device.deviceId === this.currentDeviceId
        );
        if (!currentDeviceExists && this.stream) {
          this.stop();
          const error = this.createError(
            WebcamErrorCode.DEVICE_NOT_FOUND,
            'Current device was disconnected'
          );
          this.configuration!.onError!(error);
        }
      });
    }
  }

  // ====================
  // PERMISSION MANAGEMENT
  // ====================

  /**
   * Check if permission request is needed
   */
  needsPermissionRequest(): { camera: boolean; microphone: boolean } {
    return {
      camera: this.state.permissionStates.camera === 'prompt',
      microphone: this.state.permissionStates.microphone === 'prompt'
    };
  }

  /**
   * Check camera permission status
   */
  async checkCameraPermission(): Promise<PermissionStatus> {
    try {
      if (!navigator.permissions) {
        return 'prompt';
      }
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const status = permission.state as PermissionStatus;
      this.state.permissionStates.camera = status;
      return status;
    } catch (error) {
      return 'prompt';
    }
  }

  /**
   * Check microphone permission status
   */
  async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      if (!navigator.permissions) {
        return 'prompt';
      }
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName
      });
      const status = permission.state as PermissionStatus;
      this.state.permissionStates.microphone = status;
      return status;
    } catch (error) {
      return 'prompt';
    }
  }

  /**
   * Get current permission states
   */
  getPermissionStates(): PermissionStates {
    return { ...this.state.permissionStates };
  }

  /**
   * Request permissions for camera and microphone
   */
  async requestPermissions(): Promise<PermissionStates> {
    try {
      const constraints: MediaStreamConstraints = {
        video: true,
        audio: this.configuration?.enableAudio || false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update permission states
      this.state.permissionStates.camera = 'granted';
      if (constraints.audio) {
        this.state.permissionStates.microphone = 'granted';
      }

      // Stop the temporary stream
      stream.getTracks().forEach((track) => track.stop());

      return { ...this.state.permissionStates };
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        this.state.permissionStates.camera = 'denied';
        throw this.createError(
          WebcamErrorCode.PERMISSION_DENIED,
          'User denied camera access',
          error
        );
      }
      throw this.createError(
        WebcamErrorCode.PERMISSION_DENIED,
        'Failed to request permissions',
        error
      );
    }
  }

  /**
   * Check if permissions were denied
   */
  hasPermissionDenied(): boolean {
    return (
      this.state.permissionStates.camera === 'denied' ||
      this.state.permissionStates.microphone === 'denied'
    );
  }

  // ====================
  // CONFIGURATION & CONTROL
  // ====================

  /**
   * Setup webcam configuration
   */
  setupConfiguration(config: WebcamConfiguration): void {
    this.configuration = { ...config };

    if (config.debug) {
      console.log('[Webcam] Configuration setup:', config);
    }
  }

  /**
   * Start the webcam
   */
  async start(): Promise<void> {
    if (!this.configuration) {
      throw this.createError(WebcamErrorCode.INVALID_CONFIG, 'Webcam is not properly initialized');
    }

    this.state.status = 'initializing';

    try {
      const allowAny = this.configuration.allowAnyResolution !== false;
      const preferred = this.configuration.preferredResolutions;
      let constraints: MediaStreamConstraints | null = null;

      if (!preferred) {
        if (allowAny) {
          constraints = this.buildConstraints();
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
          this.currentDeviceId = this.configuration.deviceInfo.deviceId;
        } else {
          throw this.createError(
            WebcamErrorCode.INVALID_CONFIG,
            'No preferredResolutions specified and allowAnyResolution is false'
          );
        }
      } else {
        const resolutions = Array.isArray(preferred) ? preferred : [preferred];
        let lastError: any = null;
        for (const res of resolutions) {
          try {
            const testConstraints = this.buildConstraints();
            const baseVideo =
              typeof testConstraints.video === 'object' && testConstraints.video !== null
                ? testConstraints.video
                : {};
            testConstraints.video = {
              ...baseVideo,
              width: { exact: res.width },
              height: { exact: res.height }
            };
            const testStream = await navigator.mediaDevices.getUserMedia(testConstraints);
            // ตรวจสอบจริงว่าตรง resolution ที่ขอไหม
            const track = testStream.getVideoTracks()[0];
            const settings = track.getSettings();
            if (settings.width === res.width && settings.height === res.height) {
              this.stream = testStream;
              this.currentDeviceId = this.configuration.deviceInfo.deviceId;
              break;
            } else {
              // ไม่ตรง ให้ stop แล้วลองตัวถัดไป
              testStream.getTracks().forEach((t) => t.stop());
              this.stream = null;
            }
          } catch (err) {
            lastError = err;
            this.stream = null;
          }
        }
        if (!this.stream) {
          if (allowAny) {
            constraints = this.buildConstraints();
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.currentDeviceId = this.configuration.deviceInfo.deviceId;
          } else {
            throw this.createError(
              WebcamErrorCode.RESOLUTION_NOT_SUPPORTED,
              'None of the preferredResolutions are supported',
              lastError
            );
          }
        }
      }

      if (this.configuration.videoElement) {
        this.videoElement = this.configuration.videoElement;
        this.videoElement.srcObject = this.stream;

        if (this.configuration.enableMirror) {
          this.videoElement.style.transform = 'scaleX(-1)';
        }

        await this.videoElement.play();
      }

      this.state.status = 'ready';

      if (this.configuration.onStart) {
        this.configuration.onStart();
      }

      if (this.configuration.debug) {
        console.log('[Webcam] Started successfully');
      }
    } catch (error: any) {
      this.state.status = 'error';
      let webcamError: WebcamError;

      if (error.name === 'NotAllowedError') {
        webcamError = this.createError(
          WebcamErrorCode.PERMISSION_DENIED,
          'Please allow webcam access',
          error
        );
      } else if (error.name === 'NotFoundError') {
        webcamError = this.createError(
          WebcamErrorCode.DEVICE_NOT_FOUND,
          'No webcam device found',
          error
        );
      } else if (error.name === 'NotReadableError') {
        webcamError = this.createError(
          WebcamErrorCode.DEVICE_BUSY,
          'Webcam is in use by another application',
          error
        );
      } else {
        webcamError = this.createError(
          WebcamErrorCode.STREAM_FAILED,
          'Failed to start webcam',
          error
        );
      }

      this.state.lastError = webcamError;

      if (this.configuration.onError) {
        this.configuration.onError(webcamError);
      }

      throw webcamError;
    }
  }

  /**
   * Stop the webcam
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.currentDeviceId = null;
    this.state.status = 'idle';

    if (this.configuration?.debug) {
      console.log('[Webcam] Stopped');
    }
  }

  // ====================
  // ADVANCED CONTROLS
  // ====================

  /**
   * Check if zoom is supported
   */
  isZoomSupported(): boolean {
    return this.state.deviceCapabilities?.hasZoom || false;
  }

  /**
   * Set zoom level
   */
  async setZoomLevel(level: number): Promise<void> {
    if (!this.stream) {
      throw this.createError(WebcamErrorCode.STREAM_FAILED, 'No video stream available');
    }

    if (!this.isZoomSupported()) {
      throw this.createError(WebcamErrorCode.NOT_SUPPORTED, 'Zoom is not supported on this device');
    }

    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ zoom: level } as any]
      });
    } catch (error) {
      throw this.createError(WebcamErrorCode.CONTROL_ERROR, 'Failed to set zoom level', error);
    }
  }

  /**
   * Check if torch is supported
   */
  isTorchSupported(): boolean {
    return this.state.deviceCapabilities?.hasTorch || false;
  }

  /**
   * Enable/disable torch
   */
  async enableTorch(enabled: boolean): Promise<void> {
    if (!this.stream) {
      throw this.createError(WebcamErrorCode.STREAM_FAILED, 'No video stream available');
    }

    if (!this.isTorchSupported()) {
      throw this.createError(
        WebcamErrorCode.NOT_SUPPORTED,
        'Torch is not supported on this device'
      );
    }

    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: enabled } as any]
      });
    } catch (error) {
      throw this.createError(WebcamErrorCode.CONTROL_ERROR, 'Failed to control torch', error);
    }
  }

  /**
   * Check if focus is supported
   */
  isFocusSupported(): boolean {
    return this.state.deviceCapabilities?.hasFocus || false;
  }

  /**
   * Set focus mode
   */
  async setFocusMode(mode: string): Promise<void> {
    if (!this.stream) {
      throw this.createError(WebcamErrorCode.STREAM_FAILED, 'No video stream available');
    }

    if (!this.isFocusSupported()) {
      throw this.createError(
        WebcamErrorCode.NOT_SUPPORTED,
        'Focus mode is not supported on this device'
      );
    }

    try {
      const videoTrack = this.stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ focusMode: mode } as any]
      });
    } catch (error) {
      throw this.createError(WebcamErrorCode.CONTROL_ERROR, 'Failed to set focus mode', error);
    }
  }

  /**
   * Toggle mirror mode
   */
  toggleMirror(): void {
    if (this.videoElement) {
      const currentTransform = this.videoElement.style.transform;
      this.videoElement.style.transform = currentTransform.includes('scaleX(-1)')
        ? ''
        : 'scaleX(-1)';
    }
  }

  /**
   * Check if mirror is enabled
   */
  isMirrorEnabled(): boolean {
    return this.videoElement?.style.transform.includes('scaleX(-1)') || false;
  }

  /**
   * Toggle settings
   */
  toggleSetting(setting: string): void {
    if (!this.configuration) return;

    switch (setting) {
      case 'enableAudio':
        this.configuration.enableAudio = !this.configuration.enableAudio;
        break;
      case 'allowAnyResolution':
        this.configuration.allowAnyResolution = !this.configuration.allowAnyResolution;
        break;
      case 'allowAutoRotateResolution':
        this.configuration.allowAutoRotateResolution =
          !this.configuration.allowAutoRotateResolution;
        break;
      case 'debug':
        this.configuration.debug = !this.configuration.debug;
        break;
    }
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled(): boolean {
    return this.configuration?.enableAudio || false;
  }

  /**
   * Check if any resolution is allowed (not fixed to preferred only)
   */
  isAnyResolutionAllowed(): boolean {
    // Default true
    return this.configuration?.allowAnyResolution !== false;
  }

  /**
   * Check if resolution swap is allowed
   */
  isResolutionSwapAllowed(): boolean {
    return this.configuration?.allowAutoRotateResolution || false;
  }

  /**
   * Toggle debug mode
   */
  toggleDebug(): void {
    this.toggleSetting('debug');
  }

  /**
   * Check if debug is enabled
   */
  isDebugEnabled(): boolean {
    return this.configuration?.debug || false;
  }

  // ====================
  // STATUS & STATE
  // ====================

  /**
   * Get current status
   */
  getStatus(): WebcamStatus {
    return this.state.status;
  }

  /**
   * Get current state
   */
  getState(): WebcamState {
    return { ...this.state };
  }

  /**
   * Get current resolution
   */
  getCurrentResolution(): Resolution | null {
    if (!this.videoElement) return null;

    return {
      name: 'Current',
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      aspectRatio: this.videoElement.videoWidth / this.videoElement.videoHeight
    };
  }

  /**
   * Get last error
   */
  getLastError(): WebcamError | null {
    return this.state.lastError;
  }

  /**
   * Clear error and reset status
   */
  clearError(): void {
    this.state.lastError = null;
    if (this.state.status === 'error') {
      this.state.status = 'idle';
    }
  }

  // ====================
  // IMAGE CAPTURE
  // ====================

  /**
   * Capture image from current stream
   */
  captureImage(options: CaptureOptions = {}): string {
    if (!this.videoElement) {
      throw this.createError(WebcamErrorCode.STREAM_FAILED, 'No video element available');
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw this.createError(WebcamErrorCode.CANVAS_ERROR, 'Failed to get canvas context');
    }

    const scale = options.scale ?? 1.0;
    canvas.width = this.videoElement.videoWidth * scale;
    canvas.height = this.videoElement.videoHeight * scale;

    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

    const mediaType = options.mediaType ?? 'image/jpeg';
    const quality = options.quality ?? 0.8;

    return canvas.toDataURL(mediaType, quality);
  }

  // ====================
  // DEVICE CAPABILITIES
  // ====================

  /**
   * Get device capabilities for a specific device
   */
  async getDeviceCapabilities(deviceId: string): Promise<DeviceCapability> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });

      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();

      // Stop the temporary stream
      stream.getTracks().forEach((track) => track.stop());

      const deviceCapability: DeviceCapability = {
        deviceId,
        maxWidth: capabilities.width?.max ?? 1920,
        maxHeight: capabilities.height?.max ?? 1080,
        minWidth: capabilities.width?.min ?? 320,
        minHeight: capabilities.height?.min ?? 240,
        hasZoom: 'zoom' in capabilities,
        hasTorch: 'torch' in capabilities,
        hasFocus: 'focusMode' in capabilities,
        maxZoom: (capabilities as any).zoom?.max,
        minZoom: (capabilities as any).zoom?.min,
        supportedFocusModes: (capabilities as any).focusMode,
        supportedFrameRates: capabilities.frameRate
          ? [capabilities.frameRate.min ?? 0, capabilities.frameRate.max ?? 30]
          : undefined
      };

      if (deviceId === this.currentDeviceId) {
        this.state.deviceCapabilities = deviceCapability;
      }

      return deviceCapability;
    } catch (error) {
      throw this.createError(
        WebcamErrorCode.DEVICES_ERROR,
        'Failed to get device capabilities',
        error
      );
    }
  }

  /**
   * Get current device capabilities
   */
  getCurrentDeviceCapabilities(): DeviceCapability | null {
    return this.state.deviceCapabilities;
  }

  /**
   * Check supported resolutions
   */
  checkSupportedResolutions(
    capabilities: DeviceCapability[],
    resolutions: Resolution[]
  ): ResolutionSupportInfo {
    const capability = capabilities[0];
    if (!capability) {
      throw this.createError(WebcamErrorCode.INVALID_CONFIG, 'No device capabilities provided');
    }

    const supportedResolutions = resolutions.map((resolution) => ({
      ...resolution,
      aspectRatio: resolution.aspectRatio || resolution.width / resolution.height,
      supported:
        resolution.width <= capability.maxWidth &&
        resolution.height <= capability.maxHeight &&
        resolution.width >= capability.minWidth &&
        resolution.height >= capability.minHeight
    }));

    return {
      resolutions: supportedResolutions,
      deviceInfo: {
        deviceId: capability.deviceId,
        maxWidth: capability.maxWidth,
        maxHeight: capability.maxHeight,
        minWidth: capability.minWidth,
        minHeight: capability.minHeight
      }
    };
  }

  /**
   * Create resolution helper
   */
  createResolution(name: string, width: number, height: number): Resolution {
    return {
      name,
      width,
      height,
      aspectRatio: width / height
    };
  }

  // ====================
  // PRIVATE METHODS
  // ====================

  private buildConstraints(): MediaStreamConstraints {
    if (!this.configuration) {
      throw this.createError(WebcamErrorCode.INVALID_CONFIG, 'Configuration not set');
    }

    const videoConstraints: MediaTrackConstraints = {
      deviceId: { exact: this.configuration.deviceInfo.deviceId }
    };

    // Handle resolutions
    if (this.configuration.preferredResolutions) {
      const resolutions = Array.isArray(this.configuration.preferredResolutions)
        ? this.configuration.preferredResolutions
        : [this.configuration.preferredResolutions];

      if (resolutions.length > 0) {
        const resolution = resolutions[0]; // Use first preferred resolution
        videoConstraints.width = { ideal: resolution.width };
        videoConstraints.height = { ideal: resolution.height };
      }
    }

    return {
      video: videoConstraints,
      audio: this.configuration.enableAudio || false
    };
  }

  private createError(
    code: WebcamErrorCode,
    message: string,
    context?: any,
    suggestions?: string[],
    canRetry?: boolean
  ): WebcamError {
    return new WebcamError(code, message, context, suggestions, canRetry);
  }
}
