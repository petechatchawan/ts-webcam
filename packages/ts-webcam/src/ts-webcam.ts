// Main TsWebcam class with callback-based approach
import { WebcamError, WebcamErrorCode } from "./errors";
import { DeviceCapability, PermissionRequestOptions, TsWebcamState, TsWebcamStateInternal, WebcamConfiguration } from "./types";

export class TsWebcam {
	private state: TsWebcamStateInternal = {
		status: "idle",
		activeStream: null,
		permissions: {},
		error: null,
	};

	private _deviceChangeListener?: () => void;
	private _disposed = false;
	private _config?: WebcamConfiguration;

	constructor() {
		// Simple callback-based approach
		// todo: set default config like debug mode
	}

	// Helper methods for calling callbacks
	private _callStateChange() {
		if (this._config?.onStateChange) {
			this._config.onStateChange(this.getState());
		}
	}

	private _callStreamStart(stream: MediaStream) {
		if (this._config?.onStreamStart) {
			this._config.onStreamStart(stream);
		}
	}

	private _callStreamStop() {
		if (this._config?.onStreamStop) {
			this._config.onStreamStop();
		}
	}

	private _callError(error: WebcamError) {
		if (this._config?.onError) {
			this._config.onError(error);
		}
	}

	private _callPermissionChange(permissions: Record<string, PermissionState>) {
		if (this._config?.onPermissionChange) {
			this._config.onPermissionChange(permissions);
		}
	}

	private _callDeviceChange(devices: MediaDeviceInfo[]) {
		if (this._config?.onDeviceChange) {
			this._config.onDeviceChange(devices);
		}
	}

	// --- 1. State ---
	getState(): TsWebcamState {
		this._ensureNotDisposed();
		return { ...this.state };
	}

	// --- 2. Permissions & Device Enumeration ---
	async checkPermissions(): Promise<Record<string, PermissionState>> {
		this._ensureNotDisposed();
		const permissions: Record<string, PermissionState> = {};

		// Check camera permission
		try {
			const cameraPerm = await navigator.permissions.query({ name: "camera" as PermissionName });
			permissions["camera"] = cameraPerm.state;
			this._callPermissionChange(permissions);
		} catch {
			permissions["camera"] = "prompt";
		}

		// Check microphone permission
		try {
			const micPerm = await navigator.permissions.query({ name: "microphone" as PermissionName });
			permissions["microphone"] = micPerm.state;
			this._callPermissionChange(permissions);
		} catch {
			permissions["microphone"] = "prompt";
		}

		this.state.permissions = permissions;
		return permissions;
	}

