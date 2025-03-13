export type PermissionState = 'granted' | 'denied' | 'prompt';
export type CameraErrorCode = 'no-permissions-api' | 'permission-denied' | 'microphone-permission-denied' | 'configuration-error' | 'no-device' | 'no-media-devices-support' | 'invalid-device-id' | 'no-resolutions' | 'camera-start-error' | 'camera-initialization-error' | 'no-stream' | 'camera-settings-error' | 'camera-stop-error' | 'camera-already-in-use' | 'zoom-not-supported' | 'torch-not-supported' | 'focus-not-supported' | 'device-list-error' | 'unknown';
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
    /** ความละเอียดที่ต้องการใช้งาน (optional) */
    resolution?: Resolution | Resolution[];
    /** อนุญาตให้ใช้ resolution อื่นได้ถ้าเปิดด้วย resolution ที่กำหนดไม่ได้ */
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
export declare enum WebcamStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    ERROR = "error"
}
export interface WebcamState {
    status: WebcamStatus;
    config: WebcamConfig | null;
    stream: MediaStream | null;
    lastError: CameraError | null;
    devices: MediaDeviceInfo[];
    capabilities: WebcamCapabilities;
    currentOrientation?: OrientationType;
    currentPermission: {
        camera: PermissionState;
        microphone: PermissionState;
    };
    captureCanvas?: HTMLCanvasElement;
}
export type OrientationType = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'unknown';
export interface DeviceCapabilitiesData {
    deviceId: string;
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
    supportedResolutions: {
        width: number;
        height: number;
        aspectRatio: number;
    }[];
    supportedFrameRates: number[];
    hasZoom: boolean;
    hasTorch: boolean;
    hasFocus: boolean;
    maxZoom?: number;
    minZoom?: number;
    supportedFocusModes?: string[];
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
    private getAvailableDevices;
    getDeviceList(): MediaDeviceInfo[];
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    getAudioInputDevices(): Promise<MediaDeviceInfo[]>;
    getAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
    refreshDevices(): Promise<void>;
    getCurrentDevice(): MediaDeviceInfo | null;
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
    checkMicrophonePermission(): Promise<PermissionState>;
    private requestMediaPermission;
    requestPermissions(): Promise<{
        camera: PermissionState;
        microphone: PermissionState;
    }>;
    getCurrentPermissions(): {
        camera: PermissionState;
        microphone: PermissionState;
    };
    needsPermissionRequest(): boolean;
    hasPermissionDenied(): boolean;
    toggleMirrorMode(): void;
    captureImage(config?: {
        scale?: number;
        mediaType?: 'image/png' | 'image/jpeg';
        quality?: number;
    }): string;
    checkDevicesCapabilitiesData(deviceId: string): Promise<DeviceCapabilitiesData>;
    checkSupportedResolutions(deviceCapabilities: DeviceCapabilitiesData[], desiredResolutions: Resolution[]): {
        resolutions: {
            name: string;
            width: number;
            height: number;
            aspectRatio: number;
            supported: boolean;
        }[];
        deviceInfo: {
            deviceId: string;
            maxWidth: number;
            maxHeight: number;
            minWidth: number;
            minHeight: number;
        };
    };
    private initializeWebcam;
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
    private validatePermissions;
}
