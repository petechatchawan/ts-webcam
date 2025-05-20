// src/errors.ts
var WebcamError = class _WebcamError extends Error {
  /**
   * Creates a new WebcamError
   *
   * @param code - Standardized error code
   * @param message - Human-readable error message
   * @param originalError - Original error that caused this error (optional)
   */
  constructor(code, message, originalError) {
    const enhancedMessage = `[${code}] ${message}`;
    super(enhancedMessage);
    this.name = "WebcamError";
    this.code = code;
    this.originalError = originalError;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _WebcamError);
    }
  }
  /**
   * Returns a string representation of the error including code and original error
   */
  toString() {
    let result = `${this.name}: ${this.message}`;
    if (this.originalError) {
      result += `
Caused by: ${this.originalError.toString()}`;
    }
    return result;
  }
};

// src/webcam.ts
import { UAInfo as UAInfo2 } from "ua-info";

// src/utils.ts
import { UAInfo } from "ua-info";
function createResolution(name, width, height) {
  const resolutionKey = `${width}x${height}`;
  return {
    id: resolutionKey,
    label: name,
    width,
    height
  };
}
function buildMediaConstraints(deviceId, resolution, allowAutoRotateResolution, audioEnabled) {
  const videoConstraints = {
    deviceId: { exact: deviceId }
  };
  if (allowAutoRotateResolution) {
    videoConstraints.width = { exact: resolution.height };
    videoConstraints.height = { exact: resolution.width };
  } else {
    videoConstraints.width = { exact: resolution.width };
    videoConstraints.height = { exact: resolution.height };
  }
  return {
    video: videoConstraints,
    audio: audioEnabled
  };
}
function validatePermissions(permissions, audioEnabled) {
  if (permissions.camera === "denied") {
    throw new WebcamError(
      "PERMISSION_DENIED",
      "Camera access is denied. Please allow camera access in your browser settings."
    );
  }
  if (audioEnabled && permissions.microphone === "denied") {
    throw new WebcamError(
      "PERMISSION_DENIED",
      "Microphone access is denied. Please allow microphone access in your browser settings."
    );
  }
}
function stopMediaStream(stream, previewElement) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  if (previewElement) {
    previewElement.srcObject = null;
  }
}
function shouldAutoSwapResolution() {
  const uaInfo = new UAInfo();
  uaInfo.setUserAgent(navigator.userAgent);
  const isMobile = uaInfo.isMobile();
  const isTablet = uaInfo.isTablet();
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
  const tabletRegex = /android|ipad|playbook|silk/i;
  const hasOrientation = typeof window.orientation !== "undefined";
  const isSmallScreen = window.innerWidth <= 1024;
  return isMobile || isTablet || mobileRegex.test(userAgent) || tabletRegex.test(userAgent) || hasOrientation && isSmallScreen;
}

// src/constants.ts
var DEFAULT_WEBCAM_CONFIG = {
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
  onStart: () => {
  },
  /** Callback when an error occurs */
  onError: () => {
  }
};
var DEFAULT_WEBCAM_CAPABILITIES = {
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
  currentFocusMode: "none",
  /** List of focus modes supported by the device */
  supportedFocusModes: []
};
var DEFAULT_PERMISSIONS = {
  /** Camera permission state */
  camera: "prompt",
  /** Microphone permission state */
  microphone: "prompt"
};
var DEFAULT_WEBCAM_STATE = {
  /** Current webcam status */
  status: "idle",
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
  currentOrientation: "portrait-primary",
  /** Current permission states */
  permissions: DEFAULT_PERMISSIONS
};

// src/types.ts
var WebcamStatus = /* @__PURE__ */ ((WebcamStatus2) => {
  WebcamStatus2["IDLE"] = "idle";
  WebcamStatus2["INITIALIZING"] = "initializing";
  WebcamStatus2["READY"] = "ready";
  WebcamStatus2["ERROR"] = "error";
  return WebcamStatus2;
})(WebcamStatus || {});

