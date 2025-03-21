import { UAInfo } from 'ua-info';
import { WebcamError } from './errors';
import { DeviceCapabilities, Resolution, WebcamCapabilities, WebcamConfig, WebcamState } from './interfaces';
import { PermissionStatus, WebcamStatus } from './types';
export declare class Webcam {
    private state;
    private deviceChangeListener;
    private orientationChangeListener;
    uaInfo: UAInfo;
    constructor();
    getState(): WebcamState;
    getStatus(): WebcamStatus;
    getCapabilities(): WebcamCapabilities;
    getLastError(): WebcamError | null;
    clearError(): void;
    isActive(): boolean;
    isAudioEnabled(): boolean;
    isMirrorEnabled(): boolean;
    isResolutionSwapAllowed(): boolean;
    isAnyResolutionAllowed(): boolean;
    isZoomSupported(): boolean;
    isTorchSupported(): boolean;
    isFocusSupported(): boolean;
    getZoomLevel(): number;
    getMinZoomLevel(): number;
    getMaxZoomLevel(): number;
    isTorchActive(): boolean;
    isFocusActive(): boolean;
    setupConfiguration(configuration: WebcamConfig): void;
    start(): Promise<void>;
    stop(): void;
    previewIsReady(): Promise<boolean>;
    setZoom(zoomLevel: number): Promise<void>;
    setTorch(active: boolean): Promise<void>;
    setFocusMode(mode: string): Promise<void>;
    toggleTorch(): Promise<boolean>;
    toggleMirror(): boolean;
    createResolution(name: string, width: number, height: number): Resolution;
    updateConfiguration(configuration: Partial<WebcamConfig>, options?: {
        restart?: boolean;
    }): WebcamConfig;
    updateResolution(resolution: Resolution | Resolution[], options?: {
        restart?: boolean;
    }): WebcamConfig;
    updateDevice(device: MediaDeviceInfo, options?: {
        restart?: boolean;
    }): WebcamConfig;
    toggle(setting: 'audioEnabled' | 'allowResolutionSwap' | 'allowAnyResolution'): Promise<boolean>;
    getConfiguration(): WebcamConfig;
    checkCameraPermission(): Promise<PermissionStatus>;
    checkMicrophonePermission(): Promise<PermissionStatus>;
    requestPermissions(): Promise<{
        camera: PermissionStatus;
        microphone: PermissionStatus;
    }>;
    getCurrentPermissions(): {
        camera: PermissionStatus;
        microphone: PermissionStatus;
    };
    needsPermissionRequest(): boolean;
    hasPermissionDenied(): boolean;
    captureImage(config?: {
        scale?: number;
        mediaType?: 'image/png' | 'image/jpeg';
        quality?: number;
    }): string;
    checkDevicesCapabilitiesData(deviceId: string): Promise<DeviceCapabilities>;
    checkSupportedResolutions(deviceCapabilities: DeviceCapabilities[], desiredResolutions: Resolution[]): {
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
    setupChangeListeners(): Promise<void>;
    private getAvailableDevices;
    refreshDevices(): Promise<void>;
    getVideoDevices(): Promise<MediaDeviceInfo[]>;
    getAudioInputDevices(): Promise<MediaDeviceInfo[]>;
    getAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
    getCurrentDevice(): MediaDeviceInfo | null;
    getCurrentResolution(): Resolution | null;
    private initializeWebcam;
    private openWebcam;
    private tryResolution;
    private tryAnyResolution;
    private setupPreviewElement;
    private updateCapabilities;
    private checkConfiguration;
    private handleError;
    private stopStream;
    private resetState;
    private requestMediaPermission;
    private stopChangeListeners;
}
export default Webcam;
