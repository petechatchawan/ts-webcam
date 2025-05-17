import { UAInfo } from "ua-info";
import {
	DEFAULT_CAPABILITIES,
	DEFAULT_CONFIG,
	DEFAULT_STATE,
} from "./constants";
import { WebcamError } from "./errors";
import {
	DeviceCapabilities,
	ExtendedMediaTrackCapabilities,
	ExtendedMediaTrackConstraintSet,
	ExtendedMediaTrackSettings,
	Resolution,
	WebcamCapabilities,
	WebcamConfiguration,
	WebcamState,
} from "./interfaces";
import { PermissionStatus, WebcamStatus } from "./types";
import {
	buildConstraints,
	createResolution,
	stopStream,
	validatePermissions,
} from "./utils";

export class Webcam {
	private state: WebcamState;
	private deviceChangeListener: (() => void) | null = null;
	private orientationChangeListener: (() => void) | null = null;
	public uaInfo = new UAInfo();

	constructor() {
		this.uaInfo.setUserAgent(navigator.userAgent);
		this.state = {
			...DEFAULT_STATE,
			captureCanvas: document.createElement("canvas"),
			status: WebcamStatus.IDLE,
			configuration: null,
		};

		this.handleError = this.handleError.bind(this);
	}

	// Public Methods
	public getState(): WebcamState {
		return { ...this.state };
	}

	public getStatus(): WebcamStatus {
		return this.state.status;
	}

	public getCapabilities(): WebcamCapabilities {
		return { ...this.state.capabilities };
	}

	public getLastError(): WebcamError | null {
		return this.state.lastError;
	}

	public clearError(): void {
		this.state.lastError = null;
		if (!this.isActive()) {
			this.state.status = WebcamStatus.IDLE;
		}
	}

	public isActive(): boolean {
		return this.state.activeStream !== null && this.state.activeStream.active;
	}

	public isAudioEnabled(): boolean {
		return this.state.configuration?.audioEnabled || false;
	}

	public isMirrorEnabled(): boolean {
		return this.state.configuration?.mirrorEnabled || false;
	}

	public isResolutionSwapAllowed(): boolean {
		return this.state.configuration?.allowResolutionSwap || false;
	}

	public isAnyResolutionAllowed(): boolean {
		return this.state.configuration?.allowAnyResolution || false;
	}

	public isZoomSupported(): boolean {
		return this.state.capabilities.zoomSupported;
	}

	public isTorchSupported(): boolean {
		return this.state.capabilities.torchSupported;
	}

	public isFocusSupported(): boolean {
		return this.state.capabilities.focusSupported;
	}

	public getZoomLevel(): number {
		return this.state.capabilities.zoomLevel;
	}

	public getMinZoomLevel(): number {
		return this.state.capabilities.minZoomLevel;
	}

	public getMaxZoomLevel(): number {
		return this.state.capabilities.maxZoomLevel;
	}

	public isTorchActive(): boolean {
		return this.state.capabilities.torchActive;
	}

	public isFocusActive(): boolean {
		return this.state.capabilities.focusActive;
	}

	public setupConfiguration(configuration: WebcamConfiguration): void {
		if (!configuration.device) {
			throw new WebcamError("invalid-device-id", "Device ID is required");
		}

		this.state.configuration = {
			...DEFAULT_CONFIG,
			...configuration,
		};
	}

	public async start(): Promise<void> {
		this.checkConfiguration();
		try {
			await this.initializeWebcam();
		} catch (error) {
			if (error instanceof WebcamError) {
				this.handleError(error);
			} else {
				this.handleError(
					new WebcamError(
						"webcam-start-error",
						"Failed to start webcam",
						error as Error,
					),
				);
			}
			throw this.state.lastError;
		}
	}

	public stop(): void {
		this.checkConfiguration();
		this.stopStream();
		this.resetState();
	}

