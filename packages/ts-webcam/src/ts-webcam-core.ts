// Main TsWebcam class
import { WebcamError, WebcamErrorCode } from './errors';
import { EventEmitter } from './event-emitter';
import {
    DeviceCapability,
    PermissionRequestOptions,
    Resolution,
    TsWebcamEvents,
    TsWebcamState,
    TsWebcamStateInternal,
    WebcamConfiguration
} from './types';

export class TsWebcam extends EventEmitter<TsWebcamEvents> {
    private state: TsWebcamStateInternal = {
        status: 'idle',
        activeStream: null,
        permissions: {},
        error: null
    };
    private _deviceChangeListener?: () => void;
    private _disposed = false;

    constructor() {
        super();
    }

    // --- 1. State & Event ---
    getState(): TsWebcamState {
        this._ensureNotDisposed();
        return { ...this.state };
    }

    // --- 2. Permissions & Device Enumeration ---
    async checkPermissions(): Promise<Record<string, PermissionState>> {
        this._ensureNotDisposed();
        const permissions: Record<string, PermissionState> = {};
        // ตรวจสอบ permission ของกล้อง
        try {
            // @ts-ignore: navigator.permissions อาจไม่มีในบาง browser
            const cameraPerm = await navigator.permissions.query({ name: 'camera' as PermissionName });
            permissions['camera'] = cameraPerm.state;
            this.emit('permission:change', cameraPerm);
        } catch {
            permissions['camera'] = 'prompt';
        }
        // ตรวจสอบ permission ของไมโครโฟน
        try {
            // @ts-ignore
            const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            permissions['microphone'] = micPerm.state;
            this.emit('permission:change', micPerm);
        } catch {
            permissions['microphone'] = 'prompt';
        }
        this.state.permissions = permissions;
        return permissions;
    }

    /**
     * ตรวจสอบ permission ของกล้อง
     */
    async checkCameraPermission(): Promise<PermissionStatus> {
        this._ensureNotDisposed();
        try {
            // @ts-ignore
            const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
            this.state.permissions['camera'] = status.state;
            this.emit('permission:change', status);
            return status;
        } catch {
            // fallback ถ้า browser ไม่รองรับ
            this.state.permissions['camera'] = 'prompt';
            return { state: 'prompt' } as PermissionStatus;
        }
    }

    /**
     * ตรวจสอบ permission ของไมโครโฟน
     */
    async checkMicrophonePermission(): Promise<PermissionStatus> {
        this._ensureNotDisposed();
        try {
            // @ts-ignore
            const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            this.state.permissions['microphone'] = status.state;
            this.emit('permission:change', status);
            return status;
        } catch {
            this.state.permissions['microphone'] = 'prompt';
            return { state: 'prompt' } as PermissionStatus;
        }
    }

    /**
     * คืนค่า permission state ปัจจุบัน
     */
    getPermissionStates(): Record<string, PermissionState> {
        this._ensureNotDisposed();
        return { ...this.state.permissions };
    }

