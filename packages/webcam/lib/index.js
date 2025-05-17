"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CommonResolutions: () => CommonResolutions,
  Webcam: () => Webcam,
  WebcamError: () => WebcamError,
  WebcamErrorCode: () => WebcamErrorCode,
  WebcamEventType: () => WebcamEventType,
  WebcamState: () => WebcamState,
  createWebcamError: () => createWebcamError
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var WebcamErrorCode = /* @__PURE__ */ ((WebcamErrorCode2) => {
  WebcamErrorCode2["PERMISSION_DENIED"] = "PERMISSION_DENIED";
  WebcamErrorCode2["DEVICE_NOT_FOUND"] = "DEVICE_NOT_FOUND";
  WebcamErrorCode2["RESOLUTION_UNSUPPORTED"] = "RESOLUTION_UNSUPPORTED";
  WebcamErrorCode2["DEVICE_IN_USE"] = "DEVICE_IN_USE";
  WebcamErrorCode2["INITIALIZATION_ERROR"] = "INITIALIZATION_ERROR";
  WebcamErrorCode2["STREAM_ERROR"] = "STREAM_ERROR";
  WebcamErrorCode2["INVALID_STATE"] = "INVALID_STATE";
  WebcamErrorCode2["CONCURRENT_OPERATION"] = "CONCURRENT_OPERATION";
  WebcamErrorCode2["NOT_SUPPORTED"] = "NOT_SUPPORTED";
  WebcamErrorCode2["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
  return WebcamErrorCode2;
})(WebcamErrorCode || {});
var WebcamError = class extends Error {
  constructor(code, message, originalError) {
    super(message);
    this.name = "WebcamError";
    this.code = code;
    this.originalError = originalError;
  }
};
function createWebcamError(code, message, originalError) {
  return new WebcamError(code, message, originalError);
}

// src/types.ts
var CommonResolutions = {
  VGA: { width: 640, height: 480 },
  HD: { width: 1280, height: 720 },
  FULL_HD: { width: 1920, height: 1080 },
  QVGA: { width: 320, height: 240 },
  SVGA: { width: 800, height: 600 },
  XGA: { width: 1024, height: 768 },
  UXGA: { width: 1600, height: 1200 },
  QXGA: { width: 2048, height: 1536 }
};
var WebcamState = /* @__PURE__ */ ((WebcamState2) => {
  WebcamState2["IDLE"] = "IDLE";
  WebcamState2["REQUESTING_PERMISSIONS"] = "REQUESTING_PERMISSIONS";
  WebcamState2["INITIALIZING"] = "INITIALIZING";
  WebcamState2["ACTIVE"] = "ACTIVE";
  WebcamState2["ERROR"] = "ERROR";
  WebcamState2["STOPPING"] = "STOPPING";
  return WebcamState2;
})(WebcamState || {});
var WebcamEventType = /* @__PURE__ */ ((WebcamEventType2) => {
  WebcamEventType2["STATE_CHANGE"] = "STATE_CHANGE";
  WebcamEventType2["ERROR"] = "ERROR";
  WebcamEventType2["STREAM_STARTED"] = "STREAM_STARTED";
  WebcamEventType2["STREAM_STOPPED"] = "STREAM_STOPPED";
  WebcamEventType2["DEVICE_CHANGE"] = "DEVICE_CHANGE";
  WebcamEventType2["PERMISSION_CHANGE"] = "PERMISSION_CHANGE";
  return WebcamEventType2;
})(WebcamEventType || {});

// src/webcam.ts
var DEFAULT_OPTIONS = {
  resolution: { width: 640, height: 480 },
  audio: false,
  debug: false,
  mirrored: false,
  autoRequestPermissions: true
};
var Webcam = class {
  /**
   * Creates a new Webcam instance
   * @param options Configuration options for the webcam
   */
  constructor(options = {}) {
    this.state = "IDLE" /* IDLE */;
    this.stream = null;
    this.videoElement = null;
    this.devices = [];
    this.currentDeviceId = null;
    this.currentResolution = null;
    this.permissionState = "prompt";
    this.operationPromise = null;
    this.eventListeners = /* @__PURE__ */ new Map();
    this.deviceChangeListener = null;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.log("Webcam instance created with options:", this.options);
    if (this.options.autoRequestPermissions) {
      this.checkPermissions().catch((err) => {
        this.log("Error checking permissions:", err);
      });
    }
    this.setupDeviceChangeListener();
  }
  /**
   * Logs debug messages if debug mode is enabled
   * @param args Arguments to log
   */
  log(...args) {
    if (this.options.debug) {
      console.log("[Webcam]", ...args);
    }
  }
  /**
   * Sets up the device change listener
   */
  setupDeviceChangeListener() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      this.log("MediaDevices API not supported");
      return;
    }
    this.deviceChangeListener = async () => {
      this.log("Device change detected");
      await this.updateDeviceList();
      this.emit("DEVICE_CHANGE" /* DEVICE_CHANGE */, this.devices);
    };
    navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeListener);
  }
  /**
   * Updates the list of available devices
   */
  async updateDeviceList() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw createWebcamError(
        "NOT_SUPPORTED" /* NOT_SUPPORTED */,
        "MediaDevices API not supported in this browser"
      );
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.devices = devices.filter((device) => device.kind === "videoinput").map((device) => ({
        id: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
        kind: device.kind
      }));
      this.log("Updated device list:", this.devices);
      return this.devices;
    } catch (error) {
      throw createWebcamError(
        "UNKNOWN_ERROR" /* UNKNOWN_ERROR */,
        "Failed to enumerate devices",
        error instanceof Error ? error : void 0
      );
    }
  }
  /**
   * Checks if the browser supports the required APIs
   */
  checkBrowserSupport() {
    const hasNavigator = typeof navigator !== "undefined";
    const hasMediaDevices = hasNavigator && !!navigator.mediaDevices;
    const hasGetUserMedia = hasMediaDevices && !!navigator.mediaDevices.getUserMedia;
    return hasNavigator && hasMediaDevices && hasGetUserMedia;
  }
  /**
   * Checks and requests camera permissions
   */
  async checkPermissions() {
    if (!this.checkBrowserSupport()) {
      throw createWebcamError(
        "NOT_SUPPORTED" /* NOT_SUPPORTED */,
        "MediaDevices API not supported in this browser"
      );
    }
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: "camera" });
        this.permissionState = permissionStatus.state;
        permissionStatus.addEventListener("change", () => {
          this.permissionState = permissionStatus.state;
          this.emit("PERMISSION_CHANGE" /* PERMISSION_CHANGE */, this.permissionState);
        });
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.permissionState = "granted";
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          if (error instanceof Error && error.name === "NotAllowedError") {
            this.permissionState = "denied";
          } else {
            this.permissionState = "prompt";
          }
        }
      }
      this.log("Permission state:", this.permissionState);
      this.emit("PERMISSION_CHANGE" /* PERMISSION_CHANGE */, this.permissionState);
      if (this.permissionState === "granted") {
        await this.updateDeviceList();
      }
      return this.permissionState;
    } catch (error) {
      throw createWebcamError(
        "UNKNOWN_ERROR" /* UNKNOWN_ERROR */,
        "Failed to check permissions",
        error instanceof Error ? error : void 0
      );
    }
  }
  /**
   * Starts the webcam
   * @param deviceId Optional device ID to use
   * @param resolution Optional resolution to use
   */
  async start(deviceId, resolution) {
    if (this.operationPromise) {
      throw createWebcamError(
        "CONCURRENT_OPERATION" /* CONCURRENT_OPERATION */,
        "Another operation is already in progress"
      );
    }
    if (this.state === "ACTIVE" /* ACTIVE */) {
      this.log("Webcam is already active");
      return this.stream;
    }
    try {
      this.operationPromise = this._start(deviceId, resolution);
      return await this.operationPromise;
    } finally {
      this.operationPromise = null;
    }
  }
  /**
   * Internal start method
   */
  async _start(deviceId, resolution) {
    if (!this.checkBrowserSupport()) {
      throw createWebcamError(
        "NOT_SUPPORTED" /* NOT_SUPPORTED */,
        "MediaDevices API not supported in this browser"
      );
    }
    this.setState("REQUESTING_PERMISSIONS" /* REQUESTING_PERMISSIONS */);
    const permissionState = await this.checkPermissions();
    if (permissionState === "denied") {
      throw createWebcamError(
        "PERMISSION_DENIED" /* PERMISSION_DENIED */,
        "Camera permission denied"
      );
    }
    if (this.devices.length === 0) {
      await this.updateDeviceList();
    }
    const effectiveDeviceId = deviceId || this.options.deviceId || (this.devices[0]?.id || null);
    if (!effectiveDeviceId) {
      throw createWebcamError(
        "DEVICE_NOT_FOUND" /* DEVICE_NOT_FOUND */,
        "No camera device found"
      );
    }
    const effectiveResolution = resolution || this.options.resolution;
    this.setState("INITIALIZING" /* INITIALIZING */);
    try {
      const constraints = {
        audio: this.options.audio || false,
        video: {
          deviceId: { exact: effectiveDeviceId },
          width: { ideal: effectiveResolution?.width },
          height: { ideal: effectiveResolution?.height }
        }
      };
      if (effectiveResolution?.frameRate) {
        constraints.video.frameRate = {
          ideal: effectiveResolution.frameRate
        };
      }
      if (effectiveResolution?.aspectRatio) {
        constraints.video.aspectRatio = {
          ideal: effectiveResolution.aspectRatio
        };
      }
      if (this.options.customConstraints) {
        Object.assign(constraints, this.options.customConstraints);
      }
      this.log("Starting webcam with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.stream = stream;
      this.currentDeviceId = effectiveDeviceId;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        this.currentResolution = {
          width: settings.width || effectiveResolution?.width || 0,
          height: settings.height || effectiveResolution?.height || 0,
          frameRate: settings.frameRate,
          aspectRatio: settings.aspectRatio
        };
        this.log("Actual camera settings:", settings);
      }
      this.setState("ACTIVE" /* ACTIVE */);
      this.emit("STREAM_STARTED" /* STREAM_STARTED */, stream);
      return stream;
    } catch (error) {
      this.setState("ERROR" /* ERROR */);
      if (error instanceof Error) {
        switch (error.name) {
          case "NotAllowedError":
            throw createWebcamError(
              "PERMISSION_DENIED" /* PERMISSION_DENIED */,
              "Camera permission denied",
              error
            );
          case "NotFoundError":
            throw createWebcamError(
              "DEVICE_NOT_FOUND" /* DEVICE_NOT_FOUND */,
              "Camera device not found",
              error
            );
          case "NotReadableError":
          case "TrackStartError":
            throw createWebcamError(
              "DEVICE_IN_USE" /* DEVICE_IN_USE */,
              "Camera is already in use or not accessible",
              error
            );
          case "OverconstrainedError":
            throw createWebcamError(
              "RESOLUTION_UNSUPPORTED" /* RESOLUTION_UNSUPPORTED */,
              "Requested resolution not supported by the device",
              error
            );
          default:
            throw createWebcamError(
              "INITIALIZATION_ERROR" /* INITIALIZATION_ERROR */,
              `Failed to initialize camera: ${error.message}`,
              error
            );
        }
      }
      throw createWebcamError(
        "UNKNOWN_ERROR" /* UNKNOWN_ERROR */,
        "Unknown error occurred while starting the camera",
        error instanceof Error ? error : void 0
      );
    }
  }
  /**
   * Stops the webcam
   */
  async stop() {
    if (this.operationPromise) {
      throw createWebcamError(
        "CONCURRENT_OPERATION" /* CONCURRENT_OPERATION */,
        "Another operation is already in progress"
      );
    }
    if (this.state === "IDLE" /* IDLE */) {
      this.log("Webcam is already stopped");
      return;
    }
    try {
      this.operationPromise = this._stop();
      return await this.operationPromise;
    } finally {
      this.operationPromise = null;
    }
  }
  /**
   * Internal stop method
   */
  async _stop() {
    this.setState("STOPPING" /* STOPPING */);
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.setState("IDLE" /* IDLE */);
    this.emit("STREAM_STOPPED" /* STREAM_STOPPED */);
  }
  /**
   * Attaches the webcam stream to a video element
   * @param videoElement The video element to attach to
   */
  attachToVideo(videoElement) {
    if (!videoElement) {
      throw createWebcamError(
        "INVALID_STATE" /* INVALID_STATE */,
        "Video element is required"
      );
    }
    this.videoElement = videoElement;
    if (this.options.mirrored) {
      this.videoElement.style.transform = "scaleX(-1)";
    }
    if (this.stream) {
      this.videoElement.srcObject = this.stream;
      this.videoElement.play().catch((error) => {
        this.log("Error playing video:", error);
      });
    }
  }
  /**
   * Detaches the webcam stream from the video element
   */
  detachFromVideo() {
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.style.transform = "";
      this.videoElement = null;
    }
  }
  /**
   * Gets the current webcam state
   */
  getState() {
    return this.state;
  }
  /**
   * Gets the current stream
   */
  getStream() {
    return this.stream;
  }
  /**
   * Gets the list of available devices
   */
  async getDevices() {
    return this.updateDeviceList();
  }
  /**
   * Gets the current device ID
   */
  getCurrentDeviceId() {
    return this.currentDeviceId;
  }
  /**
   * Gets the current resolution
   */
  getCurrentResolution() {
    return this.currentResolution;
  }
  /**
   * Gets the supported resolutions for the current device
   * Note: This is an approximation as browsers don't provide a direct way to query this
   */
  async getSupportedResolutions() {
    if (!this.currentDeviceId) {
      throw createWebcamError(
        "INVALID_STATE" /* INVALID_STATE */,
        "No device selected"
      );
    }
    const resolutionsToTest = [
      { width: 320, height: 240 },
      { width: 640, height: 480 },
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
      { width: 3840, height: 2160 }
    ];
    const supportedResolutions = [];
    for (const resolution of resolutionsToTest) {
      try {
        const constraints = {
          video: {
            deviceId: { exact: this.currentDeviceId },
            width: { exact: resolution.width },
            height: { exact: resolution.height }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        supportedResolutions.push(resolution);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        this.log(`Resolution ${resolution.width}x${resolution.height} not supported`);
      }
    }
    return supportedResolutions;
  }
  /**
   * Takes a snapshot from the current stream
   * @param format Image format (default: 'image/png')
   * @param quality Image quality for JPEG (0-1)
   */
  takeSnapshot(format = "image/png", quality = 0.95) {
    if (!this.stream || this.state !== "ACTIVE" /* ACTIVE */) {
      throw createWebcamError(
        "INVALID_STATE" /* INVALID_STATE */,
        "Webcam must be active to take a snapshot"
      );
    }
    const canvas = document.createElement("canvas");
    const video = this.videoElement || document.createElement("video");
    if (!this.videoElement) {
      video.srcObject = this.stream;
      video.play();
      return null;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw createWebcamError(
        "NOT_SUPPORTED" /* NOT_SUPPORTED */,
        "Canvas 2D context not supported"
      );
    }
    if (this.options.mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(format, quality);
  }
  /**
   * Changes the current device
   * @param deviceId The ID of the device to switch to
   */
  async switchDevice(deviceId) {
    if (this.state === "ACTIVE" /* ACTIVE */) {
      await this.stop();
    }
    return this.start(deviceId, this.options.resolution);
  }
  /**
   * Changes the current resolution
   * @param resolution The new resolution to use
   */
  async changeResolution(resolution) {
    if (this.state === "ACTIVE" /* ACTIVE */) {
      await this.stop();
    }
    return this.start(this.currentDeviceId || void 0, resolution);
  }
  /**
   * Sets the webcam state and emits a state change event
   * @param state The new state
   */
  setState(state) {
    this.state = state;
    this.log("State changed:", state);
    this.emit("STATE_CHANGE" /* STATE_CHANGE */, state);
  }
  /**
   * Adds an event listener
   * @param event The event type
   * @param listener The event listener
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.eventListeners.get(event).add(listener);
  }
  /**
   * Removes an event listener
   * @param event The event type
   * @param listener The event listener to remove
   */
  off(event, listener) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(listener);
    }
  }
  /**
   * Emits an event
   * @param event The event type
   * @param data The event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      for (const listener of this.eventListeners.get(event)) {
        listener(data);
      }
    }
  }
  /**
   * Cleans up resources when the webcam is no longer needed
   */
  dispose() {
    if (this.state === "ACTIVE" /* ACTIVE */) {
      this.stop().catch((err) => {
        this.log("Error stopping webcam during disposal:", err);
      });
    }
    if (this.deviceChangeListener && navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeListener);
      this.deviceChangeListener = null;
    }
    this.eventListeners.clear();
    this.log("Webcam disposed");
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CommonResolutions,
  Webcam,
  WebcamError,
  WebcamErrorCode,
  WebcamEventType,
  WebcamState,
  createWebcamError
});
