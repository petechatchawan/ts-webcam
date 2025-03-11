interface Resolution {
  name: string;
  width: number;
  height: number;
  aspectRatio?: number;
}

type PermissionState = "granted" | "denied" | "prompt";

interface WebcamConfig {
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

export class Webcam {
  private config: Required<WebcamConfig> | null = null;
  private stream: MediaStream | null = null;
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

  constructor() {
    // ไม่ต้องรับ config ในตอนสร้าง instance
  }

  /**
   * ตั้งค่าการทำงานของ webcam
   * @param config การตั้งค่าต่างๆ
   */
  public setupConfiguration(config: WebcamConfig): void {
    if (!config.device) {
      throw new Error("Device ID is required");
    }
    if (!config.resolutions || config.resolutions.length === 0) {
      throw new Error("At least one resolution must be specified");
    }
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * ตรวจสอบว่าได้ตั้งค่าแล้วหรือยัง
   */
  private checkConfiguration(): void {
    if (!this.config) {
      throw new Error("Please call setupConfiguration() before using webcam");
    }
  }

  /**
   * ตรวจสอบสถานะการอนุญาตใช้งานกล้อง
   * @returns Promise<PermissionState> สถานะการอนุญาต ('granted', 'denied', 'prompt')
   */
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

  /**
   * ตรวจสอบสถานะการอนุญาตใช้งานไมโครโฟน
   * @returns Promise<PermissionState> สถานะการอนุญาต ('granted', 'denied', 'prompt')
   */
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

  /**
   * ขอสิทธิ์การใช้งานกล้องและไมโครโฟน
   * @returns Promise<{camera: PermissionState, microphone: PermissionState}> สถานะการอนุญาตของทั้งกล้องและไมโครโฟน
   */
  public async requestPermissions(): Promise<{
    camera: PermissionState;
    microphone: PermissionState;
  }> {
    const permissions = {
      camera: await this.checkCameraPermission(),
      microphone: this.config?.audio
        ? await this.checkMicrophonePermission()
        : "prompt",
    };

    return permissions;
  }

  public async start(): Promise<void> {
    this.checkConfiguration();
    try {
      // ตรวจสอบสิทธิ์ก่อน
      const permissions = await this.requestPermissions();
      if (permissions.camera === "denied") {
        throw new Error("Camera permission denied");
      }
      if (this.config!.audio && permissions.microphone === "denied") {
        throw new Error("Microphone permission denied");
      }

      // ลองเปิดกล้องด้วยความละเอียดที่กำหนดตามลำดับ
      for (const resolution of this.config!.resolutions) {
        try {
          console.log(
            `Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`
          );

          const constraints = this.buildConstraints(resolution);
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);

          // หากเปิดสำเร็จ ตั้งค่า preview element
          if (this.config!.previewElement) {
            this.config!.previewElement.srcObject = this.stream;
            this.config!.previewElement.style.transform = this.config!.mirror
              ? "scaleX(-1)"
              : "none";
            await this.config!.previewElement.play();
          }

          console.log(
            `Successfully opened camera with resolution: ${resolution.name}`
          );
          this.config!.onStart();
          return;
        } catch (error) {
          console.log(
            `Failed to open camera with resolution: ${resolution.name}. Error:`,
            error
          );
          // หากเปิดไม่สำเร็จ ลองความละเอียดถัดไป
          continue;
        }
      }

      // หากไม่สามารถเปิดด้วยความละเอียดที่กำหนดได้ทั้งหมด
      if (this.config!.allowAnyResolution) {
        console.log("Attempting to open camera with any supported resolution");
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              deviceId: { exact: this.config!.device },
            },
            audio: this.config!.audio,
          };

          this.stream = await navigator.mediaDevices.getUserMedia(constraints);

          // ดึงความละเอียดที่ได้
          const videoTrack = this.stream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();
          console.log(
            `Opened camera with resolution: ${settings.width}x${settings.height}`
          );

          if (this.config!.previewElement) {
            this.config!.previewElement.srcObject = this.stream;
            this.config!.previewElement.style.transform = this.config!.mirror
              ? "scaleX(-1)"
              : "none";
            await this.config!.previewElement.play();
          }

          this.config!.onStart();
        } catch (error) {
          console.error("Failed to open camera with any resolution:", error);
          throw new Error("Unable to open camera with any resolution");
        }
      } else {
        throw new Error(
          `Unable to open camera with specified resolutions: ${this.config!.resolutions.map(
            (r) => `${r.name} (${r.width}x${r.height})`
          ).join(", ")}`
        );
      }
    } catch (error) {
      this.config!.onError(error as Error);
      throw error;
    }
  }

  public stop(): void {
    this.checkConfiguration();
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.config!.previewElement) {
      this.config!.previewElement.srcObject = null;
    }
  }

  public isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  public getCurrentResolution(): Resolution | null {
    this.checkConfiguration();
    if (!this.stream) return null;

    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    return {
      name: "Current",
      width: this.config!.autoRotation
        ? settings.height || 0
        : settings.width || 0,
      height: this.config!.autoRotation
        ? settings.width || 0
        : settings.height || 0,
      aspectRatio: settings.aspectRatio,
    };
  }

  public updateConfig(newConfig: Partial<WebcamConfig>): void {
    this.checkConfiguration();
    const wasActive = this.isActive();
    if (wasActive) {
      this.stop();
    }

    this.config = { ...this.config!, ...newConfig };

    if (wasActive) {
      this.start().catch(this.config.onError);
    }
  }

  private buildConstraints(resolution: Resolution): MediaStreamConstraints {
    const videoConstraints: MediaTrackConstraints = {
      deviceId: { exact: this.config!.device },
    };

    if (this.config!.autoRotation) {
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
      audio: this.config!.audio,
    };
  }

  private handleDeviceOrientation(): void {
    if (!this.config!.previewElement) return;

    window.addEventListener("orientationchange", () => {
      const orientation = window.orientation;
      let rotation = "rotate(0deg)";

      if (orientation === 90) rotation = "rotate(-90deg)";
      else if (orientation === -90) rotation = "rotate(90deg)";
      else if (orientation === 180) rotation = "rotate(180deg)";

      this.config!.previewElement.style.transform = `${rotation}${
        this.config!.mirror ? " scaleX(-1)" : ""
      }`;
    });
  }
}