	async requestPermissions(options: PermissionRequestOptions = { video: true, audio: false }): Promise<Record<string, PermissionState>> {
		this._ensureNotDisposed();

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: options.video || false,
				audio: options.audio || false,
			});

			// Stop stream immediately after getting permission
			stream.getTracks().forEach((track) => track.stop());

			const permissions = await this.checkPermissions();
			this._callPermissionChange(permissions);
			return permissions;
		} catch (error) {
			const permissions = await this.checkPermissions();
			this._callPermissionChange(permissions);
			return permissions;
		}
	}

	async getVideoDevices(): Promise<MediaDeviceInfo[]> {
		this._ensureNotDisposed();

		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter((device) => device.kind === "videoinput");
			this._callDeviceChange(videoDevices);
			return videoDevices;
		} catch (error) {
			const webcamError = new WebcamError("Failed to enumerate devices", WebcamErrorCode.DEVICES_ERROR);
			this._setError(webcamError);
			this._callError(webcamError);
			throw webcamError;
		}
	}

	// --- 3. Camera Operations ---
	async startCamera(config: WebcamConfiguration): Promise<void> {
		this._ensureNotDisposed();
		this._config = config; // Store config for callbacks

		try {
			this._setStatus("initializing");
			this._callStateChange();

			const constraints = this._buildConstraints(config);
			const stream = await navigator.mediaDevices.getUserMedia(constraints);

			// Configure video element if provided
			if (config.videoElement) {
				config.videoElement.srcObject = stream;
				this.state.videoElement = config.videoElement;
			}

			this.state.activeStream = stream;
			this.state.deviceInfo = config.deviceInfo;
			this._setStatus("ready");
			this._clearError();

			this._callStreamStart(stream);
			this._callStateChange();
		} catch (error) {
			const webcamError = this._handleStartCameraError(error, config);
			this._setError(webcamError);
			this._callError(webcamError);
			this._callStateChange();
			throw webcamError;
		}
	}

	stopCamera(): void {
		this._ensureNotDisposed();

		if (this.state.activeStream) {
			this.state.activeStream.getTracks().forEach((track) => track.stop());
			this.state.activeStream = null;
			this._callStreamStop();
		}

		if (this.state.videoElement) {
			this.state.videoElement.srcObject = null;
			this.state.videoElement = undefined;
		}

		this.state.deviceInfo = undefined;
		this._setStatus("idle");
		this._clearError();
		this._callStateChange();
	}

	async capture(): Promise<Blob> {
		this._ensureNotDisposed();

		if (!this.state.activeStream || this.state.status !== "ready") {
			const error = new WebcamError("Camera is not ready for capture", WebcamErrorCode.STREAM_FAILED);
			this._callError(error);
			throw error;
		}

		if (!this.state.videoElement) {
			const error = new WebcamError("No video element available for capture", WebcamErrorCode.VIDEO_ELEMENT_NOT_SET);
			this._callError(error);
			throw error;
		}

		try {
			return await this._captureFromVideoElement(this.state.videoElement);
		} catch (error) {
			const webcamError = new WebcamError("Failed to capture image", WebcamErrorCode.CAPTURE_FAILED);
			this._callError(webcamError);
			throw webcamError;
		}
	}

	async getDeviceCapabilities(deviceId: string): Promise<DeviceCapability> {
		this._ensureNotDisposed();

		try {
			// Test stream to get capabilities
			const testStream = await navigator.mediaDevices.getUserMedia({
				video: { deviceId: { exact: deviceId } },
			});

			const track = testStream.getVideoTracks()[0];
			const capabilities = track.getCapabilities();
			const settings = track.getSettings();

			// Stop test stream
			testStream.getTracks().forEach((t) => t.stop());

			return {
				deviceId,
				label: track.label,
				maxWidth: capabilities.width?.max || settings.width || 1920,
				maxHeight: capabilities.height?.max || settings.height || 1080,
				minWidth: capabilities.width?.min || 320,
				minHeight: capabilities.height?.min || 240,
				supportedFrameRates:
					capabilities.frameRate && capabilities.frameRate.min !== undefined && capabilities.frameRate.max !== undefined
						? [capabilities.frameRate.min, capabilities.frameRate.max]
						: undefined,
				hasZoom: "zoom" in capabilities,
				hasTorch: "torch" in capabilities,
				hasFocus: "focusMode" in capabilities,
				maxZoom: (capabilities as any).zoom?.max,
				minZoom: (capabilities as any).zoom?.min,
				supportedFocusModes: (capabilities as any).focusMode,
			};
		} catch (error) {
			const webcamError = new WebcamError(
				`Failed to get device capabilities: ${error instanceof Error ? error.message : "Unknown error"}`,
				WebcamErrorCode.DEVICES_ERROR,
			);
			this._callError(webcamError);
			throw webcamError;
		}
	}

	dispose(): void {
		if (this._disposed) return;

		this.stopCamera();

		if (this._deviceChangeListener) {
			navigator.mediaDevices.removeEventListener("devicechange", this._deviceChangeListener);
			this._deviceChangeListener = undefined;
		}

		this._disposed = true;
		this._config = undefined;
	}

	// --- Private Helper Methods ---
	private _ensureNotDisposed(): void {
		if (this._disposed) {
			throw new WebcamError("TsWebcam instance has been disposed", WebcamErrorCode.UNKNOWN_ERROR);
		}
	}

	private _setStatus(status: TsWebcamStateInternal["status"]): void {
		this.state.status = status;
	}

	private _setError(error: WebcamError): void {
		this.state.error = error;
		this._setStatus("error");
	}

	private _clearError(): void {
		this.state.error = null;
	}

	private _buildConstraints(config: WebcamConfiguration): MediaStreamConstraints {
		const { deviceInfo, preferredResolutions, enableAudio } = config;
		const resolution = Array.isArray(preferredResolutions) ? preferredResolutions[0] : preferredResolutions;
		if (!resolution) {
			throw new Error("No resolution specified in preferredResolutions");
		}

		const videoConstraints: MediaTrackConstraints = {
			deviceId: { exact: deviceInfo.deviceId },
			width: { exact: resolution.width },
			height: { exact: resolution.height },
			aspectRatio: { exact: resolution.width / resolution.height },
		};

		return {
			video: videoConstraints,
			audio: enableAudio || false,
		};
	}

	private _handleStartCameraError(error: any, config?: WebcamConfiguration): WebcamError {
		// Extract device and resolution info
		let deviceLabel = config?.deviceInfo?.label || config?.deviceInfo?.deviceId || "Unknown device";
		let resolution = Array.isArray(config?.preferredResolutions) ? config?.preferredResolutions[0] : config?.preferredResolutions;
		let resolutionText = resolution ? `${resolution.width}x${resolution.height}` : "Unknown resolution";
		let context = "startCamera";

		if (error instanceof WebcamError) {
			// Add context if not present
			error.message = `[${context}] ${error.message} (Device: ${deviceLabel}, Resolution: ${resolutionText})`;
			return error;
		}

		let baseMsg = `[${context}] `;
		if (error?.name === "NotAllowedError") {
			return new WebcamError(
				`${baseMsg}Camera access denied (Device: ${deviceLabel}, Resolution: ${resolutionText})`,
				WebcamErrorCode.PERMISSION_DENIED,
			);
		}

		if (error?.name === "NotFoundError") {
			return new WebcamError(
				`${baseMsg}Camera device not found (Device: ${deviceLabel}, Resolution: ${resolutionText})`,
				WebcamErrorCode.DEVICE_NOT_FOUND,
			);
		}

		if (error?.name === "NotReadableError") {
			return new WebcamError(
				`${baseMsg}Camera is already in use (Device: ${deviceLabel}, Resolution: ${resolutionText})`,
				WebcamErrorCode.DEVICE_BUSY,
			);
		}

		if (error?.name === "OverconstrainedError") {
			return new WebcamError(
				`${baseMsg}Camera constraints not satisfied (Device: ${deviceLabel}, Resolution: ${resolutionText})`,
				WebcamErrorCode.OVERCONSTRAINED,
			);
		}

		// เพิ่มรายละเอียด error message
		const details = [error?.message, error?.name, error?.code, error?.constraint, error?.toString && error.toString()].filter(Boolean).join(" | ");

		return new WebcamError(
			`${baseMsg}Failed to start camera: ${details || "Unknown error"} (Device: ${deviceLabel}, Resolution: ${resolutionText})`,
			WebcamErrorCode.UNKNOWN_ERROR,
		);
	}

	private async _captureFromVideoElement(videoElement: HTMLVideoElement): Promise<Blob> {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");

		if (!context) {
			throw new Error("Could not get canvas context");
		}

		canvas.width = videoElement.videoWidth;
		canvas.height = videoElement.videoHeight;
		context.drawImage(videoElement, 0, 0);

		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error("Failed to create blob from canvas"));
					}
				},
				"image/jpeg",
				0.9,
			);
		});
	}

	/** Mirror control (CSS only, always supported if video element present) */
	public setMirror(mirror: boolean): void {
		if (this.state.videoElement) {
			this.state.videoElement.style.transform = mirror ? "scaleX(-1)" : "";
		}
	}

	/** Get current mirror state */
	public getMirror(): boolean {
		return !!(this.state.videoElement && this.state.videoElement.style.transform === "scaleX(-1)");
	}

	/** Check if mirror is supported */
	public isMirrorSupported(): boolean {
		return !!this.state.videoElement;
	}

	/** Torch control (if supported) */
	public async setTorch(enabled: boolean): Promise<void> {
		const track = this._getActiveVideoTrack();
		if (this.isTorchSupported()) {
			// @ts-ignore
			await track.applyConstraints({ advanced: [{ torch: enabled }] });
		} else {
			throw new Error("Torch is not supported on this device");
		}
	}

	/** Get current torch state (if supported) */
	public getTorch(): boolean | undefined {
		const track = this._getActiveVideoTrack();
		if (this.isTorchSupported()) {
			// @ts-ignore
			return track.getSettings().torch;
		}
		return undefined;
	}

	/** Check if torch is supported */
	public isTorchSupported(): boolean {
		const track = this._getActiveVideoTrack();
		return !!(track && "torch" in track.getCapabilities());
	}

	/** Zoom control (if supported) */
	public async setZoom(zoom: number): Promise<void> {
		const track = this._getActiveVideoTrack();
		if (this.isZoomSupported()) {
			// @ts-ignore
			await track.applyConstraints({ advanced: [{ zoom }] });
		} else {
			throw new Error("Zoom is not supported on this device");
		}
	}

	/** Get current zoom level (if supported) */
	public getZoom(): number | undefined {
		const track = this._getActiveVideoTrack();
		if (this.isZoomSupported()) {
			// @ts-ignore
			return track.getSettings().zoom;
		}
		return undefined;
	}

	/** Check if zoom is supported */
	public isZoomSupported(): boolean {
		const track = this._getActiveVideoTrack();
		return !!(track && "zoom" in track.getCapabilities());
	}

	/** Focus mode control (if supported) */
	public async setFocusMode(mode: string): Promise<void> {
		const track = this._getActiveVideoTrack();
		if (this.isFocusSupported()) {
			// @ts-ignore
			await track.applyConstraints({ advanced: [{ focusMode: mode }] });
		} else {
			throw new Error("Focus mode is not supported on this device");
		}
	}

	/** Get current focus mode (if supported) */
	public getFocusMode(): string | undefined {
		const track = this._getActiveVideoTrack();
		if (this.isFocusSupported()) {
			// @ts-ignore
			return track.getSettings().focusMode;
		}
		return undefined;
	}

	/** Check if focus mode is supported */
	public isFocusSupported(): boolean {
		const track = this._getActiveVideoTrack();
		return !!(track && "focusMode" in track.getCapabilities());
	}

	/** Helper: get the active video track */
	private _getActiveVideoTrack(): MediaStreamTrack | undefined {
		return this.state.activeStream?.getVideoTracks()[0];
	}
}
