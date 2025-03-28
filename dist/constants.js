import { shouldAutoSwapResolution } from './utils';
/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
    audioEnabled: false,
    mirrorEnabled: false,
    allowAnyResolution: true,
    get allowResolutionSwap() {
        return shouldAutoSwapResolution();
    },
    onStartSuccess: () => { },
    onError: () => { },
};
/**
 * Default capabilities
 */
export const DEFAULT_CAPABILITIES = {
    zoomSupported: false,
    torchSupported: false,
    focusSupported: false,
    zoomLevel: 1,
    minZoomLevel: 1,
    maxZoomLevel: 1,
    torchActive: false,
    focusActive: false,
    currentFocusMode: 'none',
    supportedFocusModes: [],
};
/**
 * Default permissions
 */
export const DEFAULT_PERMISSIONS = {
    camera: 'prompt',
    microphone: 'prompt',
};
/**
 * Default state
 */
export const DEFAULT_STATE = {
    status: 'idle',
    config: null,
    lastError: null,
    availableDevices: [],
    capabilities: DEFAULT_CAPABILITIES,
    activeStream: null,
    currentOrientation: 'portrait-primary',
    permissions: DEFAULT_PERMISSIONS,
};
