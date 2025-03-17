import { Resolution } from './interfaces';
/**
 * Create a new Resolution object with key
 */
export declare function createResolution(name: string, width: number, height: number): Resolution;
/**
 * Build media constraints for getUserMedia based on resolution
 */
export declare function buildConstraints(deviceId: string, resolution: Resolution, allowResolutionSwap: boolean, audioEnabled: boolean): MediaStreamConstraints;
/**
 * Validate permissions
 */
export declare function validatePermissions(permissions: {
    camera: PermissionState;
    microphone: PermissionState;
}, audioEnabled: boolean): void;
/**
 * Stop media stream
 */
export declare function stopStream(stream: MediaStream | null, previewElement?: HTMLVideoElement): void;
