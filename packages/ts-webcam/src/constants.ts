import { shouldAutoSwapResolution } from './utils';

/**
 * Default webcam configuration values
 * These settings are used when no specific configuration is provided
 */
export const DEFAULT_WEBCAM_CONFIG = {
    /** Enable audio capture alongside video */
    audioEnabled: false,

    /** Mirror the video display horizontally */
    mirrorEnabled: false,

    /** Allow any resolution if specified resolution is not supported */
    allowAnyResolution: true,

    /** Automatically swap width/height on mobile devices */
    get allowResolutionSwap() {
        return shouldAutoSwapResolution();
    },

    /** Enable debug mode to show console.log messages */
    debug: false,

    /** Callback when webcam starts successfully */
    onStart: () => { },

    /** Callback when an error occurs */
    onError: () => { },
};

/**
 * Default webcam hardware capabilities
 * Initial values before device capabilities are detected
 */
export const DEFAULT_WEBCAM_CAPABILITIES = {
    /** Whether zoom is supported by the device */
    zoomSupported: false,

    /** Whether torch/flashlight is supported by the device */
    torchSupported: false,

    /** Whether focus control is supported by the device */
    focusSupported: false,

    /** Current zoom level */
    zoomLevel: 1,

    /** Minimum zoom level supported by the device */
    minZoomLevel: 1,

    /** Maximum zoom level supported by the device */
    maxZoomLevel: 1,

    /** Whether torch/flashlight is currently active */
    torchActive: false,

    /** Whether manual focus is currently active */
    focusActive: false,

    /** Current focus mode */
    currentFocusMode: 'none',

    /** List of focus modes supported by the device */
    supportedFocusModes: [],
};

/**
 * Default permission states
 * Initial values before permissions are checked
 */
export const DEFAULT_PERMISSIONS = {
    /** Camera permission state */
    camera: 'prompt' as const,

    /** Microphone permission state */
    microphone: 'prompt' as const,
};

/**
 * Default webcam state
 * Initial state values for the webcam
 */
export const DEFAULT_WEBCAM_STATE = {
    /** Current webcam status */
    status: 'idle' as const,

    /** Current configuration */
    config: null,

    /** Last error that occurred */
    lastError: null,

    /** List of available media devices */
    availableDevices: [],

    /** Current device capabilities */
    capabilities: DEFAULT_WEBCAM_CAPABILITIES,

    /** Active media stream */
    activeStream: null,

    /** Current device orientation */
    currentOrientation: 'portrait-primary' as const,

    /** Current permission states */
    permissions: DEFAULT_PERMISSIONS,
};
