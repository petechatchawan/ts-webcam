// ===== Types =====
export type PermissionState = "granted" | "denied" | "prompt";

export type CameraErrorCode =
  // Permission-related errors
  | "no-permissions-api"
  | "permission-denied"
  | "microphone-permission-denied"
  // Device and configuration errors
  | "configuration-error"
  | "no-device"
  | "no-media-devices-support"
  | "invalid-device-id"
  | "no-resolutions"
  // Camera initialization and operation errors
  | "camera-start-error"
  | "camera-initialization-error"
  | "no-stream"
  | "camera-settings-error"
  | "camera-stop-error"
  | "camera-already-in-use"
  // Camera functionality errors
  | "zoom-not-supported"
  | "torch-not-supported"
  | "focus-not-supported"
  | "device-list-error"
  // Miscellaneous errors
  | "unknown";

// ===== Error Class =====
export class CameraError extends Error {
  constructor(
    public code: CameraErrorCode,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = "CameraError";
  }
}

// ===== Interfaces =====
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
  /** อนุญาตให้ใช้ความละเอียดใดๆ ได้ หากไม่สามารถใช้ความละเอียดที่กำหนดไว้นนความละเอียดที่กำหนดไว้ */
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
  onError?: (error: CameraError) => void;
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

// ===== MediaDevices API Extensions =====
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

// ===== Enums =====
export enum WebcamStatus {
  IDLE = "idle",
  INITIALIZING = "initializing",
  READY = "ready",
  ERROR = "error",
}