	public async previewIsReady(): Promise<boolean> {
		const video = this.state.configuration?.previewElement;

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

	public async setZoom(zoomLevel: number): Promise<void> {
		if (!this.state.activeStream || !this.state.capabilities.zoomSupported) {
			throw new WebcamError(
				"zoom-not-supported",
				"Zoom is not supported or webcam is not active",
			);
		}

		const videoTrack = this.state.activeStream.getVideoTracks()[0];
		const capabilities =
			videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

		if (!capabilities.zoom) {
			throw new WebcamError(
				"zoom-not-supported",
				"Zoom is not supported by this device",
			);
		}

		try {
			const constrainedZoomLevel = Math.min(
				Math.max(zoomLevel, capabilities.zoom.min),
				capabilities.zoom.max,
			);

			await videoTrack.applyConstraints({
				advanced: [
					{
						zoom: constrainedZoomLevel,
					} as ExtendedMediaTrackConstraintSet,
				],
			});

			this.state.capabilities.zoomLevel = constrainedZoomLevel;
		} catch (error) {
			throw new WebcamError(
				"webcam-settings-error",
				"Failed to set zoom level",
				error as Error,
			);
		}
	}

	public async setTorch(active: boolean): Promise<void> {
		if (!this.state.activeStream || !this.state.capabilities.torchSupported) {
			throw new WebcamError(
				"torch-not-supported",
				"Torch is not supported or webcam is not active",
			);
		}

		const videoTrack = this.state.activeStream.getVideoTracks()[0];
		const capabilities =
			videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

		if (!capabilities.torch) {
			throw new WebcamError(
				"torch-not-supported",
				"Torch is not supported by this device",
			);
		}

		try {
			await videoTrack.applyConstraints({
				advanced: [{ torch: active } as ExtendedMediaTrackConstraintSet],
			});

			this.state.capabilities.torchActive = active;
		} catch (error) {
			throw new WebcamError(
				"webcam-settings-error",
				"Failed to set torch mode",
				error as Error,
			);
		}
	}

	public async setFocusMode(mode: string): Promise<void> {
		if (!this.state.activeStream || !this.state.capabilities.focusSupported) {
			throw new WebcamError(
				"focus-not-supported",
				"Focus mode is not supported or webcam is not active",
			);
		}

		const videoTrack = this.state.activeStream.getVideoTracks()[0];
		const capabilities =
			videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

		if (!capabilities.focusMode || !capabilities.focusMode.includes(mode)) {
			throw new WebcamError(
				"focus-not-supported",
				`Focus mode '${mode}' is not supported by this device`,
			);
		}

		try {
			await videoTrack.applyConstraints({
				advanced: [{ focusMode: mode } as ExtendedMediaTrackConstraintSet],
			});

			this.state.capabilities.currentFocusMode = mode;
			this.state.capabilities.focusActive = true;
		} catch (error) {
			throw new WebcamError(
				"webcam-settings-error",
				"Failed to set focus mode",
				error as Error,
			);
		}
	}

	public async toggleTorch(): Promise<boolean> {
		if (!this.isTorchSupported()) {
			throw new WebcamError(
				"torch-not-supported",
				"Torch is not supported by this device",
			);
		}

		const newTorchState = !this.state.capabilities.torchActive;
		await this.setTorch(newTorchState);
		return newTorchState;
	}

	public toggleMirror(): boolean {
		this.checkConfiguration();
		const newValue = !this.state.configuration!.mirrorEnabled;
		this.updateConfiguration({ mirrorEnabled: newValue }, { restart: false });
		return newValue;
	}

	public createResolution(
		name: string,
		width: number,
		height: number,
	): Resolution {
		return createResolution(name, width, height);
	}

	public updateConfiguration(
		configuration: Partial<WebcamConfiguration>,
		options: { restart?: boolean } = { restart: true },
	): WebcamConfiguration {
		this.checkConfiguration();
		const wasActive = this.isActive();
		if (wasActive && options.restart) {
			this.stop();
		}

		this.state.configuration = {
			...this.state.configuration!,
			...configuration,
		};

		if (
			"mirrorEnabled" in configuration &&
			this.state.configuration!.previewElement
		) {
			this.state.configuration!.previewElement.style.transform = this.state
				.configuration!.mirrorEnabled
				? "scaleX(-1)"
				: "none";
		}

		if (wasActive || options.restart) {
			this.start().catch(this.handleError);
		}

		return { ...this.state.configuration! };
	}

	public updateResolution(
		resolution: Resolution | Resolution[],
		options: { restart?: boolean } = { restart: true },
	): WebcamConfiguration {
		return this.updateConfiguration({ resolution }, options);
	}

	public updateDevice(
		device: MediaDeviceInfo,
		options: { restart?: boolean } = { restart: true },
	): WebcamConfiguration {
		return this.updateConfiguration({ device }, options);
	}

	public async toggle(
		setting: "audioEnabled" | "allowResolutionSwap" | "allowAnyResolution",
	): Promise<boolean> {
		this.checkConfiguration();
		const newValue = !this.state.configuration![setting];

		if (setting === "audioEnabled" && newValue) {
			const micPermission = await this.checkMicrophonePermission();

			if (micPermission === "prompt") {
				const permission = await this.requestMediaPermission("audio");
				if (permission === "denied") {
					throw new WebcamError(
						"microphone-permission-denied",
						"Please allow microphone access",
					);
				}
			} else if (micPermission === "denied") {
				throw new WebcamError(
					"microphone-permission-denied",
					"Please allow microphone access",
				);
			}
		}

		const shouldRestart =
			setting === "audioEnabled" || setting === "allowResolutionSwap";
		this.updateConfiguration(
			{ [setting]: newValue },
			{ restart: shouldRestart },
		);

		return newValue;
	}

	public getConfiguration(): WebcamConfiguration {
		this.checkConfiguration();
		return { ...this.state.configuration! };
	}

	// Permission Management
	public async checkCameraPermission(): Promise<PermissionStatus> {
		try {
			if (navigator?.permissions?.query) {
				const { state } = await navigator.permissions.query({
					name: "camera" as PermissionName,
				});
				this.state.permissions.camera = state as PermissionStatus;
				return state as PermissionStatus;
			}
			this.state.permissions.camera = "prompt";
			return "prompt";
		} catch (error) {
			console.warn("Permissions API error:", error);
			this.state.permissions.camera = "prompt";
			return "prompt";
		}
	}

	public async checkMicrophonePermission(): Promise<PermissionStatus> {
		try {
			if (navigator?.permissions?.query) {
				const { state } = await navigator.permissions.query({
					name: "microphone" as PermissionName,
				});
				this.state.permissions.microphone = state as PermissionStatus;
				return state as PermissionStatus;
			}
			this.state.permissions.microphone = "prompt";
			return "prompt";
		} catch (error) {
			console.warn("Permissions API error:", error);
			this.state.permissions.microphone = "prompt";
			return "prompt";
		}
	}

	public async requestPermissions(): Promise<{
		camera: PermissionStatus;
		microphone: PermissionStatus;
	}> {
		const cameraPermission = await this.requestMediaPermission("video");
		let microphonePermission: PermissionStatus = "prompt";
		if (this.state.configuration?.audioEnabled) {
			microphonePermission = await this.requestMediaPermission("audio");
		}
		return {
			camera: cameraPermission,
			microphone: microphonePermission,
		};
	}

	public getCurrentPermissions(): {
		camera: PermissionStatus;
		microphone: PermissionStatus;
	} {
		return { ...this.state.permissions };
	}

	public needsPermissionRequest(): boolean {
		return (
			this.state.permissions.camera === "prompt" ||
			(!!this.state.configuration?.audioEnabled &&
				this.state.permissions.microphone === "prompt")
		);
	}

	public hasPermissionDenied(): boolean {
		return (
			this.state.permissions.camera === "denied" ||
			(!!this.state.configuration?.audioEnabled &&
				this.state.permissions.microphone === "denied")
		);
	}

	public async captureImage(
		config: {
			scale?: number;
			mediaType?: "image/png" | "image/jpeg";
			quality?: number;
		} = {},
	): Promise<string> {
		this.checkConfiguration();
		if (!this.state.activeStream) {
			throw new WebcamError(
				"no-stream",
				"No active stream to capture image from",
			);
		}

		const videoTrack = this.state.activeStream.getVideoTracks()[0];
		const settings = videoTrack.getSettings();

		const canvas = this.state.captureCanvas!;
		const context = canvas.getContext("2d");
		if (!context) {
			throw new WebcamError(
				"webcam-settings-error",
				"Failed to get canvas context",
			);
		}

		const scale = config.scale || 1;
		canvas.width = (settings.width || 640) * scale;
		canvas.height = (settings.height || 480) * scale;

		if (this.state.configuration!.mirrorEnabled) {
			context.translate(canvas.width, 0);
			context.scale(-1, 1);
		}

		context.drawImage(
			this.state.configuration!.previewElement!,
			0,
			0,
			canvas.width,
			canvas.height,
		);
		if (this.state.configuration!.mirrorEnabled) {
			context.setTransform(1, 0, 0, 1, 0, 0);
		}

		const mediaType = config.mediaType || "image/png";
		const quality =
			typeof config.quality === "number"
				? Math.min(Math.max(config.quality, 0), 1)
				: mediaType === "image/jpeg"
					? 0.92
					: undefined;

		return new Promise<string>((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						return reject(
							new WebcamError("capture-failed", "Failed to capture image"),
						);
					}
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				},
				mediaType,
				quality,
			);
		});
	}

	public async checkDevicesCapabilitiesData(
		deviceId: string,
	): Promise<DeviceCapabilities> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { deviceId: { exact: deviceId } },
			});

			const videoTrack = stream.getVideoTracks()[0];
			const capabilities =
				videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;

			const frameRates: number[] = [];
			if (
				capabilities.frameRate?.min &&
				capabilities.frameRate?.max &&
				capabilities.frameRate?.step
			) {
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
				supportedFocusModes: capabilities.focusMode,
			};
		} catch (error) {
			throw new WebcamError(
				"webcam-settings-error",
				"Failed to check device capabilities",
				error as Error,
			);
		}
	}

	public checkSupportedResolutions(
		deviceCapabilities: DeviceCapabilities[],
		desiredResolutions: Resolution[],
	): {
		resolutions: {
			key: string;
			width: number;
			height: number;
			supported: boolean;
		}[];
		deviceInfo: {
			deviceId: string;
			maxWidth: number;
			maxHeight: number;
			minWidth: number;
			minHeight: number;
		};
	} {
		const capability = deviceCapabilities[0];

		const deviceInfo = {
			deviceId: capability.deviceId,
			maxWidth: capability.maxWidth,
			maxHeight: capability.maxHeight,
			minWidth: capability.minWidth,
			minHeight: capability.minHeight,
		};

		const resolutions = desiredResolutions.map((resolution) => {
			const isSupported =
				resolution.width <= capability.maxWidth &&
				resolution.height <= capability.maxHeight &&
				resolution.width >= capability.minWidth &&
				resolution.height >= capability.minHeight;

			return {
				key: resolution.id,
				width: resolution.width,
				height: resolution.height,
				supported: isSupported,
			};
		});

		return {
			resolutions,
			deviceInfo,
		};
	}

	public async setupChangeListeners(): Promise<void> {
		// Add device change listener
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			throw new WebcamError(
				"no-media-devices-support",
				"MediaDevices API is not supported in this browser",
			);
		}

		// Update device list for the first time
		await this.refreshDevices();

		// Set device change listener
		this.deviceChangeListener = async () => {
			await this.refreshDevices();

			// Check if current device still exists
			const currentDevice = this.getCurrentDevice();
			if (this.isActive() && !currentDevice) {
				// If current device is gone, stop the operation
				this.handleError(
					new WebcamError("no-device", "Current device is no longer available"),
				);
				this.stop();
			}
		};

		// Set orientation change listener
		this.orientationChangeListener = () => {
			if (this.isActive()) {
				if (screen.orientation) {
					console.log("Screen orientation is supported");
					const orientation = screen.orientation.type as OrientationType;
					const angle = screen.orientation.angle;
					console.log(`Orientation type: ${orientation}, angle: ${angle}`);

					// Store current orientation
					this.state.currentOrientation = orientation;

					switch (orientation) {
						case "portrait-primary":
							console.log("Portrait (normal)");
							break;
						case "portrait-secondary":
							console.log("Portrait (flipped)");
							break;
						case "landscape-primary":
							console.log("Landscape (normal)");
							break;
						case "landscape-secondary":
							console.log("Landscape (flipped)");
							break;
						default:
							console.log("Unknown orientation");
							this.state.currentOrientation = "unknown";
					}
				} else {
					console.log("screen.orientation is not supported");
					this.state.currentOrientation = "unknown";
				}
			}
		};

		// Add listeners
		navigator.mediaDevices.addEventListener(
			"devicechange",
			this.deviceChangeListener,
		);
		window.addEventListener(
			"orientationchange",
			this.orientationChangeListener,
		);
	}

	private async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
				throw new WebcamError(
					"no-media-devices-support",
					"MediaDevices API is not supported in this browser",
				);
			}

			// Get available devices
			const devices = await navigator.mediaDevices.enumerateDevices();
			this.state.availableDevices = devices;

			return devices;
		} catch (error) {
			this.handleError(
				new WebcamError(
					"device-list-error",
					"Failed to get device list",
					error as Error,
				),
			);
			return [];
		}
	}

	public async refreshDevices(): Promise<void> {
		// Refresh device list
		await this.getAvailableDevices();
	}

	public async getVideoDevices(): Promise<MediaDeviceInfo[]> {
		// If no device information, call getAvailableDevices first
		if (this.state.availableDevices.length === 0) {
			await this.getAvailableDevices();
		}

		return this.state.availableDevices.filter(
			(device) => device.kind === "videoinput",
		);
	}

	public async getDevices(): Promise<MediaDeviceInfo[]> {
		// If no device information, call getAvailableDevices first
		if (this.state.availableDevices.length === 0) {
			await this.getAvailableDevices();
		}
		return this.state.availableDevices;
	}

	public async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
		// If no device information, call getAvailableDevices first
		if (this.state.availableDevices.length === 0) {
			await this.getAvailableDevices();
		}

		// filter only audio input devices
		return this.state.availableDevices.filter(
			(device) => device.kind === "audioinput",
		);
	}

	public async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
		// If no device information, call getAvailableDevices first
		if (this.state.availableDevices.length === 0) {
			await this.getAvailableDevices();
		}

		// filter only audio output devices
		return this.state.availableDevices.filter(
			(device) => device.kind === "audiooutput",
		);
	}

	public getCurrentDevice(): MediaDeviceInfo | null {
		if (!this.state.configuration?.device) return null;
		return this.state.configuration.device;
	}

	public getCurrentResolution(): Resolution | null {
		return this.state.currentResolution || null;
	}

	// Private Methods
	private async initializeWebcam(): Promise<void> {
		this.state.status = WebcamStatus.INITIALIZING;
		this.state.lastError = null;

		const permissions = await this.requestPermissions();
		validatePermissions(
			permissions,
			this.state.configuration!.audioEnabled || false,
		);

		await this.openWebcam();
	}

	private async openWebcam(): Promise<void> {
		if (!this.state.configuration!.resolution) {
			if (!this.state.configuration!.allowAnyResolution) {
				throw new WebcamError(
					"configuration-error",
					"Please specify a resolution or set allowAnyResolution to true",
				);
			}

			try {
				await this.tryAnyResolution();
				return;
			} catch (error) {
				throw new WebcamError(
					"webcam-initialization-error",
					"Failed to open webcam with supported resolution",
					error as Error,
				);
			}
		}

		const resolutions = Array.isArray(this.state.configuration!.resolution)
			? this.state.configuration!.resolution
			: [this.state.configuration!.resolution];

		let lastError: Error | null = null;
		for (const resolution of resolutions) {
			try {
				await this.tryResolution(resolution);
				return;
			} catch (error) {
				lastError = new WebcamError(
					"webcam-initialization-error",
					`Failed to open webcam with resolution: ${resolution.id}`,
					error as Error,
				);
				console.log(
					`Failed to open webcam with resolution: ${resolution.id}. Trying next...`,
				);
			}
		}

		if (this.state.configuration!.allowAnyResolution) {
			try {
				console.log(
					"All specified resolutions failed. Trying any supported resolution...",
				);
				await this.tryAnyResolution();
			} catch (error) {
				throw new WebcamError(
					"webcam-initialization-error",
					"Failed to open webcam with any resolution",
					lastError || undefined,
				);
			}
		} else {
			throw lastError;
		}
	}

	private async tryResolution(resolution: Resolution): Promise<void> {
		const resolutionString = `${resolution.width}x${resolution.height}`;
		console.log(
			`Attempting to open webcam with resolution: ${resolution.id} (${resolutionString})`,
		);

		const constraints = buildConstraints(
			this.state.configuration!.device.deviceId,
			resolution,
			this.state.configuration!.allowResolutionSwap || false,
			this.state.configuration!.audioEnabled || false,
		);
		console.log("Using constraints:", constraints);

		try {
			this.state.activeStream =
				await navigator.mediaDevices.getUserMedia(constraints);
			await this.updateCapabilities();
			await this.setupPreviewElement();

			// Update currentResolution with actual resolution from stream
			const videoTrack = this.state.activeStream.getVideoTracks()[0];
			const settings = videoTrack.getSettings();
			this.state.currentResolution = {
				id: resolution.id,
				label: resolution.label,
				width: settings.width || resolution.width,
				height: settings.height || resolution.height,
			};

			console.log(
				`Successfully opened webcam with resolution: ${resolution.id}`,
			);

			this.state.status = WebcamStatus.READY;
			this.state.configuration?.onStart?.();
		} catch (error) {
			console.error(
				`Failed to open webcam with resolution: ${resolution.id}`,
				error,
			);
			throw error;
		}
	}

	private async tryAnyResolution(): Promise<void> {
		console.log(
			"Attempting to open webcam with any supported resolution (ideal: 4K)",
		);

		if (!this.state.configuration!.device) {
			throw new WebcamError("no-device", "Selected device not found");
		}

		const constraints: MediaStreamConstraints = {
			audio: this.state.configuration!.audioEnabled,
			video: {
				deviceId: { exact: this.state.configuration!.device.deviceId },
				width: { ideal: 3840 },
				height: { ideal: 2160 },
			},
		};

		try {
			this.state.activeStream =
				await navigator.mediaDevices.getUserMedia(constraints);
			await this.updateCapabilities();
			await this.setupPreviewElement();

			const videoTrack = this.state.activeStream!.getVideoTracks()[0];
			const settings = videoTrack.getSettings();

			// Update currentResolution with actual resolution from stream
			this.state.currentResolution = {
				id: `${settings.width}x${settings.height}`,
				label: `${settings.width}x${settings.height}`,
				width: settings.width || 0,
				height: settings.height || 0,
			};

			console.log(
				`Opened webcam with resolution: ${this.state.currentResolution.id}`,
			);

			this.state.status = WebcamStatus.READY;
			this.state.configuration?.onStart?.();
		} catch (error) {
			console.error("Failed to initialize webcam with any resolution", error);
			throw new WebcamError(
				"webcam-initialization-error",
				"Failed to initialize webcam with any resolution",
				error as Error,
			);
		}
	}

	private async setupPreviewElement(): Promise<void> {
		if (this.state.configuration!.previewElement && this.state.activeStream) {
			this.state.configuration!.previewElement.srcObject =
				this.state.activeStream;
			this.state.configuration!.previewElement.style.transform = this.state
				.configuration!.mirrorEnabled
				? "scaleX(-1)"
				: "none";
			await this.state.configuration!.previewElement.play();
		}
	}

	private async updateCapabilities(): Promise<void> {
		if (!this.state.activeStream) return;
		const videoTrack = this.state.activeStream.getVideoTracks()[0];
		const capabilities =
			videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
		const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings;

		this.state.capabilities = {
			zoomSupported: !!capabilities.zoom,
			torchSupported: !!capabilities.torch,
			focusSupported: !!capabilities.focusMode,
			zoomLevel: settings.zoom || 1,
			minZoomLevel: capabilities.zoom?.min || 1,
			maxZoomLevel: capabilities.zoom?.max || 1,
			torchActive: settings.torch || false,
			focusActive: !!settings.focusMode,
			currentFocusMode: settings.focusMode || "none",
			supportedFocusModes: capabilities.focusMode || [],
		};
	}

	private checkConfiguration(): void {
		if (!this.state.configuration) {
			throw new WebcamError(
				"configuration-error",
				"Please call setupConfiguration() before using webcam",
			);
		}
	}

	private handleError(error: Error): void {
		this.state.status = WebcamStatus.ERROR;
		this.state.lastError =
			error instanceof WebcamError
				? error
				: new WebcamError("unknown", error.message, error);

		this.state.configuration?.onError?.(this.state.lastError as WebcamError);
	}

	private stopStream(): void {
		stopStream(
			this.state.activeStream,
			this.state.configuration?.previewElement,
		);
	}

	private resetState(): void {
		this.stopChangeListeners();

		this.state = {
			...this.state,
			status: WebcamStatus.IDLE,
			activeStream: null,
			lastError: null,
			capabilities: DEFAULT_CAPABILITIES,
			currentResolution: null,
		};
	}

	private async requestMediaPermission(
		mediaType: "video" | "audio",
	): Promise<PermissionStatus> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				[mediaType]: true,
			});
			stream.getTracks().forEach((track) => track.stop());
			const permissionType = mediaType === "video" ? "camera" : "microphone";
			this.state.permissions[permissionType] = "granted";
			return "granted";
		} catch (error) {
			if (error instanceof Error) {
				if (
					error.name === "NotAllowedError" ||
					error.name === "PermissionDeniedError"
				) {
					const permissionType =
						mediaType === "video" ? "camera" : "microphone";
					this.state.permissions[permissionType] = "denied";
					return "denied";
				}
			}

			const permissionType = mediaType === "video" ? "camera" : "microphone";
			this.state.permissions[permissionType] = "prompt";
			return "prompt";
		}
	}

	private stopChangeListeners(): void {
		if (this.deviceChangeListener) {
			navigator.mediaDevices.removeEventListener(
				"devicechange",
				this.deviceChangeListener,
			);
			this.deviceChangeListener = null;
		}

		if (this.orientationChangeListener) {
			window.removeEventListener(
				"orientationchange",
				this.orientationChangeListener,
			);
			this.orientationChangeListener = null;
		}
	}
}

export default Webcam;
