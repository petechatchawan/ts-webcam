interface WebcamConfig {
  audio?: boolean;
  device?: string;
  resolution?: string[];
  fallbackResolution?: string;
  mirror?: boolean;
  autoRotation?: boolean;
  previewElement?: HTMLVideoElement;
  onStart?: () => void;
  onError?: (error: Error) => void;
}

export class Webcam {
  private config: Required<WebcamConfig>;
  private stream: MediaStream | null = null;
  private readonly defaultConfig: Required<WebcamConfig> = {
    audio: false,
    device: "",
    resolution: ["640x480"],
    fallbackResolution: "640x480",
    mirror: false,
    autoRotation: true,
    previewElement: undefined as unknown as HTMLVideoElement,
    onStart: () => {},
    onError: () => {},
  };

  constructor(config: WebcamConfig = {}) {
    this.config = { ...this.defaultConfig, ...config };
  }

  public async start(): Promise<void> {
    try {
      const constraints = this.buildConstraints();
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.config.previewElement) {
        this.config.previewElement.srcObject = this.stream;
        this.config.previewElement.style.transform = this.config.mirror
          ? "scaleX(-1)"
          : "none";
        await this.config.previewElement.play();
      }

      if (this.config.autoRotation) {
        this.handleDeviceOrientation();
      }

      this.config.onStart();
    } catch (error) {
      this.config.onError(error as Error);
      throw error;
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.config.previewElement) {
      this.config.previewElement.srcObject = null;
    }
  }

  public isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  public getCurrentResolution(): { width: number; height: number } | null {
    if (!this.stream) return null;

    const videoTrack = this.stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    return {
      width: settings.width || 0,
      height: settings.height || 0,
    };
  }

  public updateConfig(newConfig: Partial<WebcamConfig>): void {
    const wasActive = this.isActive();
    if (wasActive) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasActive) {
      this.start().catch(this.config.onError);
    }
  }

  private buildConstraints(): MediaStreamConstraints {
    const videoConstraints: MediaTrackConstraints = {
      deviceId: this.config.device ? { exact: this.config.device } : undefined,
    };

    // Parse resolution strings and add to constraints
    if (this.config.resolution.length > 0) {
      const [width, height] = this.parseResolution(this.config.resolution[0]);
      videoConstraints.width = { ideal: width };
      videoConstraints.height = { ideal: height };
    }

    return {
      video: videoConstraints,
      audio: this.config.audio,
    };
  }

  private parseResolution(resolution: string): [number, number] {
    const [width, height] = resolution.split("x").map(Number);
    return [width, height];
  }

  private handleDeviceOrientation(): void {
    if (!this.config.previewElement) return;

    window.addEventListener("orientationchange", () => {
      const orientation = window.orientation;
      let rotation = "rotate(0deg)";

      if (orientation === 90) rotation = "rotate(-90deg)";
      else if (orientation === -90) rotation = "rotate(90deg)";
      else if (orientation === 180) rotation = "rotate(180deg)";

      this.config.previewElement.style.transform = `${rotation}${
        this.config.mirror ? " scaleX(-1)" : ""
      }`;
    });
  }
}