    /**
     * ขอ permission กล้องและ/หรือไมค์ ตามที่เลือก
     * @param options การตั้งค่าการขอ permission
     */
    async requestPermissions(options: PermissionRequestOptions = { video: true, audio: true }): Promise<Record<string, PermissionState>> {
        this._ensureNotDisposed();

        // Default values
        const { video = true, audio = true } = options;

        if (!video && !audio) {
            throw new WebcamError(
                'ต้องระบุให้ขอ permission อย่างน้อยหนึ่งอย่าง (video หรือ audio)',
                WebcamErrorCode.INVALID_CONFIG
            );
        }

        let tempStream: MediaStream | null = null;
        try {
            // ขอ permission ตามที่เลือก
            tempStream = await navigator.mediaDevices.getUserMedia({
                video: video,
                audio: audio
            });
            // ปิด stream ทันทีหลังได้ permission
            tempStream.getTracks().forEach(track => track.stop());
            tempStream = null;
        } catch (err) {
            // ถ้าโดนปฏิเสธ permission
            if (video) this.state.permissions['camera'] = 'denied';
            if (audio) this.state.permissions['microphone'] = 'denied';
            this.stopCamera();

            let errorMessage = 'ผู้ใช้ปฏิเสธการอนุญาต';
            if (video && audio) {
                errorMessage += 'กล้องหรือไมโครโฟน';
            } else if (video) {
                errorMessage += 'กล้อง';
            } else {
                errorMessage += 'ไมโครโฟน';
            }

            const error = new WebcamError(errorMessage, WebcamErrorCode.PERMISSION_DENIED);
            this.emit('error', error);
            throw error;
        } finally {
            // ปิด stream ใน finally block เพื่อความแน่ใจ
            if (tempStream) {
                tempStream.getTracks().forEach(track => track.stop());
            }
        }

        // ตรวจสอบสถานะอีกครั้งตามที่ขอ
        if (video) await this.checkCameraPermission();
        if (audio) await this.checkMicrophonePermission();

        return { ...this.state.permissions };
    }

    /**
     * ขอ permission เฉพาะกล้อง
     */
    async requestCameraPermission(): Promise<PermissionState> {
        this._ensureNotDisposed();
        let tempStream: MediaStream | null = null;
        try {
            tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            // ปิด stream ทันทีหลังได้ permission
            tempStream.getTracks().forEach(track => track.stop());
            tempStream = null;
            // ตรวจสอบสถานะอีกครั้ง
            const status = await this.checkCameraPermission();
            return status.state;
        } catch (err) {
            this.state.permissions['camera'] = 'denied';
            this.stopCamera();
            const error = new WebcamError(
                'ผู้ใช้ปฏิเสธการอนุญาตกล้อง',
                WebcamErrorCode.PERMISSION_DENIED
            );
            this.emit('error', error);
            throw error;
        } finally {
            if (tempStream) {
                tempStream.getTracks().forEach(track => track.stop());
            }
        }
    }

    /**
     * ขอ permission เฉพาะไมโครโฟน
     */
    async requestMicrophonePermission(): Promise<PermissionState> {
        this._ensureNotDisposed();
        let tempStream: MediaStream | null = null;
        try {
            tempStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
            // ปิด stream ทันทีหลังได้ permission
            tempStream.getTracks().forEach(track => track.stop());
            tempStream = null;
            // ตรวจสอบสถานะอีกครั้ง
            const status = await this.checkMicrophonePermission();
            return status.state;
        } catch (err) {
            this.state.permissions['microphone'] = 'denied';
            const error = new WebcamError(
                'ผู้ใช้ปฏิเสธการอนุญาตไมโครโฟน',
                WebcamErrorCode.PERMISSION_DENIED
            );
            this.emit('error', error);
            throw error;
        } finally {
            if (tempStream) {
                tempStream.getTracks().forEach(track => track.stop());
            }
        }
    }

    /**
     * ตรวจสอบว่าถูกปฏิเสธ permission หรือไม่
     */
    isPermissionDenied(): boolean {
        this._ensureNotDisposed();
        return (
            this.state.permissions['camera'] === 'denied' ||
            this.state.permissions['microphone'] === 'denied'
        );
    }

    /**
     * คืนค่ากล้อง (video input devices) ทั้งหมด
     */
    async getVideoDevices(): Promise<MediaDeviceInfo[]> {
        this._ensureNotDisposed();
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((d: MediaDeviceInfo) => d.kind === 'videoinput');
    }

