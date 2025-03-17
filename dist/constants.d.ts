/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: {
    audioEnabled: boolean;
    mirrorEnabled: boolean;
    allowAnyResolution: boolean;
    allowResolutionSwap: boolean;
    onStartSuccess: () => void;
    onError: () => void;
};
/**
 * Default capabilities
 */
export declare const DEFAULT_CAPABILITIES: {
    zoomSupported: boolean;
    torchSupported: boolean;
    focusSupported: boolean;
    zoomLevel: number;
    minZoomLevel: number;
    maxZoomLevel: number;
    torchActive: boolean;
    focusActive: boolean;
    currentFocusMode: string;
    supportedFocusModes: never[];
};
/**
 * Default permissions
 */
export declare const DEFAULT_PERMISSIONS: {
    camera: "prompt";
    microphone: "prompt";
};
/**
 * Default state
 */
export declare const DEFAULT_STATE: {
    status: "idle";
    config: null;
    lastError: null;
    availableDevices: never[];
    capabilities: {
        zoomSupported: boolean;
        torchSupported: boolean;
        focusSupported: boolean;
        zoomLevel: number;
        minZoomLevel: number;
        maxZoomLevel: number;
        torchActive: boolean;
        focusActive: boolean;
        currentFocusMode: string;
        supportedFocusModes: never[];
    };
    activeStream: null;
    currentOrientation: "portrait-primary";
    permissions: {
        camera: "prompt";
        microphone: "prompt";
    };
};
