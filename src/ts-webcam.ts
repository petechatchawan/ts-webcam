// ===== Types =====
export type PermissionState = 'granted' | 'denied' | 'prompt';

export type CameraErrorCode =
    // Permission-related errors
    | 'no-permissions-api'
    | 'permission-denied'
    | 'microphone-permission-denied'
    // Device and configuration errors
    | 'configuration-error'
    | 'no-device'
    | 'no-media-devices-support'
    | 'invalid-device-id'
    | 'no-resolutions'
    // Camera initialization and operation errors
    | 'camera-start-error'
    | 'camera-initialization-error'
    | 'no-stream'
    | 'camera-settings-error'
    | 'camera-stop-error'
    | 'camera-already-in-use'
    // Camera functionality errors
    | 'zoom-not-supported'
    | 'torch-not-supported'
    | 'focus-not-supported'
    | 'device-list-error'
    // Miscellaneous errors
    | 'unknown';

// ===== Error Class =====
export class CameraError extends Error {
    constructor(
        public code: CameraErrorCode,
        message: string,
        public originalError?: Error,
    ) {
        super(message);
        this.name = 'CameraError';
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

// ===== MediaDevices API Extensions =====
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
    zoom?: {
        min: number;
        max: number;
        step: number;
    };
    torch?: boolean;
    focusMode?: string[];
    width?: {
        min: number;
        max: number;
        step: number;
    };
    height?: {
        min: number;
        max: number;
        step: number;
    };
    frameRate?: {
        min: number;
        max: number;
        step: number;
    };
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
    IDLE = 'idle',
    INITIALIZING = 'initializing',
    READY = 'ready',
    ERROR = 'error',
}

// ===== State Interface =====
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

// เพิ่ม type สำหรับ orientation
export type OrientationType =
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'unknown';

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
            currentFocusMode: 'none',
            supportedFocusModes: [],
        },
        currentOrientation: 'portrait-primary',
        currentPermission: {
            camera: 'prompt',
            microphone: 'prompt',
        },
        captureCanvas: document.createElement('canvas'),
    };

    private deviceChangeListener: (() => void) | null = null;
    private orientationChangeListener: (() => void) | null = null;

    // Default values
    private readonly defaultConfig: WebcamConfig = {
        audio: false,
        device: '',
        allowAnyResolution: false,
        mirror: false,
        autoRotation: true,
        previewElement: undefined as unknown as HTMLVideoElement,
        onStart: () => {},
        onError: () => {},
    };

    constructor() {
        // ไม่ต้องเรียก getAvailableDevices ตั้งแต่ constructor
        // สร้าง canvas element สำหรับการถ่ายภาพ
        const canvas = document.createElement('canvas');
        this.state = {
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
                currentFocusMode: 'none',
                supportedFocusModes: [],
            },
            captureCanvas: canvas,
            currentOrientation: 'portrait-primary',
            currentPermission: {
                camera: 'prompt',
                microphone: 'prompt',
            },
        };
    }

    // Public API methods
    public setupConfiguration(config: WebcamConfig): void {
        if (!config.device) {
            throw new CameraError('invalid-device-id', 'Device ID is required');
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
                    new CameraError('camera-start-error', 'Failed to start camera', error as Error),
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
    private async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                throw new CameraError(
                    'no-media-devices-support',
                    'MediaDevices API is not supported in this browser',
                );
            }

            this.state.devices = await navigator.mediaDevices.enumerateDevices();
            return [...this.state.devices];
        } catch (error) {
            this.handleError(
                new CameraError(
                    'device-list-error',
                    'ไม่สามารถดึงรายการอุปกรณ์ได้',
                    error as Error,
                ),
            );
            return [];
        }
    }

    public getDeviceList(): MediaDeviceInfo[] {
        return [...this.state.devices];
    }

    public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
        // ถ้ายังไม่มีข้อมูลอุปกรณ์ ให้เรียก getAvailableDevices ก่อน
        if (this.state.devices.length === 0) {
            await this.getAvailableDevices();
        }
        return this.state.devices.filter((device) => device.kind === 'videoinput');
    }

    public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
        // ถ้ายังไม่มีข้อมูลอุปกรณ์ ให้เรียก getAvailableDevices ก่อน
        if (this.state.devices.length === 0) {
            await this.getAvailableDevices();
        }
        return this.state.devices.filter((device) => device.kind === 'audioinput');
    }

    public async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
        // ถ้ายังไม่มีข้อมูลอุปกรณ์ ให้เรียก getAvailableDevices ก่อน
        if (this.state.devices.length === 0) {
            await this.getAvailableDevices();
        }
        return this.state.devices.filter((device) => device.kind === 'audiooutput');
    }

    public async refreshDevices(): Promise<void> {
        await this.getAvailableDevices();
    }

    public getCurrentDevice(): MediaDeviceInfo | null {
        if (!this.state.config?.device) return null;
        return (
            this.state.devices.find((device) => device.deviceId === this.state.config!.device) ||
            null
        );
    }

    public setupChangeListeners(): void {
        // ติดตามการเปลี่ยนแปลงอุปกรณ์
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            throw new CameraError(
                'no-media-devices-support',
                'MediaDevices API is not supported in this browser',
            );
        }

        // อัปเดตรายการอุปกรณ์ครั้งแรก
        this.refreshDevices();

        // ตั้งค่า device change listener
        this.deviceChangeListener = async () => {
            await this.refreshDevices();

            // ตรวจสอบว่าอุปกรณ์ปัจจุบันยังคงมีอยู่หรือไม่
            const currentDevice = this.getCurrentDevice();
            if (this.isActive() && !currentDevice) {
                // ถ้าอุปกรณ์ปัจจุบันหายไป ให้หยุดการทำงาน
                this.handleError(
                    new CameraError('no-device', 'Current device is no longer available'),
                );
                this.stop();
            }
        };

        // ตั้งค่า orientation change listener
        this.orientationChangeListener = () => {
            if (this.isActive()) {
                if (screen.orientation) {
                    console.log('Screen orientation is supported');
                    const orientation = screen.orientation.type as OrientationType;
                    const angle = screen.orientation.angle;
                    console.log(`Orientation type: ${orientation}, angle: ${angle}`);

                    // เก็บค่า orientation ปัจจุบัน
                    this.state.currentOrientation = orientation;

                    switch (orientation) {
                        case 'portrait-primary':
                            console.log('Portrait (ปกติ)');
                            break;
                        case 'portrait-secondary':
                            console.log('Portrait (กลับหัว)');
                            break;
                        case 'landscape-primary':
                            console.log('Landscape (ปกติ)');
                            break;
                        case 'landscape-secondary':
                            console.log('Landscape (กลับด้าน)');
                            break;
                        default:
                            console.log('Unknown orientation');
                            this.state.currentOrientation = 'unknown';
                    }
                } else {
                    console.log('screen.orientation is not supported');
                    this.state.currentOrientation = 'unknown';
                }
            }
        };

        // เพิ่ม listeners
        navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
        window.addEventListener('orientationchange', this.orientationChangeListener);
    }

    public stopChangeListeners(): void {
        // ลบ device change listener
        if (this.deviceChangeListener) {
            navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
            this.deviceChangeListener = null;
        }

        // ลบ orientation change listener
        if (this.orientationChangeListener) {
            window.removeEventListener('orientationchange', this.orientationChangeListener);
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
        // ถ้าไม่มี stream หรือไม่มี config ้คืนค่า null
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
        const matchedResolution =
            this.state.config.resolution instanceof Array
                ? this.state.config.resolution.find(
                      (r: Resolution) => r.width === currentWidth && r.height === currentHeight,
                  )
                : this.state.config.resolution;

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
                'zoom-not-supported',
                'Zoom is not supported or camera is not active',
            );
        }

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        if (!capabilities.zoom) {
            throw new CameraError('zoom-not-supported', 'Zoom is not supported by this device');
        }

        try {
            zoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
            await videoTrack.applyConstraints({
                advanced: [{ zoom: zoomLevel } as ExtendedMediaTrackConstraintSet],
            });
            this.state.capabilities.currentZoom = zoomLevel;
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to set zoom level',
                error as Error,
            );
        }
    }

    public async setTorch(active: boolean): Promise<void> {
        if (!this.state.stream || !this.state.capabilities.torch) {
            throw new CameraError(
                'torch-not-supported',
                'Torch is not supported or camera is not active',
            );
        }

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        if (!capabilities.torch) {
            throw new CameraError('torch-not-supported', 'Torch is not supported by this device');
        }

        try {
            await videoTrack.applyConstraints({
                advanced: [{ torch: active } as ExtendedMediaTrackConstraintSet],
            });
            this.state.capabilities.torchActive = active;
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to toggle torch',
                error as Error,
            );
        }
    }

    public async setFocusMode(mode: string): Promise<void> {
        if (!this.state.stream || !this.state.capabilities.focusMode) {
            throw new CameraError(
                'focus-not-supported',
                'Focus mode is not supported or camera is not active',
            );
        }

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

        if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
            throw new CameraError(
                'focus-not-supported',
                `Focus mode ${mode} is not supported by this device`,
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
                'camera-settings-error',
                'Failed to set focus mode',
                error as Error,
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
            if (navigator?.permissions?.query) {
                const { state } = await navigator.permissions.query({
                    name: 'camera' as PermissionName,
                });
                this.state.currentPermission.camera = state as PermissionState;
                return state as PermissionState;
            }
            this.state.currentPermission.camera = 'prompt';
            return 'prompt';
        } catch (error) {
            console.warn('Permissions API error:', error);
            this.state.currentPermission.camera = 'prompt';
            return 'prompt';
        }
    }

    public async checkMicrophonePermission(): Promise<PermissionState> {
        try {
            if (navigator?.permissions?.query) {
                const { state } = await navigator.permissions.query({
                    name: 'microphone' as PermissionName,
                });
                this.state.currentPermission.microphone = state as PermissionState;
                return state as PermissionState;
            }

            this.state.currentPermission.microphone = 'prompt';
            return 'prompt';
        } catch (error) {
            console.warn('Permissions API error:', error);
            this.state.currentPermission.microphone = 'prompt';
            return 'prompt';
        }
    }

    private async requestMediaPermission(mediaType: 'video' | 'audio'): Promise<PermissionState> {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                [mediaType]: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
            this.state.currentPermission[permissionType] = 'granted';
            return 'granted';
        } catch (error) {
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
                    this.state.currentPermission[permissionType] = 'denied';
                    return 'denied';
                }
            }
            const permissionType = mediaType === 'video' ? 'camera' : 'microphone';
            this.state.currentPermission[permissionType] = 'prompt';
            return 'prompt';
        }
    }

    public async requestPermissions(): Promise<{
        camera: PermissionState;
        microphone: PermissionState;
    }> {
        // ขอสิทธิ์กล้องก่อนเสมอ
        const cameraPermission = await this.requestMediaPermission('video');

        // ขอสิทธิ์ไมโครโฟนเฉพาะเมื่อต้องการใช้งาน
        let microphonePermission: PermissionState = 'prompt';
        if (this.state.config?.audio) {
            microphonePermission = await this.requestMediaPermission('audio');
        }

        return {
            camera: cameraPermission,
            microphone: microphonePermission,
        };
    }

    // เพิ่มเมธอดใหม่สำหรับตรวจสอบสถานะสิทธิ์ปัจจุบัน
    public getCurrentPermissions(): {
        camera: PermissionState;
        microphone: PermissionState;
    } {
        return { ...this.state.currentPermission };
    }

    // เพิ่มเมธอดสำหรับตรวจสอบว่าต้องขอสิทธิ์หรือไม่
    public needsPermissionRequest(): boolean {
        return (
            this.state.currentPermission.camera === 'prompt' ||
            (!!this.state.config?.audio && this.state.currentPermission.microphone === 'prompt')
        );
    }

    // เพิ่มเมธอดสำหรับตรวจสอบว่าถูกปฏิเสธสิทธิ์หรือไม่
    public hasPermissionDenied(): boolean {
        return (
            this.state.currentPermission.camera === 'denied' ||
            (!!this.state.config?.audio && this.state.currentPermission.microphone === 'denied')
        );
    }

    // เพิ่มฟังก์ชัน toggleMirrorMode
    public toggleMirrorMode(): void {
        this.checkConfiguration();
        this.state.config!.mirror = !this.state.config!.mirror;
        if (this.state.config!.previewElement) {
            this.state.config!.previewElement.style.transform = this.state.config!.mirror
                ? 'scaleX(-1)'
                : 'none';
        }
    }

    // ฟังก์ชันสำหรับถ่ายภาพ
    public captureImage(
        config: {
            scale?: number;
            mediaType?: 'image/png' | 'image/jpeg';
            quality?: number; // 0.0 - 1.0
        } = {},
    ): string {
        this.checkConfiguration();
        if (!this.state.stream) {
            throw new CameraError('no-stream', 'No active stream to capture image from');
        }

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        // ใช้ canvas จาก state
        const canvas = this.state.captureCanvas!;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new CameraError('camera-settings-error', 'Failed to get canvas context');
        }

        const scale = config.scale || 1;
        canvas.width = (settings.width || 640) * scale;
        canvas.height = (settings.height || 480) * scale;

        if (this.state.config!.mirror) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }

        context.drawImage(this.state.config!.previewElement!, 0, 0, canvas.width, canvas.height);

        // รีเซ็ต transform matrix
        if (this.state.config!.mirror) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }

        const mediaType = config.mediaType || 'image/png';
        const quality =
            typeof config.quality === 'number'
                ? Math.min(Math.max(config.quality, 0), 1) // ควบคุมค่าให้อยู่ระหว่าง 0-1
                : mediaType === 'image/jpeg'
                  ? 0.92
                  : undefined; // ค่า default สำหรับ JPEG

        return canvas.toDataURL(mediaType, quality);
    }

    // เพิ่มฟังก์ชันตรวจสอบความสามารถของกล้อง
    public async checkDevicesCapabilitiesData(deviceId: string): Promise<DeviceCapabilitiesData> {
        try {
            // ขอสิทธิ์การใช้งานกล้องก่อน
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
            });

            const videoTrack = stream.getVideoTracks()[0];
            const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

            // เก็บข้อมูลความละเอียดที่รองรับ
            const supportedResolutions: { width: number; height: number; aspectRatio: number }[] =
                [];

            // ตรวจสอบ width และ height ที่รองรับ
            if (
                capabilities.width?.max &&
                capabilities.width?.min &&
                capabilities.width?.step &&
                capabilities.height?.max &&
                capabilities.height?.min &&
                capabilities.height?.step
            ) {
                const widths = Array.from(
                    {
                        length:
                            Math.floor(
                                (capabilities.width.max - capabilities.width.min) /
                                    capabilities.width.step,
                            ) + 1,
                    },
                    (_, i) => capabilities.width!.min + i * capabilities.width!.step,
                );
                const heights = Array.from(
                    {
                        length:
                            Math.floor(
                                (capabilities.height.max - capabilities.height.min) /
                                    capabilities.height.step,
                            ) + 1,
                    },
                    (_, i) => capabilities.height!.min + i * capabilities.height!.step,
                );

                // สร้างรายการ resolution ที่เป็นไปได้
                for (const width of widths) {
                    for (const height of heights) {
                        const aspectRatio = width / height;
                        // กรองเฉพาะ resolution ที่มี aspect ratio มาตรฐาน (เช่น 16:9, 4:3)
                        if (
                            Math.abs(aspectRatio - 16 / 9) < 0.1 ||
                            Math.abs(aspectRatio - 4 / 3) < 0.1
                        ) {
                            supportedResolutions.push({
                                width,
                                height,
                                aspectRatio,
                            });
                        }
                    }
                }
            }

            // เก็บข้อมูล frame rate ที่รองรับ
            const frameRates: number[] = [];
            if (
                capabilities.frameRate?.min &&
                capabilities.frameRate?.max &&
                capabilities.frameRate?.step
            ) {
                const { min, max, step } = capabilities.frameRate;
                for (let fps = min; fps <= max; fps += step) {
                    frameRates.push(fps);
                }
            }

            // หยุดการใช้งานกล้อง
            stream.getTracks().forEach((track) => track.stop());

            return {
                deviceId,
                maxWidth: capabilities.width?.max || 0,
                maxHeight: capabilities.height?.max || 0,
                minWidth: capabilities.width?.min || 0,
                minHeight: capabilities.height?.min || 0,
                supportedResolutions,
                supportedFrameRates: frameRates,
                hasZoom: !!capabilities.zoom,
                hasTorch: !!capabilities.torch,
                hasFocus: !!capabilities.focusMode,
                maxZoom: capabilities.zoom?.max,
                minZoom: capabilities.zoom?.min,
                supportedFocusModes: capabilities.focusMode,
            };
        } catch (error) {
            throw new CameraError(
                'camera-settings-error',
                'Failed to check device capabilities',
                error as Error,
            );
        }
    }

    // เพิ่มฟังก์ชันตรวจสอบ resolution ที่รองรับ
    public checkSupportedResolutions(
        deviceCapabilities: DeviceCapabilitiesData[],
        desiredResolutions: Resolution[],
    ): {
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
    } {
        // เลือกใช้ความสามารถของกล้องตัวแรก (หรือจะให้เลือกได้)
        const capability = deviceCapabilities[0];

        // สร้างข้อมูลอุปกรณ์
        const deviceInfo = {
            deviceId: capability.deviceId,
            maxWidth: capability.maxWidth,
            maxHeight: capability.maxHeight,
            minWidth: capability.minWidth,
            minHeight: capability.minHeight,
        };

        // ตรวจสอบแต่ละ resolution
        const resolutions = desiredResolutions.map((resolution) => {
            // ตรวจสอบว่า resolution อยู่ในช่วงที่รองรับหรือไม่
            // กล้องจะรองรับถ้า width และ height ไม่เกินค่าสูงสุดที่กล้องรองรับ
            const isSupported =
                resolution.width <= capability.maxWidth &&
                resolution.height <= capability.maxHeight &&
                resolution.width >= capability.minWidth &&
                resolution.height >= capability.minHeight;

            return {
                name: resolution.name,
                width: resolution.width,
                height: resolution.height,
                aspectRatio: resolution.aspectRatio || resolution.width / resolution.height,
                supported: isSupported,
            };
        });

        return {
            resolutions,
            deviceInfo,
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

    private async openCamera(): Promise<void> {
        // ถ้ามีการกำหนด resolution ให้ลองใช้ตามที่กำหนด
        if (this.state.config!.resolution) {
            const resolutions =
                this.state.config!.resolution instanceof Array
                    ? this.state.config!.resolution
                    : [this.state.config!.resolution];

            for (const resolution of resolutions) {
                try {
                    await this.tryResolution(resolution);
                    return;
                } catch (error) {
                    console.log(
                        `Failed to open camera with resolution: ${resolution.name}. Error:`,
                        error,
                    );
                    // ถ้าไม่สามารถเปิดด้วย resolution ที่กำหนดได้
                    // และไม่ได้กำหนด allowAnyResolution ให้แจ้ง error
                    if (!this.state.config!.allowAnyResolution) {
                        throw new CameraError(
                            'camera-initialization-error',
                            `Cannot open camera with specified resolution: ${resolution.name}`,
                            error as Error,
                        );
                    }
                    continue;
                }
            }
        }

        // ถ้าไม่มีการกำหนด resolution หรือ allowAnyResolution เป็น true
        // ให้ใช้ resolution ที่กล้องรองรับ
        await this.tryAnyResolution();
    }

    private async tryResolution(resolution: Resolution): Promise<void> {
        console.log(
            `Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`,
        );

        const constraints = this.buildConstraints(resolution);
        this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);

        await this.updateCapabilities();
        await this.setupPreviewElement();

        console.log(`Successfully opened camera with resolution: ${resolution.name}`);
        this.state.status = WebcamStatus.READY;
        this.state.config?.onStart?.();
    }

    private async tryAnyResolution(): Promise<void> {
        console.log('Attempting to open camera with any supported resolution');

        // ขอข้อมูลความสามารถของกล้องก่อน
        const devices = await navigator.mediaDevices.enumerateDevices();
        const device = devices.find((d) => d.deviceId === this.state.config!.device);

        if (!device) {
            throw new CameraError('no-device', 'Selected device not found');
        }

        // สร้าง constraints โดยไม่ระบุ resolution
        const constraints: MediaStreamConstraints = {
            video: {
                deviceId: { exact: this.state.config!.device },
            },
            audio: this.state.config!.audio,
        };

        try {
            this.state.stream = await navigator.mediaDevices.getUserMedia(constraints);
            await this.updateCapabilities();
            await this.setupPreviewElement();

            const videoTrack = this.state.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            console.log(`Opened camera with resolution: ${settings.width}x${settings.height}`);

            this.state.status = WebcamStatus.READY;
            this.state.config?.onStart?.();
        } catch (error) {
            throw new CameraError(
                'camera-initialization-error',
                'Failed to initialize camera with any resolution',
                error as Error,
            );
        }
    }

    private async setupPreviewElement(): Promise<void> {
        if (this.state.config!.previewElement && this.state.stream) {
            this.state.config!.previewElement.srcObject = this.state.stream;
            this.state.config!.previewElement.style.transform = this.state.config!.mirror
                ? 'scaleX(-1)'
                : 'none';
            await this.state.config!.previewElement.play();
        }
    }

    private async updateCapabilities(): Promise<void> {
        if (!this.state.stream) return;

        const videoTrack = this.state.stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
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
            currentFocusMode: settings.focusMode || 'none',
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
                'configuration-error',
                'Please call setupConfiguration() before using webcam',
            );
        }
    }

    private handleError(error: Error): void {
        // เก็บ error และเปลี่ยนสถานะเป็น ERROR
        this.state.status = WebcamStatus.ERROR;
        this.state.lastError =
            error instanceof CameraError ? error : new CameraError('unknown', error.message, error);

        // เรียก callback onError ถ้ามี config
        this.state.config?.onError?.(this.state.lastError as CameraError);
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

        // Reset เฉพาะ state ที่เกี่ยวข้อมูลพื้นฐานของระบบไว้
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
                currentFocusMode: 'none',
                supportedFocusModes: [],
            },
            // คงค่า state ที่เป็นข้อมูลพื้นฐานของระบบไว้
            // config: this.state.config,  // คง config ไว้เพื่อใช้ในการเริ่มกล้องใหม่
            // devices: [...this.state.devices],
            // currentOrientation: this.state.currentOrientation,
            // currentPermission: { ...this.state.currentPermission },
        };
    }

    private validatePermissions(permissions: {
        camera: PermissionState;
        microphone: PermissionState;
    }): void {
        if (permissions.camera === 'denied') {
            throw new CameraError('permission-denied', 'กรุณาอนุญาตให้ใช้งานกล้อง');
        }
        if (this.state.config!.audio && permissions.microphone === 'denied') {
            throw new CameraError('microphone-permission-denied', 'กรุณาอนุญาตให้ใช้งานไมโครโฟน');
        }
    }
}