// ===== State Interface =====
export interface WebcamState {
  status: WebcamStatus;
  config: Required<WebcamConfig> | null;
  stream: MediaStream | null;
  lastError: CameraError | null;
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
  private orientationChangeListener: (() => void) | null = null;

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
      throw new CameraError("invalid-device-id", "Device ID is required");
    }

    if (!config.resolutions || config.resolutions.length === 0) {
      throw new CameraError(
        "no-resolutions",
        "At least one resolution must be specified"
      );
    }

    this.state.config = { ...this.defaultConfig, ...config };
  }

  public async start(): Promise<void> {
    this.checkConfiguration();
    try {
      await this.initializeWebcam();
    } catch (error) {
      if (error instanceof CameraError) {
        this.handleError(error);
      } else {
        this.handleError(
          new CameraError(
            "camera-start-error",
            "Failed to start camera",
            error as Error
          )
        );
      }
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
      throw new CameraError(
        "no-media-devices-support",
        "MediaDevices API is not supported in this browser"
      );
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

  public getCurrentDevice(): DeviceInfo | null {
    if (!this.state.config?.device) return null;
    return (
      this.state.devices.find(
        (device) => device.id === this.state.config!.device
      ) || null
    );
  }

  public setupChangeListeners(): void {
    // ติดตามการเปลี่ยนแปลงอุปกรณ์
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new CameraError(
        "no-media-devices-support",
        "MediaDevices API is not supported in this browser"
      );
    }

    // อัปเดตรายการอุปกรณ์ครั้งแรก
    this.updateDeviceList();

    // ตั้งค่า device change listener
    this.deviceChangeListener = async () => {
      await this.updateDeviceList();

      // ตรวจสอบว่าอุปกรณ์ปัจจุบันยังคงมีอยู่หรือไม่
      const currentDevice = this.getCurrentDevice();
      if (this.isActive() && !currentDevice) {
        // ถ้าอุปกรณ์ปัจจุบันหายไป ให้หยุดการทำงาน
        this.handleError(
          new CameraError("no-device", "Current device is no longer available")
        );
        this.stop();
      }
    };

    // ตั้งค่า orientation change listener
    this.orientationChangeListener = () => {
      if (this.isActive() && this.state.config?.autoRotation) {
        if (screen.orientation) {
          console.log("Screen orientation is supported");
          const orientation = screen.orientation.type;
          const angle = screen.orientation.angle;
          console.log(`Orientation type: ${orientation}, angle: ${angle}`);

          switch (orientation) {
            case "portrait-primary":
              console.log("Portrait (ปกติ)");
              break;
            case "portrait-secondary":
              console.log("Portrait (กลับหัว)");
              break;
            case "landscape-primary":
              console.log("Landscape (ปกติ)");
              break;
            case "landscape-secondary":
              console.log("Landscape (กลับด้าน)");
              break;
            default:
              console.log("Unknown orientation");
          }

          // แจ้งเตือนผู้ใช้ว่าต้อง restart กล้องเอง
          if (this.state.config?.onError) {
            this.state.config.onError(
              new CameraError(
                "camera-initialization-error",
                `Screen orientation changed to ${orientation}. Please restart the camera manually.`
              )
            );
          }
        } else {
          console.log("screen.orientation is not supported");
          // แจ้งเตือนกรณีไม่รองรับ
          if (this.state.config?.onError) {
            this.state.config.onError(
              new CameraError(
                "camera-initialization-error",
                "Screen orientation detection is not supported on this device."
              )
            );
          }
        }
      }
    };

    // เพิ่ม listeners
    navigator.mediaDevices.addEventListener(
      "devicechange",
      this.deviceChangeListener
    );
    window.addEventListener(
      "orientationchange",
      this.orientationChangeListener
    );
  }

  public stopChangeListeners(): void {
    // ลบ device change listener
    if (this.deviceChangeListener) {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        this.deviceChangeListener
      );
      this.deviceChangeListener = null;
    }

    // ลบ orientation change listener
    if (this.orientationChangeListener) {
      window.removeEventListener(
        "orientationchange",
        this.orientationChangeListener
      );
      this.orientationChangeListener = null;
    }
  }

  // State and capabilities
  public getState(): WebcamState {
    return { ...this.state };
  }

  public getStatus(): WebcamStatus {
    return this.state.status;
  }

  public getLastError(): CameraError | null {
    return this.state.lastError;
  }

  public clearError(): void {
    // ล้าง error และกลับไปที่สถานะ IDLE ถ้าไม่ได้ active อยู่
    this.state.lastError = null;
    if (!this.isActive()) {
      this.state.status = WebcamStatus.IDLE;
    }
  }

  public getCapabilities(): WebcamCapabilities {
    return { ...this.state.capabilities };
  }

  public getCurrentResolution(): Resolution | null {
    // ถ้าไม่มี stream หรือไม่มี config ให้คืนค่า null
    if (!this.state.stream || !this.state.config) return null;

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    // หาชื่อ resolution ที่ตรงกับขนาดปัจจุบัน
    const currentWidth = this.state.config.autoRotation
      ? settings.height || 0
      : settings.width || 0;
    const currentHeight = this.state.config.autoRotation
      ? settings.width || 0
      : settings.height || 0;

    // หา resolution ที่ตรงกับขนาดปัจจุบันจากรายการที่กำหนดไว้
    const matchedResolution = this.state.config.resolutions.find(
      (r) => r.width === currentWidth && r.height === currentHeight
    );

    return {
      name: matchedResolution?.name || `${currentWidth}x${currentHeight}`,
      width: currentWidth,
      height: currentHeight,
      aspectRatio: settings.aspectRatio,
    };
  }

  // Camera controls
  public async setZoom(zoomLevel: number): Promise<void> {
    if (!this.state.stream || !this.state.capabilities.zoom) {
      throw new CameraError(
        "zoom-not-supported",
        "Zoom is not supported or camera is not active"
      );
    }

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (!capabilities.zoom) {
      throw new CameraError(
        "zoom-not-supported",
        "Zoom is not supported by this device"
      );
    }

    try {
      zoomLevel = Math.min(
        Math.max(zoomLevel, capabilities.zoom.min),
        capabilities.zoom.max
      );
      await videoTrack.applyConstraints({
        advanced: [{ zoom: zoomLevel } as ExtendedMediaTrackConstraintSet],
      });
      this.state.capabilities.currentZoom = zoomLevel;
    } catch (error) {
      throw new CameraError(
        "camera-settings-error",
        "Failed to set zoom level",
        error as Error
      );
    }
  }

  public async setTorch(active: boolean): Promise<void> {
    if (!this.state.stream || !this.state.capabilities.torch) {
      throw new CameraError(
        "torch-not-supported",
        "Torch is not supported or camera is not active"
      );
    }

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (!capabilities.torch) {
      throw new CameraError(
        "torch-not-supported",
        "Torch is not supported by this device"
      );
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: active } as ExtendedMediaTrackConstraintSet],
      });
      this.state.capabilities.torchActive = active;
    } catch (error) {
      throw new CameraError(
        "camera-settings-error",
        "Failed to toggle torch",
        error as Error
      );
    }
  }

  public async setFocusMode(mode: string): Promise<void> {
    if (!this.state.stream || !this.state.capabilities.focusMode) {
      throw new CameraError(
        "focus-not-supported",
        "Focus mode is not supported or camera is not active"
      );
    }

    const videoTrack = this.state.stream.getVideoTracks()[0];
    const capabilities =
      videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

    if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
      throw new CameraError(
        "focus-not-supported",
        `Focus mode ${mode} is not supported by this device`
      );
    }

    try {
      await videoTrack.applyConstraints({
        advanced: [{ focusMode: mode } as ExtendedMediaTrackConstraintSet],
      });
      this.state.capabilities.currentFocusMode = mode;
      this.state.capabilities.focusModeActive = true;
    } catch (error) {
      throw new CameraError(
        "camera-settings-error",
        "Failed to set focus mode",
        error as Error
      );
    }
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
    try {
      // ตรวจสอบว่ารองรับ Permissions API หรือไม่
      if (navigator?.permissions?.query) {
        console.log("permission query");

        // ใช้ Permissions API
        const { state } = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });

        return state as PermissionState;
      }

      // ถ้าไม่รองรับ ใช้วิธีเดิม
      let tempStream: MediaStream | null = null;
      try {
        console.log("old way");
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
    } catch (error) {
      // กรณีเกิดข้อผิดพลาดจาก Permissions API
      if (error instanceof Error) {
        console.warn("Permissions API error:", error);
        // ลองใช้วิธีเดิม
        return this.checkCameraPermissionFallback();
      }
      return "prompt";
    }
  }

  private async checkCameraPermissionFallback(): Promise<PermissionState> {
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
    try {
      // ตรวจสอบว่ารองรับ Permissions API หรือไม่
      if (navigator?.permissions?.query) {
        // ใช้ Permissions API
        const { state } = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        return state as PermissionState;
      }

      // ถ้าไม่รองรับ ใช้วิธีเดิม
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
    } catch (error) {
      // กรณีเกิดข้อผิดพลาดจาก Permissions API
      if (error instanceof Error) {
        console.warn("Permissions API error:", error);
        // ลองใช้วิธีเดิม
        return this.checkMicrophonePermissionFallback();
      }
      return "prompt";
    }
  }

  private async checkMicrophonePermissionFallback(): Promise<PermissionState> {
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
      throw new CameraError("permission-denied", "Camera permission denied");
    }
    if (this.state.config!.audio && permissions.microphone === "denied") {
      throw new CameraError(
        "microphone-permission-denied",
        "Microphone permission denied"
      );
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
      throw new CameraError(
        "configuration-error",
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
      throw new CameraError(
        "configuration-error",
        "Please call setupConfiguration() before using webcam"
      );
    }
  }

  private handleError(error: Error): void {
    // เก็บ error และเปลี่ยนสถานะเป็น ERROR
    this.state.status = WebcamStatus.ERROR;
    this.state.lastError =
      error instanceof CameraError
        ? error
        : new CameraError("unknown", error.message, error);

    // เรียก callback onError ถ้ามี config
    if (this.state.config?.onError) {
      this.state.config.onError(this.state.lastError as CameraError);
    }
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
    this.stopChangeListeners();
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
