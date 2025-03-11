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
export declare class Webcam {
    private config;
    private stream;
    private readonly defaultConfig;
    constructor();
    /**
     * ตั้งค่าการทำงานของ webcam
     * @param config การตั้งค่าต่างๆ
     */
    setupConfiguration(config: WebcamConfig): void;
    /**
     * ตรวจสอบว่าได้ตั้งค่าแล้วหรือยัง
     */
    private checkConfiguration;
    /**
     * ตรวจสอบสถานะการอนุญาตใช้งานกล้อง
     * @returns Promise<PermissionState> สถานะการอนุญาต ('granted', 'denied', 'prompt')
     */
    checkCameraPermission(): Promise<PermissionState>;
    /**
     * ตรวจสอบสถานะการอนุญาตใช้งานไมโครโฟน
     * @returns Promise<PermissionState> สถานะการอนุญาต ('granted', 'denied', 'prompt')
     */
    checkMicrophonePermission(): Promise<PermissionState>;
    /**
     * ขอสิทธิ์การใช้งานกล้องและไมโครโฟน
     * @returns Promise<{camera: PermissionState, microphone: PermissionState}> สถานะการอนุญาตของทั้งกล้องและไมโครโฟน
     */
    requestPermissions(): Promise<{
        camera: PermissionState;
        microphone: PermissionState;
    }>;
    start(): Promise<void>;
    stop(): void;
    isActive(): boolean;
    getCurrentResolution(): Resolution | null;
    updateConfig(newConfig: Partial<WebcamConfig>): void;
    private buildConstraints;
    private handleDeviceOrientation;
}
export {};
