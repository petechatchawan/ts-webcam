export type PermissionState = 'granted' | 'denied' | 'prompt';
export type CameraErrorCode = 'no-permissions-api' | 'permission-denied' | 'microphone-permission-denied' | 'configuration-error' | 'no-device' | 'no-media-devices-support' | 'invalid-device-id' | 'no-resolutions' | 'camera-start-error' | 'camera-initialization-error' | 'no-stream' | 'camera-settings-error' | 'camera-stop-error' | 'camera-already-in-use' | 'zoom-not-supported' | 'torch-not-supported' | 'focus-not-supported' | 'device-list-error' | 'unknown';
export declare class CameraError extends Error {
    code: CameraErrorCode;
    originalError?: Error | undefined;
    constructor(code: CameraErrorCode, message: string, originalError?: Error | undefined);
}
export interface Resolution {
    key: string;
    width: number;
    height: number;
}
export interface WebcamConfig {
    /** Enable/disable audio */
    audio?: boolean;
    /** Camera device ID (required) */
    device: MediaDeviceInfo;
    /** Desired resolution(s) (optional) */
    resolution?: Resolution | Resolution[];
    /** Allow any resolution if specified resolution is not available */
    allowAnyResolution?: boolean;
    /** Mirror display */
    mirror?: boolean;
    /** Auto-rotate resolution (swap width/height) */
    autoRotation?: boolean;
    /** Video preview element */
    previewElement?: HTMLVideoElement;
    /** Callback when camera starts successfully */
    onStart?: () => void;
    /** Callback when error occurs */
    onError?: (error: CameraError) => void;
}
/**
 * อินเตอร์เฟซสำหรับจัดการคุณสมบัติของกล้อง
 * ใช้สำหรับตรวจสอบและควบคุมฟีเจอร์ต่างๆ ของกล้อง เช่น การซูม ไฟฉาย และโหมดโฟกัส
 */
