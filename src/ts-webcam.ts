// Types
export type PermissionState = "granted" | "denied" | "prompt";

// Interfaces
export interface Resolution {
  name: string;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface WebcamConfig {
  /** เปิด/ปิดเสียง */
  audio?: boolean;
  /** ID ของอุปกรณ์กล้อง (required) */
  device: string;
  /** รายการความละเอียดที่ต้องการใช้งาน เรียงตามลำดับความสำคัญ */
  resolutions: Resolution[];
  /** อนุญาตให้ใช้ความละเอียดใดๆ ได้ หากไม่สามารถใช้ความละเอียดที่กำหนดใน resolutions ได้ */
  allowAnyResolution?: boolean;
  /** กลับด้านการแสดงผล */
  mirror?: boolean;
  /** หมุนความละเอียดอัตโนมัติ (สลับ width/height) */
  autoRotation?: boolean;
  /** element สำหรับแสดงผลวิดีโอ */
  previewElement?: HTMLVideoElement;
  /** callback เมื่อเปิดกล้องสำเร็จ */
  onStart?: () => void;
  /** callback เมื่อเกิดข้อผิดพลาด */
  onError?: (error: Error) => void;
}

export interface WebcamCapabilities {
  zoom: boolean;
  torch: boolean;
  focusMode: boolean;
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  torchActive: boolean;
  focusModeActive: boolean;
  currentFocusMode: string;
  supportedFocusModes: string[];
}

export interface DeviceInfo {
  id: string;
  label: string;
  kind: "audioinput" | "audiooutput" | "videoinput";
}

// MediaDevices API Extensions
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  zoom?: {
    min: number;
    max: number;
    step: number;
  };
  torch?: boolean;
  focusMode?: string[];
}

interface ExtendedMediaTrackSettings extends MediaTrackSettings {
  zoom?: number;
  torch?: boolean;
  focusMode?: string;
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  zoom?: number;
  torch?: boolean;
  focusMode?: string;
}

// Enums
export enum WebcamStatus {
  IDLE = "idle",
  INITIALIZING = "initializing",
  READY = "ready",
  ERROR = "error",
}

// เพิ่ม interface สำหรับ state ทั้งหมด
export interface WebcamState {
  status: WebcamStatus;
  config: Required<WebcamConfig> | null;
  stream: MediaStream | null;
  lastError: Error | null;
  devices: DeviceInfo[];
  capabilities: WebcamCapabilities;
}

export class Webcam {
  // รวม state ทั้งหมดไว้ในที่เดียว
  private state: WebcamState = {
    status: WebcamStatus.IDLE,
    config: null,
    stream: null,
    lastError: null,
    devices: [],
    capabilities: {
      zoom: false,
      torch: false,
      focusMode: false,
      currentZoom: 1,
      minZoom: 1,
      maxZoom: 1,
      torchActive: false,
      focusModeActive: false,
      currentFocusMode: "none",
      supportedFocusModes: [],
    },
  };

  private deviceChangeListener: (() => void) | null = null;

  // Default values
  private readonly defaultConfig: Required<WebcamConfig> = {
    audio: false,
    device: "",
    resolutions: [
      { name: "HD", width: 1280, height: 720, aspectRatio: 16 / 9 },
      { name: "VGA", width: 640, height: 480, aspectRatio: 4 / 3 },
    ],
    allowAnyResolution: false,
    mirror: false,
    autoRotation: true,
    previewElement: undefined as unknown as HTMLVideoElement,
    onStart: () => {},
    onError: () => {},
  };

  constructor() {}

  // Public API methods
  public setupConfiguration(config: WebcamConfig): void {
    if (!config.device) {
      throw new Error("Device ID is required");
    }
    if (!config.resolutions || config.resolutions.length === 0) {
      throw new Error("At least one resolution must be specified");
    }
    this.state.config = { ...this.defaultConfig, ...config };
  }

  public async start(): Promise<void> {
    this.checkConfiguration();
    try {
      await this.initializeWebcam();
    } catch (error) {
      this.handleError(error as Error);
      throw this.state.lastError;
    }
  }

  public stop(): void {
    this.checkConfiguration();
    this.stopStream();
    this.resetState();
  }

  public isActive(): boolean {
    return this.state.stream !== null && this.state.stream.active;
  }

  // Device management
  public startDeviceTracking(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.warn("MediaDevices API is not supported in this browser");
      return;
    }

    // อัปเดตรายการอุปกรณ์ครั้งแรก
    this.updateDeviceList();

