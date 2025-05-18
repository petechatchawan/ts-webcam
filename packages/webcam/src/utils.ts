import { UAInfo } from 'ua-info';
import { WebcamError } from './errors';
import { Resolution } from './interfaces';

/**
 * Create a new Resolution object with key
 */
export function createResolution(
    name: string,
    width: number,
    height: number,
): Resolution {
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
        throw new WebcamError(
            'PERMISSION_DENIED',
            'Please allow camera access',
        );
    }
    if (audioEnabled && permissions.microphone === 'denied') {
        throw new WebcamError(
            'PERMISSION_DENIED',
            'Please allow microphone access',
        );
    }
}

/**
 * Stop media stream
 */
export function stopStream(
    stream: MediaStream | null,
    previewElement?: HTMLVideoElement,
): void {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }

    if (previewElement) {
        previewElement.srcObject = null;
    }
}

/**
 * Detect if device is mobile or tablet
 */
export function shouldAutoSwapResolution(): boolean {
    const uaInfo = new UAInfo();
    uaInfo.setUserAgent(navigator.userAgent);
    const parsedUserAgent = uaInfo.getParsedUserAgent();
    console.log('parsedUserAgent', parsedUserAgent);

    // Check for mobile or tablet using User Agent
    const userAgent =
        navigator.userAgent || navigator.vendor || (window as any).opera;

    // Mobile detection regex
    const mobileRegex =
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;

    // Tablet detection regex
    const tabletRegex = /android|ipad|playbook|silk/i;

    // Check if screen orientation is available (typically mobile/tablet devices)
    const hasOrientation = typeof window.orientation !== 'undefined';

    // Check screen size (most tablets are less than 1200px wide)
    const isSmallScreen = window.innerWidth <= 1024;

    // Check if device is mobile
    const isMobile = uaInfo.isMobile();

    // Check if device is tablet
    const isTablet = uaInfo.isTablet();

    return (
        mobileRegex.test(userAgent) ||
        tabletRegex.test(userAgent) ||
        isMobile ||
        isTablet ||
        (hasOrientation && isSmallScreen)
    );
}