// src/webcam.ts
var Webcam = class {
  constructor() {
    this.deviceChangeListener = null;
    this.orientationChangeListener = null;
    this.uaInfo = new UAInfo2();
    this.uaInfo.setUserAgent(navigator.userAgent);
    this.state = {
      ...DEFAULT_WEBCAM_STATE,
      snapshotCanvas: document.createElement("canvas"),
      status: "idle" /* IDLE */,
      videoDevices: [],
      configuration: null,
      mediaStream: null,
      deviceCapabilities: DEFAULT_WEBCAM_CAPABILITIES,
      permissionStates: {
        camera: "prompt",
        microphone: "prompt"
      },
      lastError: null
    };
    this.handleError = this.handleError.bind(this);
  }
  /**
   * Internal logging function that only logs when debug mode is enabled
   * @param message The message to log
   * @param data Optional data to log
   */
  log(message, ...data) {
    if (this.state.configuration?.debug) {
      console.log(`[ts-webcam] ${message}`, ...data);
    }
  }
  // ===== State and Status Methods =====
  /**
   * Get the current state of the webcam
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get the current status of the webcam (IDLE, INITIALIZING, READY, ERROR)
   */
  getStatus() {
    return this.state.status;
  }
  /**
   * Check if the webcam is currently active
   */
  isActive() {
    return this.state.mediaStream !== null && this.state.mediaStream.active;
  }
  /**
   * Get the last error that occurred
   */
  getLastError() {
    return this.state.lastError;
  }
  /**
   * Clear the last error and reset status if not active
   */
  clearError() {
    this.state.lastError = null;
    if (!this.isActive()) {
      this.state.status = "idle" /* IDLE */;
    }
  }
  // ===== Configuration Methods =====
  /**
   * Check if audio is enabled in the configuration
   */
  isAudioEnabled() {
    return this.state.configuration?.enableAudio || false;
  }
  /**
   * Check if video mirroring is enabled
   */
  isMirrorEnabled() {
    return this.state.configuration?.mirrorVideo || false;
  }
  /**
   * Check if resolution swap is allowed on mobile devices
   */
  isResolutionSwapAllowed() {
    return this.state.configuration?.allowAutoRotateResolution || false;
  }
  /**
   * Check if fallback to any supported resolution is allowed
   */
  isFallbackResolutionAllowed() {
    return this.state.configuration?.allowFallbackResolution || false;
  }
  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled() {
    return this.state.configuration?.debug || false;
  }
  // ===== Device Capabilities Methods =====
  /**
   * Get current device capabilities
   */
  getCurrentDeviceCapabilities() {
    return { ...this.state.deviceCapabilities };
  }
  /**
   * Check if zoom is supported by the device
   */
  isZoomSupported() {
    return this.state.deviceCapabilities.zoomSupported;
  }
  /**
   * Check if torch/flashlight is supported by the device
   */
  isTorchSupported() {
    return this.state.deviceCapabilities.torchSupported;
  }
  /**
   * Check if focus control is supported by the device
   */
  isFocusSupported() {
    return this.state.deviceCapabilities.focusSupported;
  }
  /**
   * Get the current zoom level
   */
  getZoomLevel() {
    return this.state.deviceCapabilities.zoomLevel;
  }
  /**
   * Get the minimum supported zoom level
   */
  getMinZoomLevel() {
    return this.state.deviceCapabilities.minZoomLevel;
  }
  /**
   * Get the maximum supported zoom level
   */
  getMaxZoomLevel() {
    return this.state.deviceCapabilities.maxZoomLevel;
  }
  /**
   * Check if torch/flashlight is currently active
   */
  isTorchActive() {
    return this.state.deviceCapabilities.torchActive;
  }
  /**
   * Check if focus control is currently active
   */
  isFocusActive() {
    return this.state.deviceCapabilities.focusActive;
  }
  // ===== Webcam Lifecycle Methods =====
  /**
   * Set up the webcam configuration
   * @param configuration The configuration to use
   */
  setupConfiguration(configuration) {
    if (!configuration.deviceInfo) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Device ID is required");
    }
    this.state.configuration = {
      ...DEFAULT_WEBCAM_CONFIG,
      ...configuration
    };
    if (this.state.configuration.debug) {
      this.log("Configuration set up", this.state.configuration);
    }
  }
  /**
   * Start the webcam with the current configuration
   * @throws WebcamError if the webcam fails to start
   */
  async start() {
    this.checkConfiguration();
    this.log("Starting webcam...");
    try {
      await this.initializeWebcam();
      this.log("Webcam started successfully");
    } catch (error) {
      this.log("Error starting webcam", error);
      if (error instanceof WebcamError) {
        this.handleError(error);
      } else {
        this.handleError(new WebcamError("STREAM_ERROR", "Failed to start webcam", error));
      }
      throw this.state.lastError;
    }
  }
  /**
   * Stop the webcam and reset the state
   */
  stop() {
    this.checkConfiguration();
    this.log("Stopping webcam...");
    this.stopStream();
    this.resetState();
    this.log("Webcam stopped");
  }
  /**
   * Check if the video preview element is ready to display content
   * @returns Promise that resolves to true if the preview is ready, false otherwise
   */
  async isVideoPreviewReady() {
    const video = this.state.configuration?.videoElement;
    if (!video) {
      return false;
    }
    if (video.readyState >= 2) {
      return true;
    }
    const onCanPlay = () => {
      video.removeEventListener("canplay", onCanPlay);
      return true;
    };
    const onError = () => {
      video.removeEventListener("error", onError);
      return false;
    };
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("error", onError);
    return false;
  }
  // ===== Camera Control Methods =====
  /**
   * Set the zoom level of the camera
   * @param zoomLevel The zoom level to set
   * @throws WebcamError if zoom is not supported or fails to set
   */
  async setZoomLevel(zoomLevel) {
    if (!this.state.mediaStream || !this.state.deviceCapabilities.zoomSupported) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Zoom is not supported or webcam is not active");
    }
    const videoTrack = this.state.mediaStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    if (!capabilities.zoom) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Zoom is not supported by this device");
    }
    try {
      const constrainedZoomLevel = Math.min(Math.max(zoomLevel, capabilities.zoom.min), capabilities.zoom.max);
      await videoTrack.applyConstraints({
        advanced: [
          {
            zoom: constrainedZoomLevel
          }
        ]
      });
      this.state.deviceCapabilities.zoomLevel = constrainedZoomLevel;
    } catch (error) {
      throw new WebcamError("STREAM_ERROR", "Failed to set zoom level", error);
    }
  }
  /**
   * Enable or disable the torch/flashlight
   * @param active Whether to enable the torch
   * @throws WebcamError if torch is not supported or fails to set
   */
  async enableTorch(active) {
    if (!this.state.mediaStream || !this.state.deviceCapabilities.torchSupported) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Torch is not supported or webcam is not active");
    }
    const videoTrack = this.state.mediaStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    if (!capabilities.torch) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Torch is not supported by this device");
    }
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: active }]
      });
      this.state.deviceCapabilities.torchActive = active;
    } catch (error) {
      throw new WebcamError("STREAM_ERROR", "Failed to set torch mode", error);
    }
  }
  /**
   * Set the focus mode of the camera
   * @param mode The focus mode to set
   * @throws WebcamError if focus mode is not supported or fails to set
   */
  async setFocusMode(mode) {
    if (!this.state.mediaStream || !this.state.deviceCapabilities.focusSupported) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Focus mode is not supported or webcam is not active");
    }
    const videoTrack = this.state.mediaStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
      throw new WebcamError("DEVICE_NOT_FOUND", `Focus mode '${mode}' is not supported by this device`);
    }
    try {
      await videoTrack.applyConstraints({
        advanced: [{ focusMode: mode }]
      });
      this.state.deviceCapabilities.currentFocusMode = mode;
      this.state.deviceCapabilities.focusActive = true;
    } catch (error) {
      throw new WebcamError("STREAM_ERROR", "Failed to set focus mode", error);
    }
  }
  /**
   * Toggle the torch/flashlight on/off
   * @returns The new torch state (true = on, false = off)
   * @throws WebcamError if torch is not supported
   */
  async toggleTorch() {
    if (!this.isTorchSupported()) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Torch is not supported by this device");
    }
    const newTorchState = !this.state.deviceCapabilities.torchActive;
    await this.enableTorch(newTorchState);
    return newTorchState;
  }
  /**
   * Toggle video mirroring on/off
   * @returns The new mirror state (true = mirrored, false = normal)
   */
  toggleMirror() {
    this.checkConfiguration();
    const newValue = !this.state.configuration?.mirrorVideo;
    this.updateConfiguration({ mirrorVideo: newValue }, { restart: false });
    return newValue;
  }
  /**
   * Toggle debug mode on/off
   * @returns The new debug state (true = enabled, false = disabled)
   */
  toggleDebug() {
    this.checkConfiguration();
    const newValue = !this.state.configuration?.debug;
    this.updateConfiguration({ debug: newValue }, { restart: false });
    this.log(newValue ? "Debug mode enabled" : "Debug mode disabled");
    return newValue;
  }
  // ===== Configuration and Resolution Methods =====
  /**
   * Create a resolution object with the specified parameters
   * @param name The name/identifier for the resolution
   * @param width The width in pixels
   * @param height The height in pixels
   * @returns A Resolution object
   */
  createResolution(name, width, height) {
    return createResolution(name, width, height);
  }
  /**
   * Get the current webcam configuration
   * @returns The current configuration
   */
  getConfiguration() {
    this.checkConfiguration();
    return { ...this.state.configuration };
  }
  /**
   * Update the webcam configuration
   * @param configuration The configuration properties to update
   * @param options Options for the update (restart: whether to restart the webcam)
   * @returns The updated configuration
   */
  updateConfiguration(configuration, options = { restart: true }) {
    this.checkConfiguration();
    const wasActive = this.isActive();
    if (wasActive && options.restart) {
      this.stop();
    }
    this.state.configuration = {
      ...this.state.configuration,
      ...configuration
    };
    if ("mirrorVideo" in configuration && this.state.configuration.videoElement) {
      this.state.configuration.videoElement.style.transform = this.state.configuration.mirrorVideo ? "scaleX(-1)" : "none";
    }
    if (wasActive || options.restart) {
      this.start().catch(this.handleError);
    }
    return { ...this.state.configuration };
  }
  /**
   * Update the preferred resolution(s)
   * @param resolution The resolution or array of resolutions to use
   * @param options Options for the update (restart: whether to restart the webcam)
   * @returns The updated configuration
   */
  updateResolution(resolution, options = { restart: true }) {
    return this.updateConfiguration({ preferredResolutions: resolution }, options);
  }
  /**
   * Update the camera device
   * @param device The device to use
   * @param options Options for the update (restart: whether to restart the webcam)
   * @returns The updated configuration
   */
  updateDevice(device, options = { restart: true }) {
    return this.updateConfiguration({ deviceInfo: device }, options);
  }
  /**
   * Toggle a boolean setting in the configuration
   * @param setting The setting to toggle
   * @returns The new value of the setting
   * @throws WebcamError if microphone permission is denied when enabling audio
   */
  async toggleSetting(setting) {
    this.checkConfiguration();
    const newValue = !this.state.configuration[setting];
    if (setting === "enableAudio" && newValue) {
      const micPermission = await this.checkMicrophonePermission();
      if (micPermission === "prompt") {
        const permission = await this.requestMediaPermission("audio");
        if (permission === "denied") {
          throw new WebcamError("PERMISSION_DENIED", "Please allow microphone access");
        }
      } else if (micPermission === "denied") {
        throw new WebcamError("PERMISSION_DENIED", "Please allow microphone access");
      }
    }
    const shouldRestart = setting === "enableAudio" || setting === "allowAutoRotateResolution";
    this.updateConfiguration({ [setting]: newValue }, { restart: shouldRestart });
    if (setting === "debug") {
      this.log(newValue ? "Debug mode enabled" : "Debug mode disabled");
    }
    return newValue;
  }
  // ===== Permission Management Methods =====
  /**
   * Check the current camera permission status
   * @returns The current permission status (granted, denied, prompt)
   */
  async checkCameraPermission() {
    try {
      if (navigator?.permissions?.query) {
        const { state } = await navigator.permissions.query({
          name: "camera"
        });
        this.state.permissionStates.camera = state;
        return state;
      }
      this.state.permissionStates.camera = "prompt";
      return "prompt";
    } catch (error) {
      this.log("Permissions API error:", error);
      this.state.permissionStates.camera = "prompt";
      return "prompt";
    }
  }
  /**
   * Check the current microphone permission status
   * @returns The current permission status (granted, denied, prompt)
   */
  async checkMicrophonePermission() {
    try {
      if (navigator?.permissions?.query) {
        const { state } = await navigator.permissions.query({
          name: "microphone"
        });
        this.state.permissionStates.microphone = state;
        return state;
      }
      this.state.permissionStates.microphone = "prompt";
      return "prompt";
    } catch (error) {
      this.log("Permissions API error:", error);
      this.state.permissionStates.microphone = "prompt";
      return "prompt";
    }
  }
  /**
   * Request camera and microphone permissions
   * @returns Object containing the permission status for camera and microphone
   */
  async requestPermissions() {
    const cameraPermission = await this.requestMediaPermission("video");
    let microphonePermission = "prompt";
    if (this.state.configuration?.enableAudio) {
      microphonePermission = await this.requestMediaPermission("audio");
    }
    return {
      camera: cameraPermission,
      microphone: microphonePermission
    };
  }
  /**
   * Get the current permission states for camera and microphone
   * @returns Object containing the current permission states
   */
  getPermissionStates() {
    return { ...this.state.permissionStates };
  }
  /**
   * Check if permission request is needed for camera or microphone
   * @returns True if permission request is needed, false otherwise
   */
  needsPermissionRequest() {
    return this.state.permissionStates.camera === "prompt" || !!this.state.configuration?.enableAudio && this.state.permissionStates.microphone === "prompt";
  }
  /**
   * Check if permission has been denied for camera or microphone
   * @returns True if permission has been denied, false otherwise
   */
  hasPermissionDenied() {
    return this.state.permissionStates.camera === "denied" || !!this.state.configuration?.enableAudio && this.state.permissionStates.microphone === "denied";
  }
  // ===== Image Capture Methods =====
  /**
   * Capture an image from the current webcam stream
   * @param config Configuration options for the capture (scale, mediaType, quality)
   * @returns Promise that resolves to a data URL of the captured image
   * @throws WebcamError if capture fails
   */
  async captureImage(config = {}) {
    this.checkConfiguration();
    if (!this.state.mediaStream) {
      throw new WebcamError("STREAM_ERROR", "No active stream to capture image from");
    }
    const videoTrack = this.state.mediaStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const canvas = this.state.snapshotCanvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new WebcamError("STREAM_ERROR", "Failed to get canvas context");
    }
    const scale = config.scale || 1;
    canvas.width = (settings.width || 640) * scale;
    canvas.height = (settings.height || 480) * scale;
    if (this.state.configuration?.mirrorVideo) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(this.state.configuration.videoElement, 0, 0, canvas.width, canvas.height);
    if (this.state.configuration.mirrorVideo) {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    const mediaType = config.mediaType || "image/png";
    const quality = typeof config.quality === "number" ? Math.min(Math.max(config.quality, 0), 1) : mediaType === "image/jpeg" ? 0.92 : void 0;
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new WebcamError("STREAM_ERROR", "Failed to capture image"));
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        mediaType,
        quality
      );
    });
  }
  // ===== Device Capability Methods =====
  /**
   * Get detailed capabilities of a specific device
   * @param deviceId The ID of the device to check
   * @returns Promise that resolves to the device capabilities
   * @throws WebcamError if capabilities check fails
   */
  async getDeviceCapabilities(deviceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      });
      const videoTrack = stream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      const frameRates = [];
      if (capabilities.frameRate?.min && capabilities.frameRate?.max && capabilities.frameRate?.step) {
        const { min, max, step } = capabilities.frameRate;
        for (let fps = min; fps <= max; fps += step) {
          frameRates.push(fps);
        }
      }
      stream.getTracks().forEach((track) => track.stop());
      return {
        deviceId,
        maxWidth: capabilities.width?.max || 0,
        maxHeight: capabilities.height?.max || 0,
        minWidth: capabilities.width?.min || 0,
        minHeight: capabilities.height?.min || 0,
        supportedFrameRates: frameRates,
        zoomSupported: !!capabilities.zoom,
        torchSupported: !!capabilities.torch,
        focusSupported: !!capabilities.focusMode,
        maxZoomLevel: capabilities.zoom?.max,
        minZoomLevel: capabilities.zoom?.min,
        supportedFocusModes: capabilities.focusMode
      };
    } catch (error) {
      throw new WebcamError("STREAM_ERROR", "Failed to check device capabilities", error);
    }
  }
  /**
   * Check which resolutions are supported by the device
   * @param deviceCapabilities The capabilities of the device
   * @param desiredResolutions The resolutions to check
   * @returns Object containing supported resolutions and device info
   */
  checkSupportedResolutions(deviceCapabilities, desiredResolutions) {
    const capability = deviceCapabilities[0];
    const deviceInfo = {
      deviceId: capability.deviceId,
      maxWidth: capability.maxWidth,
      maxHeight: capability.maxHeight,
      minWidth: capability.minWidth,
      minHeight: capability.minHeight
    };
    const resolutions = desiredResolutions.map((resolution) => {
      const isSupported = resolution.width <= capability.maxWidth && resolution.height <= capability.maxHeight && resolution.width >= capability.minWidth && resolution.height >= capability.minHeight;
      return {
        key: resolution.id,
        width: resolution.width,
        height: resolution.height,
        supported: isSupported
      };
    });
    return {
      resolutions,
      deviceInfo
    };
  }
  async setupChangeListeners() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new WebcamError("DEVICE_NOT_FOUND", "MediaDevices API is not supported in this browser");
    }
    await this.refreshDevices();
    this.deviceChangeListener = async () => {
      await this.refreshDevices();
      const currentDevice = this.getCurrentDevice();
      if (this.isActive() && !currentDevice) {
        this.handleError(new WebcamError("DEVICE_NOT_FOUND", "Current device is no longer available"));
        this.stop();
      }
    };
    this.orientationChangeListener = () => {
      if (this.isActive()) {
        if (screen.orientation) {
          this.log("Screen orientation is supported");
          const orientation = screen.orientation.type;
          const angle = screen.orientation.angle;
          this.log(`Orientation type: ${orientation}, angle: ${angle}`);
          this.state.deviceOrientation = orientation;
          switch (orientation) {
            case "portrait-primary":
              this.log("Portrait (normal)");
              break;
            case "portrait-secondary":
              this.log("Portrait (flipped)");
              break;
            case "landscape-primary":
              this.log("Landscape (normal)");
              break;
            case "landscape-secondary":
              this.log("Landscape (flipped)");
              break;
            default:
              this.log("Unknown orientation");
              this.state.deviceOrientation = "unknown";
          }
        } else {
          this.log("screen.orientation is not supported");
          this.state.deviceOrientation = "unknown";
        }
      }
    };
    navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeListener);
    window.addEventListener("orientationchange", this.orientationChangeListener);
  }
  async getAvailableDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new WebcamError("DEVICE_NOT_FOUND", "MediaDevices API is not supported in this browser");
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.state.videoDevices = devices.filter((device) => device.kind === "videoinput");
      return devices;
    } catch (error) {
      this.handleError(new WebcamError("DEVICE_NOT_FOUND", "Failed to get device list", error));
      return [];
    }
  }
  async refreshDevices() {
    await this.getAvailableDevices();
  }
  async getVideoDevices() {
    if (this.state.videoDevices.length === 0) {
      await this.getAvailableDevices();
    }
    return this.state.videoDevices;
  }
  /**
   * Get all available media devices (video, audio input, audio output)
   * @returns Promise that resolves to an array of all devices
   */
  async getAllDevices() {
    if (this.state.videoDevices.length === 0) {
      await this.getAvailableDevices();
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
  }
  async getAudioInputDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "audioinput");
  }
  async getAudioOutputDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "audiooutput");
  }
  getCurrentDevice() {
    if (!this.state.configuration?.deviceInfo) return null;
    return this.state.configuration.deviceInfo;
  }
  getCurrentResolution() {
    return this.state.activeResolution || null;
  }
  // Private Methods
  async initializeWebcam() {
    this.state.status = "initializing" /* INITIALIZING */;
    this.state.lastError = null;
    const permissions = await this.requestPermissions();
    validatePermissions(permissions, this.state.configuration.enableAudio || false);
    await this.openWebcam();
  }
  async openWebcam() {
    if (!this.state.configuration.preferredResolutions) {
      if (!this.state.configuration.allowFallbackResolution) {
        throw new WebcamError("NOT_INITIALIZED", "Please specify a resolution or set allowFallbackResolution to true");
      }
      try {
        await this.tryAnyResolution();
        return;
      } catch (error) {
        throw new WebcamError("STREAM_ERROR", "Failed to open webcam with supported resolution", error);
      }
    }
    const resolutions = Array.isArray(this.state.configuration.preferredResolutions) ? this.state.configuration.preferredResolutions : [this.state.configuration.preferredResolutions];
    let lastError = null;
    for (const resolution of resolutions) {
      try {
        await this.tryResolution(resolution);
        return;
      } catch (error) {
        lastError = new WebcamError(
          "STREAM_ERROR",
          `Failed to open webcam with resolution: ${resolution.id}`,
          error
        );
        this.log(`Failed to open webcam with resolution: ${resolution.id}. Trying next...`);
      }
    }
    if (this.state.configuration.allowFallbackResolution) {
      try {
        this.log("All specified resolutions failed. Trying any supported resolution...");
        await this.tryAnyResolution();
      } catch (error) {
        throw new WebcamError("STREAM_ERROR", "Failed to open webcam with any resolution", lastError || void 0);
      }
    } else {
      throw lastError;
    }
  }
  async tryResolution(resolution) {
    const resolutionString = `${resolution.width}x${resolution.height}`;
    this.log(`Attempting to open webcam with resolution: ${resolution.id} (${resolutionString})`);
    const constraints = buildMediaConstraints(
      this.state.configuration.deviceInfo.deviceId,
      resolution,
      this.state.configuration.allowAutoRotateResolution || false,
      this.state.configuration.enableAudio || false
    );
    this.log("Using constraints:", constraints);
    try {
      this.state.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      await this.updateCapabilities();
      await this.setupPreviewElement();
      const videoTrack = this.state.mediaStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.state.activeResolution = {
        id: resolution.id,
        label: resolution.label,
        width: settings.width || resolution.width,
        height: settings.height || resolution.height
      };
      this.log(`Successfully opened webcam with resolution: ${resolution.id}`);
      this.state.status = "ready" /* READY */;
      this.state.configuration?.onStart?.();
    } catch (error) {
      this.log(`Failed to open webcam with resolution: ${resolution.id}`, error);
      throw error;
    }
  }
  async tryAnyResolution() {
    this.log("Attempting to open webcam with any supported resolution (ideal: 4K)");
    if (!this.state.configuration.deviceInfo) {
      throw new WebcamError("DEVICE_NOT_FOUND", "Selected device not found");
    }
    const constraints = {
      audio: this.state.configuration.enableAudio,
      video: {
        deviceId: { exact: this.state.configuration.deviceInfo.deviceId },
        width: { ideal: 3840 },
        height: { ideal: 2160 }
      }
    };
    try {
      this.state.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      await this.updateCapabilities();
      await this.setupPreviewElement();
      const videoTrack = this.state.mediaStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      this.state.activeResolution = {
        id: `${settings.width}x${settings.height}`,
        label: `${settings.width}x${settings.height}`,
        width: settings.width || 0,
        height: settings.height || 0
      };
      this.log(`Opened webcam with resolution: ${this.state.activeResolution.id}`);
      this.state.status = "ready" /* READY */;
      this.state.configuration?.onStart?.();
    } catch (error) {
      this.log("Failed to initialize webcam with any resolution", error);
      throw new WebcamError("STREAM_ERROR", "Failed to initialize webcam with any resolution", error);
    }
  }
  async setupPreviewElement() {
    if (this.state.configuration.videoElement && this.state.mediaStream) {
      this.state.configuration.videoElement.srcObject = this.state.mediaStream;
      this.state.configuration.videoElement.style.transform = this.state.configuration.mirrorVideo ? "scaleX(-1)" : "none";
      await this.state.configuration.videoElement.play();
    }
  }
  async updateCapabilities() {
    if (!this.state.mediaStream) return;
    const videoTrack = this.state.mediaStream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();
    const settings = videoTrack.getSettings();
    this.state.deviceCapabilities = {
      zoomSupported: !!capabilities.zoom,
      torchSupported: !!capabilities.torch,
      focusSupported: !!capabilities.focusMode,
      zoomLevel: settings.zoom || 1,
      minZoomLevel: capabilities.zoom?.min || 1,
      maxZoomLevel: capabilities.zoom?.max || 1,
      torchActive: settings.torch || false,
      focusActive: !!settings.focusMode,
      currentFocusMode: settings.focusMode || "none",
      supportedFocusModes: capabilities.focusMode || []
    };
  }
  checkConfiguration() {
    if (!this.state.configuration) {
      throw new WebcamError("NOT_INITIALIZED", "Please call setupConfiguration() before using webcam");
    }
  }
  handleError(error) {
    this.state.status = "error" /* ERROR */;
    this.state.lastError = error instanceof WebcamError ? error : new WebcamError("UNKNOWN_ERROR", error.message, error);
    this.log("Error occurred:", this.state.lastError);
    this.state.configuration?.onError?.(this.state.lastError);
  }
  stopStream() {
    stopMediaStream(this.state.mediaStream, this.state.configuration?.videoElement);
  }
  resetState() {
    this.stopChangeListeners();
    this.state = {
      ...this.state,
      status: "idle" /* IDLE */,
      mediaStream: null,
      lastError: null,
      deviceCapabilities: DEFAULT_WEBCAM_CAPABILITIES,
      activeResolution: null
    };
  }
  async requestMediaPermission(mediaType) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        [mediaType]: true
      });
      stream.getTracks().forEach((track) => track.stop());
      const permissionType = mediaType === "video" ? "camera" : "microphone";
      this.state.permissionStates[permissionType] = "granted";
      return "granted";
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          const permissionType2 = mediaType === "video" ? "camera" : "microphone";
          this.state.permissionStates[permissionType2] = "denied";
          return "denied";
        }
      }
      const permissionType = mediaType === "video" ? "camera" : "microphone";
      this.state.permissionStates[permissionType] = "prompt";
      return "prompt";
    }
  }
  stopChangeListeners() {
    if (this.deviceChangeListener) {
      navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeListener);
      this.deviceChangeListener = null;
    }
    if (this.orientationChangeListener) {
      window.removeEventListener("orientationchange", this.orientationChangeListener);
      this.orientationChangeListener = null;
    }
  }
};
export {
  Webcam,
  WebcamError,
  WebcamStatus
};
