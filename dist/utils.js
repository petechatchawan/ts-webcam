import { WebcamError } from './errors';
/**
 * Create a new Resolution object with key
 */
export function createResolution(name, width, height) {
    const resolutionKey = `${width}x${height}`;
    return { id: resolutionKey, label: name, width, height };
}
/**
 * Build media constraints for getUserMedia based on resolution
 */
export function buildConstraints(deviceId, resolution, allowResolutionSwap, audioEnabled) {
    const videoConstraints = {
        deviceId: { exact: deviceId },
    };
    if (allowResolutionSwap) {
        videoConstraints.width = { exact: resolution.height };
        videoConstraints.height = { exact: resolution.width };
    }
    else {
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
export function validatePermissions(permissions, audioEnabled) {
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
export function stopStream(stream, previewElement) {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }
    if (previewElement) {
        previewElement.srcObject = null;
    }
}