export interface CameraFeatures {
    /** กล้องรองรับการซูมหรือไม่ */
    hasZoom: boolean;
    /** กล้องมีไฟฉายหรือไม่ */
    hasTorch: boolean;
    /** กล้องรองรับการปรับโฟกัสหรือไม่ */
    hasFocus: boolean;
    /** ค่าซูมปัจจุบัน (เท่า) */
    currentZoom: number;
    /** ค่าซูมต่ำสุดที่รองรับ (เท่า) */
    minZoom: number;
    /** ค่าซูมสูงสุดที่รองรับ (เท่า) */
    maxZoom: number;
    /** สถานะไฟฉาย (เปิด/ปิด) */
    isTorchActive: boolean;
    /** สถานะการใช้งานโฟกัส */
    isFocusActive: boolean;
    /** โหมดโฟกัสที่กำลังใช้งาน เช่น 'auto', 'continuous', 'manual' */
    activeFocusMode: string;
    /** รายการโหมดโฟกัสที่รองรับทั้งหมด */
    availableFocusModes: string[];
}
export declare enum WebcamStatus {
    IDLE = "idle",
    INITIALIZING = "initializing",
    READY = "ready",
    ERROR = "error"
}
export type OrientationType = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary' | 'unknown';
export interface WebcamState {
    status: WebcamStatus;
    configuration: WebcamConfig | null;
    stream: MediaStream | null;
    lastError: CameraError | null;
    captureCanvas?: HTMLCanvasElement;
    devices: MediaDeviceInfo[];
    capabilities: CameraFeatures;
    currentOrientation?: OrientationType;
    currentPermission: {
        camera: PermissionState;
        microphone: PermissionState;
    };
}
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
    private readonly defaultConfiguration;
    constructor();
    setupConfiguration(configuration: WebcamConfig): void;
    start(): Promise<void>;
    stop(): void;
    isActive(): boolean;
    /**
     * ตรวจสอบว่าวิดีโอพร้อมแสดงผลหรือไม่
     * @returns Promise ที่คืนค่า true ถ้าวิดีโอพร้อมแสดงผล
     */
    previewIsReady(): Promise<boolean>;
    /**
     * ดึงค่า audio ปัจจุบัน
     * @returns ค่า audio ปัจจุบัน หรือ false ถ้าไม่มีการตั้งค่า
     */
    isAudioEnabled(): boolean;
    /**
     * ดึงค่า mirror mode ปัจจุบัน
     * @returns ค่า mirror ปัจจุบัน หรือ false ถ้าไม่มีการตั้งค่า
     */
    isMirror(): boolean;
    /**
     * ดึงค่า autoRotation ปัจจุบัน
     * @returns ค่า autoRotation ปัจจุบัน หรือ false ถ้าไม่มีการตั้งค่า
     */
    isAutoRotation(): boolean;
    /**
     * ดึงค่า allowAnyResolution ปัจจุบัน
     * @returns ค่า allowAnyResolution ปัจจุบัน หรือ false ถ้าไม่มีการตั้งค่า
     */
    isAllowAnyResolution(): boolean;
    private getAvailableDevices;
    getDeviceList(): MediaDeviceInfo[];
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    getAudioInputDevices(): Promise<MediaDeviceInfo[]>;
    getAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
    refreshDevices(): Promise<void>;
    getCurrentDevice(): MediaDeviceInfo | null;
    setupChangeListeners(): void;
    stopChangeListeners(): void;
    getWebcamState(): WebcamState;
    getWebcamStatus(): WebcamStatus;
    getLastError(): CameraError | null;
    clearError(): void;
    getCapabilities(): CameraFeatures;
    getCurrentResolution(): Resolution | null;
    setZoom(zoomLevel: number): Promise<void>;
    /**
     * Set the torch mode for the camera
     * @param active Whether to activate or deactivate the torch
     * @throws CameraError if torch is not supported or camera is not active
     */
    setTorch(active: boolean): Promise<void>;
    /**
     * Set the focus mode for the camera
     * @param mode The focus mode to set
     * @throws CameraError if focus mode is not supported or camera is not active
     */
    setFocusMode(mode: string): Promise<void>;
    /**
     * Update webcam configuration
     * @param configuration Configuration to update
     * @param options Additional options for updating
     * @returns Current configuration after update
     */
    updateConfiguration(configuration: Partial<WebcamConfig>, options?: {
        restart?: boolean;
    }): WebcamConfig;
    /**
     * Update resolution configuration
     * @param resolution Single resolution or array of resolutions in priority order
     * @returns Current configuration after update
     */
    updateResolution(resolution: Resolution | Resolution[]): WebcamConfig;
    /**
     * Update device configuration
     * @param deviceId ID of the camera device to use
     * @returns Current configuration after update
     */
    updateDevice(device: MediaDeviceInfo): WebcamConfig;
    /**
     * toggle boolean setting
     * @param setting setting to toggle ('mirror', 'autoRotation', 'allowAnyResolution', 'audio')
     * @returns Promise that returns the current value after toggling
     * @throws CameraError if microphone permission is denied
     */
    toggle(setting: 'mirror' | 'autoRotation' | 'allowAnyResolution' | 'audio'): Promise<boolean>;
    /**
     * Get current configuration
     * @returns Copy of current configuration
     */
    getConfiguration(): WebcamConfig;
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
    captureImage(config?: {
        scale?: number;
        mediaType?: 'image/png' | 'image/jpeg';
        quality?: number;
    }): string;
    checkDevicesCapabilitiesData(deviceId: string): Promise<DeviceCapabilitiesData>;
    checkSupportedResolutions(deviceCapabilities: DeviceCapabilitiesData[], desiredResolutions: Resolution[]): {
        resolutions: {
            key: string;
            width: number;
            height: number;
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
    /**
     * สร้าง Resolution ใหม่พร้อม Key
     * @param width ความกว้าง
     * @param height ความสูง
     * @returns Resolution object
     */
    createResolution(width: number, height: number): Resolution;
    /**
     * ตรวจสอบว่ากล้องรองรับการซูมหรือไม่
     * @returns true ถ้ากล้องรองรับการซูม, false ถ้าไม่รองรับ
     */
    isZoomSupported(): boolean;
    /**
     * ตรวจสอบว่ากล้องรองรับไฟฉายหรือไม่
     * @returns true ถ้ากล้องรองรับไฟฉาย, false ถ้าไม่รองรับ
     */
    isTorchSupported(): boolean;
    /**
     * ตรวจสอบว่ากล้องรองรับการโฟกัสหรือไม่
     * @returns true ถ้ากล้องรองรับการโฟกัส, false ถ้าไม่รองรับ
     */
    isFocusSupported(): boolean;
    getCurrentZoom(): number;
    getMinZoom(): number;
    getMaxZoom(): number;
    isTorchActive(): boolean;
    isFocusActive(): boolean;
    /**
     * สลับการเปิด/ปิดไฟฉาย
     * @returns สถานะไฟฉายหลังจากสลับ (true = เปิด, false = ปิด)
     * @throws CameraError ถ้าไม่รองรับไฟฉายหรือกล้องไม่ทำงาน
     */
    toggleTorch(): Promise<boolean>;
}
export default Webcam;