    // ตั้งค่า listener สำหรับติดตามการเปลี่ยนแปลง
    this.deviceChangeListener = () => this.updateDeviceList();
    navigator.mediaDevices.addEventListener(
      "devicechange",
      this.deviceChangeListener
    );
  }

  public stopDeviceTracking(): void {
    if (this.deviceChangeListener) {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        this.deviceChangeListener
      );
      this.deviceChangeListener = null;
    }
  }

  public getDeviceList(): DeviceInfo[] {
    return [...this.state.devices];
  }

  public getVideoDevices(): DeviceInfo[] {
    return this.getDeviceList().filter(
      (device) => device.kind === "videoinput"
    );
  }

  public getAudioInputDevices(): DeviceInfo[] {
    return this.getDeviceList().filter(
      (device) => device.kind === "audioinput"
    );
  }

  public getAudioOutputDevices(): DeviceInfo[] {
    return this.getDeviceList().filter(
      (device) => device.kind === "audiooutput"
    );
  }

  // State and capabilities
  public getState(): WebcamState {
    return { ...this.state };
  }

  public getStatus(): WebcamStatus {
    return this.state.status;
  }

  public getLastError(): Error | null {
    return this.state.lastError;
  }

  public getCapabilities(): WebcamCapabilities {
    return { ...this.state.capabilities };
  }

  public getCurrentResolution(): Resolution | null {
    this.checkConfiguration();
    if (!this.state.stream) return null;

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    return {
      name: "Current",
      width: this.state.config!.autoRotation
        ? settings.height || 0
        : settings.width || 0,
      height: this.state.config!.autoRotation
        ? settings.width || 0
        : settings.height || 0,
      aspectRatio: settings.aspectRatio,
    };
  }

  // Camera controls
  public async setZoom(zoomLevel: number): Promise<void> {
    if (!this.state.stream || !this.state.capabilities.zoom) {
      throw new Error("Zoom is not supported or camera is not active");
    }

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (!capabilities.zoom) {
      throw new Error("Zoom is not supported by this device");
    }

    zoomLevel = Math.min(
      Math.max(zoomLevel, capabilities.zoom.min),
      capabilities.zoom.max
    );
    await videoTrack.applyConstraints({
      advanced: [{ zoom: zoomLevel } as ExtendedMediaTrackConstraintSet],
    });
    this.state.capabilities.currentZoom = zoomLevel;
  }

  public async setTorch(active: boolean): Promise<void> {
    if (!this.state.stream || !this.state.capabilities.torch) {
      throw new Error("Torch is not supported or camera is not active");
    }

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (!capabilities.torch) {
      throw new Error("Torch is not supported by this device");
    }

    await videoTrack.applyConstraints({
      advanced: [{ torch: active } as ExtendedMediaTrackConstraintSet],
    });
    this.state.capabilities.torchActive = active;
  }

  public async setFocusMode(mode: string): Promise<void> {
    if (!this.state.stream || !this.state.capabilities.focusMode) {
      throw new Error("Focus mode is not supported or camera is not active");
    }

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
      throw new Error(`Focus mode ${mode} is not supported by this device`);
    }

    await videoTrack.applyConstraints({
      advanced: [{ focusMode: mode } as ExtendedMediaTrackConstraintSet],
    });
    this.state.capabilities.currentFocusMode = mode;
    this.state.capabilities.focusModeActive = true;
  }

  public updateConfig(newConfig: Partial<WebcamConfig>): void {
    this.checkConfiguration();
    const wasActive = this.isActive();
    if (wasActive) {
      this.stop();
    }

    this.state.config = { ...this.state.config!, ...newConfig };

    if (wasActive) {
      this.start().catch(this.state.config.onError);
    }
  }

  // Permission management
  public async checkCameraPermission(): Promise<PermissionState> {
    let tempStream: MediaStream | null = null;
    try {
      tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      return "granted";
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          return "denied";
        }
      }
      return "prompt";
    } finally {
      if (tempStream) {
        tempStream.getTracks().forEach((track) => track.stop());
      }
    }
  }

  public async checkMicrophonePermission(): Promise<PermissionState> {
    let tempStream: MediaStream | null = null;
    try {
      tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return "granted";
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          return "denied";
        }
      }
      return "prompt";
    } finally {
      if (tempStream) {
        tempStream.getTracks().forEach((track) => track.stop());
      }
    }
  }

  public async requestPermissions(): Promise<{
    camera: PermissionState;
    microphone: PermissionState;
  }> {
    return {
      camera: await this.checkCameraPermission(),
      microphone: this.state.config?.audio
        ? await this.checkMicrophonePermission()
        : "prompt",
    };
  }

  // Private helper methods
  private async initializeWebcam(): Promise<void> {
    this.state.status = WebcamStatus.INITIALIZING;
    this.state.lastError = null;

    const permissions = await this.requestPermissions();
    this.validatePermissions(permissions);

    await this.openCamera();
  }

  private validatePermissions(permissions: {
    camera: PermissionState;
    microphone: PermissionState;
  }): void {
    if (permissions.camera === "denied") {
      throw new Error("Camera permission denied");
    }
    if (this.state.config!.audio && permissions.microphone === "denied") {
      throw new Error("Microphone permission denied");
    }
  }

  private async openCamera(): Promise<void> {
    for (const resolution of this.state.config!.resolutions) {
      try {
        await this.tryResolution(resolution);
        return;
      } catch (error) {
        console.log(
          `Failed to open camera with resolution: ${resolution.name}. Error:`,
          error
        );
        continue;
      }
    }

    if (this.state.config!.allowAnyResolution) {
      await this.tryAnyResolution();
    } else {
      throw new Error(
        `Unable to open camera with specified resolutions: ${this.state
          .config!.resolutions.map((r) => `${r.name} (${r.width}x${r.height})`)
          .join(", ")}`
      );
    }
  }

  private async tryResolution(resolution: Resolution): Promise<void> {
    console.log(
      `Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`
    );

    const constraints = this.buildConstraints(resolution);
    this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);

    await this.updateCapabilities();
    await this.setupPreviewElement();

    console.log(
      `Successfully opened camera with resolution: ${resolution.name}`
    );
    this.state.status = WebcamStatus.READY;
    this.state.config!.onStart();
  }

  private async tryAnyResolution(): Promise<void> {
    console.log("Attempting to open camera with any supported resolution");

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: { exact: this.state.config!.device },
      },
      audio: this.state.config!.audio,
    };

    this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);

    await this.updateCapabilities();
    await this.setupPreviewElement();

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    console.log(
      `Opened camera with resolution: ${settings.width}x${settings.height}`
    );

    this.state.status = WebcamStatus.READY;
    this.state.config!.onStart();
  }

  private async setupPreviewElement(): Promise<void> {
    if (this.state.config!.previewElement && this.state.stream) {
      this.state.config!.previewElement.srcObject = this.state.stream;
      this.state.config!.previewElement.style.transform = this.state.config!
        .mirror
        ? "scaleX(-1)"
        : "none";
      await this.state.config!.previewElement.play();
    }
  }

  private async updateCapabilities(): Promise<void> {
    if (!this.state.stream) return;

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
    const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings;

    this.state.capabilities = {
      zoom: !!capabilities.zoom,
      torch: !!capabilities.torch,
      focusMode: !!capabilities.focusMode,
      currentZoom: settings.zoom || 1,
      minZoom: capabilities.zoom?.min || 1,
      maxZoom: capabilities.zoom?.max || 1,
      torchActive: settings.torch || false,
      focusModeActive: !!settings.focusMode,
      currentFocusMode: settings.focusMode || "none",
      supportedFocusModes: capabilities.focusMode || [],
    };
  }

  private buildConstraints(resolution: Resolution): MediaStreamConstraints {
    const videoConstraints: MediaTrackConstraints = {
      deviceId: { exact: this.state.config!.device },
    };

    if (this.state.config!.autoRotation) {
      videoConstraints.width = { exact: resolution.height };
      videoConstraints.height = { exact: resolution.width };
    } else {
      videoConstraints.width = { exact: resolution.width };
      videoConstraints.height = { exact: resolution.height };
    }

    if (resolution.aspectRatio) {
      videoConstraints.aspectRatio = { exact: resolution.aspectRatio };
    }

    return {
      video: videoConstraints,
      audio: this.state.config!.audio,
    };
  }

  private checkConfiguration(): void {
    if (!this.state.config) {
      throw new Error("Please call setupConfiguration() before using webcam");
    }
  }

  private handleError(error: Error): void {
    this.state.status = WebcamStatus.ERROR;
    this.state.lastError = error;
    this.state.config!.onError(this.state.lastError);
  }

  private stopStream(): void {
    if (this.state.stream) {
      this.state.stream.getTracks().forEach((track) => track.stop());
      this.state.stream = null;
    }

    if (this.state.config!.previewElement) {
      this.state.config!.previewElement.srcObject = null;
    }
  }

  private resetState(): void {
    this.stopDeviceTracking();
    this.state = {
      ...this.state,
      status: WebcamStatus.IDLE,
      stream: null,
      lastError: null,
      capabilities: {
        zoom: false,
        torch: false,
        focusMode: false,
        currentZoom: 1,
        minZoom: 1,
        maxZoom: 1,
        torchActive: false,
        focusModeActive: false,
        currentFocusMode: "none",
        supportedFocusModes: [],
      },
    };
  }

  private async updateDeviceList(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.state.devices = devices.map((device) => ({
        id: device.deviceId,
        label: device.label || `${device.kind} (${device.deviceId})`,
        kind: device.kind as "audioinput" | "audiooutput" | "videoinput",
      }));
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  }
}
