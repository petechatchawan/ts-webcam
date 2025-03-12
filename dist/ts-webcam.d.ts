export type PermissionState = "granted" | "denied" | "prompt";
export type CameraErrorCode = "no-permissions-api" | "permission-denied" | "microphone-permission-denied" | "configuration-error" | "no-device" | "no-media-devices-support" | "invalid-device-id" | "no-resolutions" | "camera-start-error" | "camera-initialization-error" | "no-stream" | "camera-settings-error" | "camera-stop-error" | "camera-already-in-use" | "zoom-not-supported" | "torch-not-supported" | "focus-not-supported" | "device-list-error" | "unknown";
export declare class CameraError extends Error {
    code: CameraErrorCode;
    originalError?: Error | undefined;
    constructor(code: CameraErrorCode, message: string, originalError?: Error | undefined);
}
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
export declare enum WebcamStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    ERROR = "error"
}
export interface WebcamState {
    status: WebcamStatus;
    config: Required<WebcamConfig> | null;
    stream: MediaStream | null;
    lastError: CameraError | null;
    devices: DeviceInfo[];
    capabilities: WebcamCapabilities;
}
export declare class Webcam {
    private state;
    private deviceChangeListener;
    private orientationChangeListener;
    private readonly defaultConfig;
    constructor();
    setupConfiguration(config: WebcamConfig): void;
    start(): Promise<void>;
    stop(): void;
    isActive(): boolean;
    startDeviceTracking(): void;
    stopDeviceTracking(): void;
    getDeviceList(): DeviceInfo[];
    getVideoDevices(): DeviceInfo[];
    getAudioInputDevices(): DeviceInfo[];
    getAudioOutputDevices(): DeviceInfo[];
    getCurrentDevice(): DeviceInfo | null;
    setupChangeListeners(): void;
    stopChangeListeners(): void;
    getState(): WebcamState;
    getStatus(): WebcamStatus;
    getLastError(): CameraError | null;
    clearError(): void;
    getCapabilities(): WebcamCapabilities;
    getCurrentResolution(): Resolution | null;
    setZoom(zoomLevel: number): Promise<void>;
    setTorch(active: boolean): Promise<void>;
    setFocusMode(mode: string): Promise<void>;
    updateConfig(newConfig: Partial<WebcamConfig>): void;
    checkCameraPermission(): Promise<PermissionState>;
    private checkCameraPermissionFallback;
    checkMicrophonePermission(): Promise<PermissionState>;
    private checkMicrophonePermissionFallback;
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
    private updateDeviceList;
}