    /**
     * ดึง capabilities ของกล้องจาก deviceId (แบบละเอียด)
     */
    async getDeviceCapabilities(deviceId: string): Promise<DeviceCapability> {
        this._ensureNotDisposed();
        const devices = await this.getVideoDevices();
        const device = devices.find((d) => d.deviceId === deviceId);
        if (!device) {
            throw new WebcamError('ไม่พบกล้องที่ระบุ', WebcamErrorCode.DEVICE_NOT_FOUND);
        }
        let stream: MediaStream | null = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities ? track.getCapabilities() : {};
            const settings = track.getSettings ? track.getSettings() : {};
            const result: DeviceCapability = {
                deviceId: device.deviceId,
                label: device.label,
                maxWidth: capabilities.width?.max ?? 1920,
                maxHeight: capabilities.height?.max ?? 1080,
                minWidth: capabilities.width?.min ?? 320,
                minHeight: capabilities.height?.min ?? 240,
                hasZoom: 'zoom' in capabilities,
                hasTorch: 'torch' in capabilities,
                hasFocus: 'focusMode' in capabilities,
                maxZoom: (capabilities as any).zoom?.max,
                minZoom: (capabilities as any).zoom?.min,
                supportedFocusModes: (capabilities as any).focusMode,
                supportedFrameRates: capabilities.frameRate
                    ? [capabilities.frameRate.min ?? 0, capabilities.frameRate.max ?? 30]
                    : undefined
            };
            return result;
        } catch (err) {
            throw new WebcamError('ไม่สามารถอ่าน capabilities ของกล้อง', WebcamErrorCode.DEVICES_ERROR);
        } finally {
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
        }
    }

    // --- 3. Camera Lifecycle (Start/Stop/Switch/Resolution) ---
    async startCamera(config: WebcamConfiguration): Promise<MediaStream> {
        this._ensureNotDisposed();
        // 1. ตรวจสอบ config
        if (!config || !config.deviceInfo) {
            throw new WebcamError(
                'Config ไม่ถูกต้องหรือไม่ได้ระบุ deviceInfo',
                WebcamErrorCode.INVALID_CONFIG
            );
        }

        if (!config.videoElement) {
            throw new WebcamError('ต้องระบุ videoElement', WebcamErrorCode.VIDEO_ELEMENT_NOT_SET);
        }

        // 2. เซ็ต config ลง state
        this.state.deviceInfo = config.deviceInfo;
        this.state.videoElement = config.videoElement;
        // 3. Normalize preferredResolutions
        let preferredResolutions: Resolution[] = [];
        if (config.preferredResolutions) {
            preferredResolutions = Array.isArray(config.preferredResolutions)
                ? config.preferredResolutions
                : [config.preferredResolutions];
        }
        // 4. เตรียม constraints สำหรับแต่ละ resolution
        const constraintsList: MediaStreamConstraints[] = preferredResolutions.map((res) => {
            let width = res.width;
            let height = res.height;
            // ถ้า allowAutoRotateResolution === true และ width < height ให้สลับค่า
            if (config.allowAutoRotateResolution && width > height) {
                [width, height] = [height, width];
            }
            const videoConstraints: any = {
                deviceId: { exact: config.deviceInfo.deviceId },
                width: { exact: width },
                height: { exact: height }
            };

            return {
                video: videoConstraints,
                audio: !!config.enableAudio
            };
        });
        // Fallback: ถ้า allowAnyResolution ให้เพิ่ม constraints ที่ไม่มี width/height/aspectRatio
        if (config.allowAnyResolution) {
            constraintsList.push({
                video: { deviceId: { exact: config.deviceInfo.deviceId } },
                audio: !!config.enableAudio
            });
        }
        // ...เตรียม constraints พร้อมสำหรับวนลูปเปิดกล้องจริง
        // 5. วนลูปเปิดกล้องตาม constraints ทีละอัน
        let lastError: any = null;
        this.state.status = 'initializing';
        for (const constraints of constraintsList) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                // สำเร็จ: attach stream, mirror, emit, call onStart, set state
                config.videoElement.srcObject = stream;
                if (config.enableMirror) {
                    config.videoElement.style.transform = 'scaleX(-1)';
                } else {
                    config.videoElement.style.transform = '';
                }
                this.state.status = 'ready';
                this.state.activeStream = stream;
                this.state.error = null;
                this.emit('stream:start', stream);
                this.emit('state:change', this.getState());
                return stream;
            } catch (err) {
                lastError = err;
                if (config.debug) {
                    // eslint-disable-next-line no-console
                    console.warn('เปิดกล้องด้วย constraints ล้มเหลว', constraints, err);
                }
                // ลอง constraints ถัดไป
            }
        }
        // ถ้าทุก constraints ล้มเหลว
        const error = new WebcamError('เปิดกล้องไม่สำเร็จ', WebcamErrorCode.STREAM_FAILED);
        if (lastError?.message) {
            error.message += ` (${lastError.message})`;
        }
        this.state.status = 'error';
        this.state.error = error;
        this.emit('error', error);
        this.emit('state:change', this.getState());
        throw error;
    }

    stopCamera() {
        this._ensureNotDisposed();
        if (this.state.activeStream) {
            this.state.activeStream.getTracks().forEach((t) => t.stop());
            this.state.activeStream = null;
            this.state.status = 'idle';
            this.emit('stream:stop', undefined);
            this.emit('state:change', this.getState());
            if (this.state.videoElement) {
                this.state.videoElement.srcObject = null;
                this.state.videoElement.style.transform = '';
            }
        }
    }

    /**
     * เปลี่ยนกล้องไปยัง deviceId ที่ระบุ
     */
    async switchDevice(deviceId: string): Promise<MediaStream> {
        this._ensureNotDisposed();
        this.stopCamera();
        // ดึง deviceInfo ตัวใหม่จาก getVideoDevices
        const devices = await this.getVideoDevices();
        const deviceInfo = devices.find((d) => d.deviceId === deviceId);
        if (!deviceInfo) {
            throw new WebcamError('ไม่พบกล้องที่ระบุ', WebcamErrorCode.DEVICE_NOT_FOUND);
        }
        const config: WebcamConfiguration = {
            deviceInfo,
            preferredResolutions: [],
            videoElement: this.state.videoElement!,
            enableAudio: false,
            enableMirror: false,
            allowAnyResolution: false,
            allowAutoRotateResolution: false,
            debug: false
        };
        return this.startCamera(config);
    }

    /**
     * เปลี่ยน resolution ของกล้องขณะทำงาน
     */
    async switchResolution(resolution: Resolution): Promise<MediaStream> {
        this._ensureNotDisposed();
        if (this.state.status !== 'ready' || !this.state.videoElement) {
            throw new WebcamError('กล้องยังไม่ทำงาน', WebcamErrorCode.DEVICE_BUSY);
        }
        // หยุดกล้องชั่วคราว
        this.stopCamera();
        // เริ่มกล้องใหม่ด้วย resolution ที่ต้องการ
        const config: WebcamConfiguration = {
            deviceInfo: this.state.deviceInfo!,
            preferredResolutions: resolution,
            videoElement: this.state.videoElement,
            enableAudio: false,
            enableMirror: false,
            allowAnyResolution: false,
            allowAutoRotateResolution: false,
            debug: false
        };
        return this.startCamera(config);
    }

    /**
     * Start camera with custom constraints (advanced usage)
     */
    async startCameraWithConstraints(
        constraints: MediaStreamConstraints,
        videoElement?: HTMLVideoElement
    ): Promise<MediaStream> {
        this._ensureNotDisposed();
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoElement) {
                videoElement.srcObject = stream;
                this.state.videoElement = videoElement;
            }
            this.state.status = 'ready';
            this.state.activeStream = stream;
            this.emit('stream:start', stream);
            this.emit('state:change', this.getState());
            return stream;
        } catch (err) {
            const error = new WebcamError(
                'เปิดกล้องด้วย custom constraints ไม่สำเร็จ',
                WebcamErrorCode.STREAM_FAILED
            );
            this.emit('error', error);
            throw error;
        }
    }

    // --- 4. Camera Controls (Zoom, Torch, Focus, etc.) ---
    /**
     * Check if zoom is supported
     */
    async isZoomSupported(): Promise<boolean> {
        this._ensureNotDisposed();
        if (!this.state.activeStream) return false;
        const track = this.state.activeStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        return !!(capabilities && 'zoom' in capabilities);
    }

    /**
     * Get current zoom value
     */
    async getZoom(): Promise<number | null> {
        this._ensureNotDisposed();
        if (!this.state.activeStream) return null;
        const track = this.state.activeStream.getVideoTracks()[0];
        // @ts-ignore: zoom is not in official MediaTrackSettings type
        const settings = track.getSettings?.();
        // @ts-ignore
        return settings?.zoom ?? null;
    }

    /**
     * Get zoom range (min/max)
     */
    async getZoomRange(): Promise<{ min: number; max: number } | null> {
        this._ensureNotDisposed();
        if (!this.state.activeStream) return null;
        const track = this.state.activeStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        if (capabilities && 'zoom' in capabilities) {
            return {
                min: (capabilities as any).zoom.min,
                max: (capabilities as any).zoom.max
            };
        }
        return null;
    }

    /**
     * Set zoom value (within range)
     */
    async setZoom(value: number): Promise<void> {
        this._ensureNotDisposed();
        if (!this.state.activeStream)
            throw new WebcamError('กล้องยังไม่ทำงาน', WebcamErrorCode.DEVICE_BUSY);
        const track = this.state.activeStream.getVideoTracks()[0];
        // @ts-ignore: zoom is not in official spec but supported by some browsers
        const capabilities = track.getCapabilities?.();
        if (!(capabilities && 'zoom' in capabilities)) {
            throw new WebcamError('กล้องนี้ไม่รองรับการซูม', WebcamErrorCode.ZOOM_NOT_SUPPORTED);
        }
        // @ts-ignore: zoom property is not in official spec
        const range = (capabilities as any).zoom;
        if (value < range.min || value > range.max) {
            throw new WebcamError(
                `zoom ต้องอยู่ในช่วง ${range.min} - ${range.max}`,
                WebcamErrorCode.CONTROL_ERROR
            );
        }
        // @ts-ignore: zoom is not in official spec
        await track.applyConstraints({ advanced: [{ zoom: value }] });
    }

    /**
     * Check if torch (flash) is supported
     */
    async isTorchSupported(): Promise<boolean> {
        this._ensureNotDisposed();
        if (!this.state.activeStream) return false;
        const track = this.state.activeStream.getVideoTracks()[0];
        // @ts-ignore: torch is not in official spec but supported by some browsers
        const capabilities = track.getCapabilities?.();
        return !!(capabilities && 'torch' in capabilities);
    }

    /**
     * Set torch (flash) on/off
     */
    async setTorch(on: boolean): Promise<void> {
        this._ensureNotDisposed();
        if (!this.state.activeStream)
            throw new WebcamError('กล้องยังไม่ทำงาน', WebcamErrorCode.DEVICE_BUSY);
        const track = this.state.activeStream.getVideoTracks()[0];
        // @ts-ignore: torch is not in official spec but supported by some browsers
        const capabilities = track.getCapabilities?.();
        if (!(capabilities && 'torch' in capabilities)) {
            throw new WebcamError('กล้องนี้ไม่รองรับ torch/flash', WebcamErrorCode.TORCH_NOT_SUPPORTED);
        }
        // @ts-ignore: torch is not in official spec
        await track.applyConstraints({ advanced: [{ torch: on }] });
    }

    // --- 5. Audio Controls ---
    /**
     * Mute audio track (if available)
     */
    muteAudio(): void {
        this._ensureNotDisposed();
        if (this.state.activeStream) {
            this.state.activeStream.getAudioTracks().forEach((track) => {
                track.enabled = false;
            });
            this.emit('state:change', this.getState());
        }
    }

    /**
     * Unmute audio track (if available)
     */
    unmuteAudio(): void {
        this._ensureNotDisposed();
        if (this.state.activeStream) {
            this.state.activeStream.getAudioTracks().forEach((track) => {
                track.enabled = true;
            });
            this.emit('state:change', this.getState());
        }
    }

    /**
     * Set audio volume (if available, only works if audio is attached to video element)
     */
    setAudioVolume(volume: number): void {
        this._ensureNotDisposed();
        if (this.state.videoElement && typeof volume === 'number') {
            // Clamp volume between 0 and 1
            this.state.videoElement.volume = Math.max(0, Math.min(1, volume));
            this.emit('state:change', this.getState());
        }
    }

    // --- 6. Stream Controls (Pause/Resume) ---
    /**
     * Pause video stream (pause video track)
     */
    pauseCamera(): void {
        this._ensureNotDisposed();
        if (this.state.activeStream) {
            this.state.activeStream.getVideoTracks().forEach((track) => {
                track.enabled = false;
            });
            this.emit('state:change', this.getState());
        }
    }

    /**
     * Resume video stream (resume video track)
     */
    resumeCamera(): void {
        this._ensureNotDisposed();
        if (this.state.activeStream) {
            this.state.activeStream.getVideoTracks().forEach((track) => {
                track.enabled = true;
            });
            this.emit('state:change', this.getState());
        }
    }

    // --- 7. Capture ---
    /**
     * จับภาพจากกล้องเป็น Blob (mirror ตาม config.enableMirror)
     */
    async capture(): Promise<Blob> {
        this._ensureNotDisposed();
        if (this.state.status !== 'ready' || !this.state.activeStream) {
            throw new WebcamError('กล้องยังไม่ทำงาน', WebcamErrorCode.DEVICE_BUSY);
        }
        const videoTrack = this.state.activeStream.getVideoTracks()[0];
        // @ts-ignore: ImageCapture อาจไม่มี type ในบาง environment
        const imageCapture = new (window as any).ImageCapture(videoTrack);
        try {
            const bitmap = await imageCapture.grabFrame();
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            // ใช้ enableMirror จาก state.videoElement
            const isMirror = this.state.videoElement?.style.transform === 'scaleX(-1)';
            if (isMirror) {
                ctx?.translate(canvas.width, 0);
                ctx?.scale(-1, 1);
            }
            ctx?.drawImage(bitmap, 0, 0);
            return new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('ไม่สามารถถอดรหัสภาพเป็น Blob ได้'));
                        }
                    },
                    'image/jpeg',
                    1.0
                );
            });
        } catch (err) {
            throw new WebcamError('จับภาพล้มเหลว', WebcamErrorCode.CAPTURE_FAILED);
        }
    }

    // --- 8. Device Hotplug ---
    /**
     * Listen for device hotplug (devicechange event)
     */
    enableDeviceHotplug(): void {
        this._ensureNotDisposed();
        if (this._deviceChangeListener) return;
        this._deviceChangeListener = async () => {
            const devices = await this.getVideoDevices();
            this.emit('device:hotplug', devices);
        };
        navigator.mediaDevices.addEventListener('devicechange', this._deviceChangeListener);
    }

    disableDeviceHotplug(): void {
        this._ensureNotDisposed();
        if (this._deviceChangeListener) {
            navigator.mediaDevices.removeEventListener('devicechange', this._deviceChangeListener);
            this._deviceChangeListener = undefined;
        }
    }

    // --- 9. Resource Management ---
    /**
     * Dispose: cleanup all resources, event listeners, and state
     */
    dispose(): void {
        if (this._disposed) return;
        this.stopCamera();
        this.disableDeviceHotplug();
        // Cleanup video element reference
        if (this.state.videoElement) {
            this.state.videoElement.srcObject = null;
            this.state.videoElement.style.transform = '';
        }
        // Reset state
        this.state = {
            status: 'idle',
            activeStream: null,
            permissions: {},
            error: null
        };
        this._disposed = true;
    }

    private _ensureNotDisposed() {
        if (this._disposed) throw new WebcamError('Instance disposed', WebcamErrorCode.NOT_SUPPORTED);
    }
}
