import { Resolution } from './interfaces';
import { WebcamError } from './errors';

/**
 * Create a new Resolution object with key
 */
export function createResolution(name: string, width: number, height: number): Resolution {
    const resolutionKey = `${width}x${height}`;
    return { id: resolutionKey, label: name, width, height };
}

/**
 * Build media constraints for getUserMedia based on resolution
 */
export function buildConstraints(
    deviceId: string,
    resolution: Resolution,
    allowResolutionSwap: boolean,
    audioEnabled: boolean,
): MediaStreamConstraints {
    const videoConstraints: MediaTrackConstraints = {
        deviceId: { exact: deviceId },
    };

    if (allowResolutionSwap) {
        videoConstraints.width = { exact: resolution.height };
        videoConstraints.height = { exact: resolution.width };
    } else {
        videoConstraints.width = { exact: resolution.width };
        videoConstraints.height = { exact: resolution.height };
    }

    return {
        video: videoConstraints,
        audio: audioEnabled,
    };
}

/**
 * Validate permissions
 */
export function validatePermissions(
    permissions: { camera: PermissionState; microphone: PermissionState },
    audioEnabled: boolean,
): void {
    if (permissions.camera === 'denied') {
        throw new WebcamError('permission-denied', 'Please allow camera access');
    }
    if (audioEnabled && permissions.microphone === 'denied') {
        throw new WebcamError('microphone-permission-denied', 'Please allow microphone access');
    }
}

/**
 * Stop media stream
 */
export function stopStream(stream: MediaStream | null, previewElement?: HTMLVideoElement): void {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }

    if (previewElement) {
        previewElement.srcObject = null;
    }
}
