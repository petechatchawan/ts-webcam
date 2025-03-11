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
export declare class Webcam {
    private config;
    private stream;
    private readonly defaultConfig;
    constructor(config?: WebcamConfig);
    start(): Promise<void>;
    stop(): void;
    isActive(): boolean;
    getCurrentResolution(): {
        width: number;
        height: number;
    } | null;
    updateConfig(newConfig: Partial<WebcamConfig>): void;
    private buildConstraints;
    private parseResolution;
    private handleDeviceOrientation;
}
export {};
