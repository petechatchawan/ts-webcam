export type PermissionState = "granted" | "denied" | "prompt";
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
export declare enum WebcamStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    ERROR = "error"
}
export declare class Webcam {
    private config;
    private stream;
    private status;
    private lastError;
    private devices;
    private deviceChangeCallbacks;
    private deviceChangeListener;
    private readonly defaultConfig;
    private capabilities;
    constructor();
    setupConfiguration(config: WebcamConfig): void;
    start(): Promise<void>;
    stop(): void;
    isActive(): boolean;
    onDeviceChange(callback: (devices: DeviceInfo[]) => void): void;
    getDeviceList(): DeviceInfo[];
    getVideoDevices(): DeviceInfo[];
    getAudioInputDevices(): DeviceInfo[];
    getAudioOutputDevices(): DeviceInfo[];
    getStatus(): WebcamStatus;
    getLastError(): Error | null;
    getCapabilities(): WebcamCapabilities;
    getCurrentResolution(): Resolution | null;
    setZoom(zoomLevel: number): Promise<void>;
    setTorch(active: boolean): Promise<void>;
    setFocusMode(mode: string): Promise<void>;
    updateConfig(newConfig: Partial<WebcamConfig>): void;
    checkCameraPermission(): Promise<PermissionState>;
    checkMicrophonePermission(): Promise<PermissionState>;
    requestPermissions(): Promise<{
        camera: PermissionState;
        microphone: PermissionState;
    }>;
    private initializeWebcam;
    private validatePermissions;
    private openCamera;
    private tryResolution;
    private tryAnyResolution;
    private setupPreviewElement;
    private updateCapabilities;
    private buildConstraints;
    private checkConfiguration;
    private handleError;
    private stopStream;
    private resetState;
    private startDeviceChangeTracking;
    private stopDeviceChangeTracking;
    private updateDeviceList;
}
