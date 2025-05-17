import { WebcamErrorCode, createWebcamError } from './errors';
import {
  DeviceInfo,
  Resolution,
  WebcamEventListener,
  WebcamEventMap,
  WebcamEventType,
  WebcamOptions,
  WebcamState,
} from './types';

/**
 * Default webcam options
 */
const DEFAULT_OPTIONS: WebcamOptions = {
  resolution: { width: 640, height: 480 },
  audio: false,
  debug: false,
  mirrored: false,
  autoRequestPermissions: true,
};

/**
 * Main webcam class that handles camera operations
 */
export class Webcam {
  private options: WebcamOptions;
  private state: WebcamState = WebcamState.IDLE;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private devices: DeviceInfo[] = [];
  private currentDeviceId: string | null = null;
  private currentResolution: Resolution | null = null;
  private permissionState: PermissionState = 'prompt';
  private operationPromise: Promise<any> | null = null;
  private eventListeners: Map<WebcamEventType, Set<WebcamEventListener>> = new Map();
  private deviceChangeListener: (() => void) | null = null;

  /**
   * Creates a new Webcam instance
   * @param options Configuration options for the webcam
   */
  constructor(options: WebcamOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.log('Webcam instance created with options:', this.options);

    if (this.options.autoRequestPermissions) {
      this.checkPermissions().catch((err) => {
        this.log('Error checking permissions:', err);
      });
    }

    // Set up device change listener
    this.setupDeviceChangeListener();
  }

  /**
   * Logs debug messages if debug mode is enabled
   * @param args Arguments to log
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[Webcam]', ...args);
    }
  }

  /**
   * Sets up the device change listener
   */
  private setupDeviceChangeListener(): void {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      this.log('MediaDevices API not supported');
      return;
    }

    this.deviceChangeListener = async () => {
      this.log('Device change detected');
      await this.updateDeviceList();
      this.emit(WebcamEventType.DEVICE_CHANGE, this.devices);
    };

    navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
  }

  /**
   * Updates the list of available devices
   */
  private async updateDeviceList(): Promise<DeviceInfo[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw createWebcamError(
        WebcamErrorCode.NOT_SUPPORTED,
        'MediaDevices API not supported in this browser'
      );
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
          kind: device.kind,
        }));

      this.log('Updated device list:', this.devices);
      return this.devices;
    } catch (error) {
      throw createWebcamError(
        WebcamErrorCode.UNKNOWN_ERROR,
        'Failed to enumerate devices',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Checks if the browser supports the required APIs
   */
  private checkBrowserSupport(): boolean {
    const hasNavigator = typeof navigator !== 'undefined';
    const hasMediaDevices = hasNavigator && !!navigator.mediaDevices;
    const hasGetUserMedia = hasMediaDevices && !!navigator.mediaDevices.getUserMedia;

    return hasNavigator && hasMediaDevices && hasGetUserMedia;
  }

  /**
   * Checks and requests camera permissions
   */
  public async checkPermissions(): Promise<PermissionState> {
    if (!this.checkBrowserSupport()) {
      throw createWebcamError(
        WebcamErrorCode.NOT_SUPPORTED,
        'MediaDevices API not supported in this browser'
      );
    }

    try {
      // Check if the Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        this.permissionState = permissionStatus.state;

        // Set up permission change listener
        permissionStatus.addEventListener('change', () => {
          this.permissionState = permissionStatus.state;
          this.emit(WebcamEventType.PERMISSION_CHANGE, this.permissionState);
        });
      } else {
        // Fallback: try to access the camera to check permissions
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.permissionState = 'granted';
          // Stop the stream immediately since we're just checking permissions
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          if (error instanceof Error && error.name === 'NotAllowedError') {
            this.permissionState = 'denied';
          } else {
            this.permissionState = 'prompt';
          }
        }
      }

      this.log('Permission state:', this.permissionState);
      this.emit(WebcamEventType.PERMISSION_CHANGE, this.permissionState);

      // If permissions are granted, update the device list
      if (this.permissionState === 'granted') {
        await this.updateDeviceList();
      }

      return this.permissionState;
    } catch (error) {
      throw createWebcamError(
        WebcamErrorCode.UNKNOWN_ERROR,
        'Failed to check permissions',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Starts the webcam
   * @param deviceId Optional device ID to use
   * @param resolution Optional resolution to use
   */
  public async start(deviceId?: string, resolution?: Resolution): Promise<MediaStream> {
    // Prevent concurrent start operations
    if (this.operationPromise) {
      throw createWebcamError(
        WebcamErrorCode.CONCURRENT_OPERATION,
        'Another operation is already in progress'
      );
    }

    // Check if already active
    if (this.state === WebcamState.ACTIVE) {
      this.log('Webcam is already active');
      return this.stream!;
    }

    try {
      this.operationPromise = this._start(deviceId, resolution);
      return await this.operationPromise;
    } finally {
      this.operationPromise = null;
    }
  }

  /**
   * Internal start method
   */
  private async _start(deviceId?: string, resolution?: Resolution): Promise<MediaStream> {
    if (!this.checkBrowserSupport()) {
      throw createWebcamError(
        WebcamErrorCode.NOT_SUPPORTED,
        'MediaDevices API not supported in this browser'
      );
    }

    this.setState(WebcamState.REQUESTING_PERMISSIONS);

    // Check permissions first
    const permissionState = await this.checkPermissions();
    if (permissionState === 'denied') {
      throw createWebcamError(
        WebcamErrorCode.PERMISSION_DENIED,
        'Camera permission denied'
      );
    }

    // Update device list if needed
    if (this.devices.length === 0) {
      await this.updateDeviceList();
    }

    // Use provided deviceId or fall back to options or first available device
    const effectiveDeviceId = deviceId || this.options.deviceId || (this.devices[0]?.id || null);

    if (!effectiveDeviceId) {
      throw createWebcamError(
        WebcamErrorCode.DEVICE_NOT_FOUND,
        'No camera device found'
      );
    }

    // Use provided resolution or fall back to options
    const effectiveResolution = resolution || this.options.resolution;

    this.setState(WebcamState.INITIALIZING);

    try {
      // Build constraints
      const constraints: MediaStreamConstraints = {
        audio: this.options.audio || false,
        video: {
          deviceId: { exact: effectiveDeviceId },
          width: { ideal: effectiveResolution?.width },
          height: { ideal: effectiveResolution?.height },
        },
      };

      // Add frame rate if specified
      if (effectiveResolution?.frameRate) {
        (constraints.video as MediaTrackConstraints).frameRate = {
          ideal: effectiveResolution.frameRate,
        };
      }

      // Add aspect ratio if specified
      if (effectiveResolution?.aspectRatio) {
        (constraints.video as MediaTrackConstraints).aspectRatio = {
          ideal: effectiveResolution.aspectRatio,
        };
      }

      // Override with custom constraints if provided
      if (this.options.customConstraints) {
        Object.assign(constraints, this.options.customConstraints);
      }

      this.log('Starting webcam with constraints:', constraints);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Store the stream and update state
      this.stream = stream;
      this.currentDeviceId = effectiveDeviceId;

      // Get actual resolution from the track settings
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        this.currentResolution = {
          width: settings.width || effectiveResolution?.width || 0,
          height: settings.height || effectiveResolution?.height || 0,
          frameRate: settings.frameRate,
          aspectRatio: settings.aspectRatio,
        };
        this.log('Actual camera settings:', settings);
      }

      this.setState(WebcamState.ACTIVE);
      this.emit(WebcamEventType.STREAM_STARTED, stream);

      return stream;
    } catch (error) {
      this.setState(WebcamState.ERROR);

      // Handle specific error types
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            throw createWebcamError(
              WebcamErrorCode.PERMISSION_DENIED,
              'Camera permission denied',
              error
            );
          case 'NotFoundError':
            throw createWebcamError(
              WebcamErrorCode.DEVICE_NOT_FOUND,
              'Camera device not found',
              error
            );
          case 'NotReadableError':
          case 'TrackStartError':
            throw createWebcamError(
              WebcamErrorCode.DEVICE_IN_USE,
              'Camera is already in use or not accessible',
              error
            );
          case 'OverconstrainedError':
            throw createWebcamError(
              WebcamErrorCode.RESOLUTION_UNSUPPORTED,
              'Requested resolution not supported by the device',
              error
            );
          default:
            throw createWebcamError(
              WebcamErrorCode.INITIALIZATION_ERROR,
              `Failed to initialize camera: ${error.message}`,
              error
            );
        }
      }

      throw createWebcamError(
        WebcamErrorCode.UNKNOWN_ERROR,
        'Unknown error occurred while starting the camera',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Stops the webcam
   */
  public async stop(): Promise<void> {
    // Prevent concurrent operations
    if (this.operationPromise) {
      throw createWebcamError(
        WebcamErrorCode.CONCURRENT_OPERATION,
        'Another operation is already in progress'
      );
    }

    // Check if already stopped
    if (this.state === WebcamState.IDLE) {
      this.log('Webcam is already stopped');
      return;
    }

    try {
      this.operationPromise = this._stop();
      return await this.operationPromise;
    } finally {
      this.operationPromise = null;
    }
  }

  /**
   * Internal stop method
   */
  private async _stop(): Promise<void> {
    this.setState(WebcamState.STOPPING);

    if (this.stream) {
      // Stop all tracks
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });

      this.stream = null;
    }

    // Detach from video element if attached
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.setState(WebcamState.IDLE);
    this.emit(WebcamEventType.STREAM_STOPPED);
  }

  /**
   * Attaches the webcam stream to a video element
   * @param videoElement The video element to attach to
   */
  public attachToVideo(videoElement: HTMLVideoElement): void {
    if (!videoElement) {
      throw createWebcamError(
        WebcamErrorCode.INVALID_STATE,
        'Video element is required'
      );
    }

    this.videoElement = videoElement;

    // Apply mirroring if needed
    if (this.options.mirrored) {
      this.videoElement.style.transform = 'scaleX(-1)';
    }

    // Attach stream if available
    if (this.stream) {
      this.videoElement.srcObject = this.stream;
      this.videoElement.play().catch((error) => {
        this.log('Error playing video:', error);
      });
    }
  }

  /**
   * Detaches the webcam stream from the video element
   */
  public detachFromVideo(): void {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.style.transform = '';
      this.videoElement = null;
    }
  }

  /**
   * Gets the current webcam state
   */
  public getState(): WebcamState {
    return this.state;
  }

  /**
   * Gets the current stream
   */
  public getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Gets the list of available devices
   */
  public async getDevices(): Promise<DeviceInfo[]> {
    // Update the device list first
    return this.updateDeviceList();
  }

  /**
   * Gets the current device ID
   */
  public getCurrentDeviceId(): string | null {
    return this.currentDeviceId;
  }

  /**
   * Gets the current resolution
   */
  public getCurrentResolution(): Resolution | null {
    return this.currentResolution;
  }

  /**
   * Gets the supported resolutions for the current device
   * Note: This is an approximation as browsers don't provide a direct way to query this
   */
  public async getSupportedResolutions(): Promise<Resolution[]> {
    if (!this.currentDeviceId) {
      throw createWebcamError(
        WebcamErrorCode.INVALID_STATE,
        'No device selected'
      );
    }

    // Common resolutions to test
    const resolutionsToTest = [
      { width: 320, height: 240 },
      { width: 640, height: 480 },
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
      { width: 3840, height: 2160 },
    ];

    const supportedResolutions: Resolution[] = [];

    for (const resolution of resolutionsToTest) {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: this.currentDeviceId },
            width: { exact: resolution.width },
            height: { exact: resolution.height },
          },
        };

        // Try to get a stream with these constraints
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // If successful, add to supported resolutions
        supportedResolutions.push(resolution);

        // Stop the stream immediately
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        // This resolution is not supported, skip it
        this.log(`Resolution ${resolution.width}x${resolution.height} not supported`);
      }
    }

    return supportedResolutions;
  }

  /**
   * Takes a snapshot from the current stream
   * @param format Image format (default: 'image/png')
   * @param quality Image quality for JPEG (0-1)
   */
  public takeSnapshot(format: string = 'image/png', quality: number = 0.95): string | null {
    if (!this.stream || this.state !== WebcamState.ACTIVE) {
      throw createWebcamError(
        WebcamErrorCode.INVALID_STATE,
        'Webcam must be active to take a snapshot'
      );
    }

    // Create a temporary canvas if no video element is attached
    const canvas = document.createElement('canvas');
    const video = this.videoElement || document.createElement('video');

    if (!this.videoElement) {
      // Set up temporary video element
      video.srcObject = this.stream;
      video.play();

      // Wait for video to be ready
      return null; // In this case, we'd need to return a Promise, but for simplicity we return null
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame to the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw createWebcamError(
        WebcamErrorCode.NOT_SUPPORTED,
        'Canvas 2D context not supported'
      );
    }

    // Apply mirroring if needed
    if (this.options.mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    return canvas.toDataURL(format, quality);
  }

  /**
   * Changes the current device
   * @param deviceId The ID of the device to switch to
   */
  public async switchDevice(deviceId: string): Promise<MediaStream> {
    if (this.state === WebcamState.ACTIVE) {
      // Stop the current stream
      await this.stop();
    }

    // Start with the new device
    return this.start(deviceId, this.options.resolution);
  }

  /**
   * Changes the current resolution
   * @param resolution The new resolution to use
   */
  public async changeResolution(resolution: Resolution): Promise<MediaStream> {
    if (this.state === WebcamState.ACTIVE) {
      // Stop the current stream
      await this.stop();
    }

    // Start with the new resolution
    return this.start(this.currentDeviceId || undefined, resolution);
  }

  /**
   * Sets the webcam state and emits a state change event
   * @param state The new state
   */
  private setState(state: WebcamState): void {
    this.state = state;
    this.log('State changed:', state);
    this.emit(WebcamEventType.STATE_CHANGE, state);
  }

  /**
   * Adds an event listener
   * @param event The event type
   * @param listener The event listener
   */
  public on<T extends WebcamEventType>(
    event: T,
    listener: WebcamEventListener<WebcamEventMap[T]>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(listener as WebcamEventListener);
  }

  /**
   * Removes an event listener
   * @param event The event type
   * @param listener The event listener to remove
   */
  public off<T extends WebcamEventType>(
    event: T,
    listener: WebcamEventListener<WebcamEventMap[T]>
  ): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(listener as WebcamEventListener);
    }
  }

  /**
   * Emits an event
   * @param event The event type
   * @param data The event data
   */
  private emit<T extends WebcamEventType>(event: T, data?: WebcamEventMap[T]): void {
    if (this.eventListeners.has(event)) {
      for (const listener of this.eventListeners.get(event)!) {
        listener(data);
      }
    }
  }

  /**
   * Cleans up resources when the webcam is no longer needed
   */
  public dispose(): void {
    // Stop the stream if active
    if (this.state === WebcamState.ACTIVE) {
      this.stop().catch((err) => {
        this.log('Error stopping webcam during disposal:', err);
      });
    }

    // Remove device change listener
    if (this.deviceChangeListener && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
      this.deviceChangeListener = null;
    }

    // Clear event listeners
    this.eventListeners.clear();

    this.log('Webcam disposed');
  }
}
