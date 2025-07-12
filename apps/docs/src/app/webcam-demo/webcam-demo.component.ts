import { CommonModule } from "@angular/common";
import {
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
	computed,
	effect,
	signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	DeviceCapability,
	PermissionRequestOptions,
	Resolution,
	WebcamState,
	WebcamConfiguration,
	WebcamStatus,
} from "ts-webcam";
import { WebcamService } from "./webcam.service";

interface UiState {
	isLoading: boolean;
	isReady: boolean;
	isError: boolean;
	canStart: boolean;
	canStop: boolean;
	canCapture: boolean;
	canSwitchDevice: boolean;
	canSwitchResolution: boolean;
}

@Component({
	selector: "app-webcam-demo",
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: "./webcam-demo.component.html",
	styleUrls: ["./webcam-demo.component.css"],
})
export class WebcamDemoComponent implements OnInit, OnDestroy {
	@ViewChild("videoElement", { static: false })
	videoElementRef!: ElementRef<HTMLVideoElement>;

	// Static data
	readonly resolutions: Resolution[] = [
		{ name: "VGA-Landscape", width: 640, height: 480 },
		{ name: "VGA-Portrait", width: 480, height: 640 },
		{ name: "HD-Landscape", width: 1280, height: 720 },
		{ name: "HD-Portrait", width: 720, height: 1280 },
		{ name: "Full-HD-Landscape", width: 1920, height: 1080 },
		{ name: "Full-HD-Portrait", width: 1080, height: 1920 },
		{ name: "S720", width: 720, height: 720 },
		{ name: "S1080", width: 1080, height: 1080 },
		{ name: "S1280", width: 1280, height: 1280 },
		{ name: "S1440", width: 1440, height: 1440 },
		{ name: "S1920", width: 1920, height: 1920 },
	];

	// Reactive state using signals
	readonly permissionOptions = signal<PermissionRequestOptions>({ video: true, audio: false });
	readonly selectedDevice = signal<MediaDeviceInfo | null>(null);
	readonly selectedResolution = signal<Resolution>(this.resolutions[0]);
	readonly enableMirror = signal<boolean>(true);
	readonly enableAudio = signal<boolean>(false);
	readonly torchEnabled = signal<boolean>(false);
	readonly hasTorch = signal<boolean>(false);
	readonly videoReady = signal<boolean>(false);
	readonly zoom = signal<number | null>(null);
	readonly minZoom = signal<number | null>(null);
	readonly maxZoom = signal<number | null>(null);
	readonly focusMode = signal<string | null>(null);
	readonly supportedFocusModes = signal<string[]>([]);
	readonly capturedImageUrl = signal<string | null>(null);
	readonly lastTestedDeviceCapabilities = signal<DeviceCapability | null>(null);

	// Store event listeners for cleanup
	private videoEventListeners: { [key: string]: () => void } = {};

	// Reactive computed properties
	readonly currentConfig = computed(() => {
		const deviceInfo = this.devices().find(
			(device: MediaDeviceInfo) => device === this.selectedDevice(),
		);
		if (!deviceInfo || !this.videoElementRef?.nativeElement) {
			console.warn("No device info or video element found");
			return null;
		}

		return {
			deviceInfo,
			preferredResolutions: this.selectedResolution(),
			videoElement: this.videoElementRef.nativeElement,
			enableMirror: this.enableMirror(),
			enableAudio: this.enableAudio(),
		} as WebcamConfiguration;
	});

	// Reactive state from service
	readonly devices = signal<MediaDeviceInfo[]>([]);
	readonly webcamState = signal<WebcamState | null>(null);
	readonly permissionChecked = signal<boolean>(false);
	readonly deviceCapabilities = signal<DeviceCapability | null>(null);

	// Computed properties from webcam state
	readonly error = computed(() => this.webcamState()?.error?.message || null);
	readonly status = computed(() => this.webcamState()?.status || "idle");
	readonly permissions = computed(() => this.webcamState()?.permissions || {});

	// UI State computed from service data
	readonly uiState = computed<UiState>(() => {
		const currentStatus = this.status();
		const isLoading = currentStatus === "initializing";
		const isReady = currentStatus === "ready";
		const isError = currentStatus === "error";
		const hasSelectedDevice = !!this.selectedDevice();
		const isPermissionGranted = this.permissionChecked() && !this.isPermissionCameraDenied();

		return {
			isLoading,
			isReady,
			isError,
			canStart: isPermissionGranted && hasSelectedDevice && !isLoading && !isReady,
			canStop: isReady,
			canCapture: isReady,
			canSwitchDevice: hasSelectedDevice && !isLoading,
			canSwitchResolution: hasSelectedDevice && !isLoading,
		};
	});

	// Add effect to update zoom/focus UI state from deviceCapabilities
	constructor(public webcamService: WebcamService) {
		// Auto-select first device when devices change
		effect(
			() => {
				const devices = this.devices();
				if (devices.length > 0 && !this.selectedDevice()) {
					console.log("Selecting first device:", devices[0]);
					this.selectedDevice.set(devices[0]);
				}
			},
			{ allowSignalWrites: true },
		);

		// Use effects for service signals synchronization
		effect(
			() => {
				const state = this.webcamService.getState()();
				console.log("Webcam state changed:", state); // Debug log
				this.webcamState.set(state);

				// Reset video ready state when status changes to non-ready states
				if (state.status !== "ready") {
					this.videoReady.set(false);

					// Also clear video source if status is idle or error
					if (state.status === "idle" || state.status === "error") {
						const videoElement = this.videoElementRef?.nativeElement;
						if (videoElement) {
							videoElement.srcObject = null;
						}
					}
				}
			},
			{ allowSignalWrites: true },
		);

		effect(
			() => {
				const devices = this.webcamService.getDevices()();
				this.devices.set(devices);
			},
			{ allowSignalWrites: true },
		);

		effect(
			() => {
				const checked = this.webcamService.getPermissionChecked()();
				this.permissionChecked.set(checked);
			},
			{ allowSignalWrites: true },
		);

		effect(
			() => {
				const caps = this.webcamService.getDeviceCapabilities()();
				this.deviceCapabilities.set(caps);
			},
			{ allowSignalWrites: true },
		);

		effect(
			() => {
				const caps = this.deviceCapabilities();
				if (caps && typeof caps.maxZoom === "number" && typeof caps.minZoom === "number") {
					this.minZoom.set(caps.minZoom);
					this.maxZoom.set(caps.maxZoom);
					// Optionally set default zoom to minZoom
					this.zoom.set(caps.minZoom);
				} else {
					this.minZoom.set(null);
					this.maxZoom.set(null);
					this.zoom.set(null);
				}
				if (caps && Array.isArray(caps.supportedFocusModes)) {
					this.supportedFocusModes.set(caps.supportedFocusModes);
					this.focusMode.set(caps.supportedFocusModes[0] || null);
				} else {
					this.supportedFocusModes.set([]);
					this.focusMode.set(null);
				}
			},
			{ allowSignalWrites: true },
		);
	}

	async ngOnInit() {
		// Initial permission/device check
		this.requestPermissionsAndLoadDevices();
	}

	ngOnDestroy() {
		// Clean up video event listeners
		const videoElement = this.videoElementRef?.nativeElement;
		if (videoElement) {
			Object.keys(this.videoEventListeners).forEach((eventName) => {
				videoElement.removeEventListener(eventName, this.videoEventListeners[eventName]);
			});
		}

		// Stop camera and dispose of resources
		this.webcamService.dispose();
	}

	// Permission methods
	async requestPermissionsAndLoadDevices() {
		await this.webcamService.requestPermissions(this.permissionOptions());
		await this.webcamService.getAvailableDevices();
	}

	isPermissionCameraDenied(): boolean {
		return this.webcamService.isPermissionCameraDenied();
	}

	// Camera control methods
	public async startCamera() {
		const config = this.currentConfig();
		if (!config) {
			console.error("Configuration is invalid, please check settings");
			return;
		}

		// Start camera
		await this.webcamService.startCamera(config);

		// Check torch support and set video ready state
		setTimeout(() => {
			this.checkTorchSupport();
			this.checkVideoReady();
			// Update device capabilities after camera starts
			const caps = this.webcamService.getDeviceCapabilities()();
			this.deviceCapabilities.set(caps);
		}, 100);
	}

	// Stop camera
	public stopCamera() {
		// Stop camera
		this.webcamService.stopCamera();

		// Reset torch state and video ready state when stopping camera
		this.hasTorch.set(false);
		this.torchEnabled.set(false);
		this.videoReady.set(false);

		// Clear video source and clean up event listeners
		const videoElement = this.videoElementRef?.nativeElement;
		if (videoElement) {
			// Clear the video source
			videoElement.srcObject = null;

			// Clean up video event listeners using stored references
			Object.keys(this.videoEventListeners).forEach((eventName) => {
				videoElement.removeEventListener(eventName, this.videoEventListeners[eventName]);
			});
			this.videoEventListeners = {};
		}
	}

	/**
	 * Switches the currently selected device.
	 * This method stops the current camera, updates the selected device, and restarts the camera with the new configuration.
	 * @returns A Promise that resolves when the device switch is complete.
	 */
	async switchDevice(): Promise<void> {
		if (!this.uiState().canSwitchDevice) {
			console.error("Cannot switch device: no device selected or camera is loading");
			return;
		}

		this.stopCamera();
		await this.startCamera();
	}

	/**
	 * Switches the currently selected resolution.
	 * This method stops the current camera, updates the selected resolution, and restarts the camera with the new configuration.
	 * @returns A Promise that resolves when the resolution switch is complete.
	 */
	async switchResolution() {
		if (!this.uiState().canSwitchResolution) return;

		this.stopCamera();
		await this.startCamera();
	}

	/**
	 * Captures an image from the webcam.
	 * This method triggers the capture process and updates the captured image URL.
	 * @returns A Promise that resolves when the capture is complete.
	 */
	async capture(): Promise<void> {
		if (!this.uiState().canCapture) {
			console.error("Cannot capture: no device selected or camera is loading");
			return;
		}

		try {
			const blob = await this.webcamService.capture();
			if (blob) {
				// Create a temporary object URL for preview
				const url = URL.createObjectURL(blob);
				this.capturedImageUrl.set(url);
			}
		} catch (error) {
			console.error("Capture failed:", error);
		}
	}

	/**
	 * Clears the currently captured image.
	 * This method revokes the object URL of the captured image and resets the URL state.
	 */
	clearCapturedImage() {
		const url = this.capturedImageUrl();
		if (url) {
			URL.revokeObjectURL(url);
			this.capturedImageUrl.set(null);
		}
	}

	/**
	 * Tests the capabilities of the currently selected device.
	 * This method stops the camera, tests the device capabilities, and restarts the camera if needed.
	 * @returns A Promise that resolves when the test is complete.
	 */
	async testDeviceCapabilities() {
		const device = this.selectedDevice();
		if (!device) return;

		try {
			// Stop camera if running
			if (this.uiState().isReady) {
				this.stopCamera();
			}
			// Test device capabilities via service
			await this.webcamService.testDeviceCapabilities(device.deviceId);
			// Store the result for display
			this.lastTestedDeviceCapabilities.set(this.deviceCapabilities());
			// Optionally, start camera again after testing
			// await this.startCamera();
		} catch (e) {
			console.error("Test device capabilities failed:", e);
		}
	}

	/**
	 * Updates the permission options and applies them to the service.
	 * @param options Partial permission options to merge with the current settings.
	 */
	updatePermissionOptions(options: Partial<PermissionRequestOptions>) {
		this.permissionOptions.set({ ...this.permissionOptions(), ...options });
	}

	/**
	 * Handles changes in the video permission checkbox.
	 * This method updates the permission options and triggers a permission check.
	 * @param event The event object containing the checkbox state.
	 */
	onVideoPermissionChange(event: Event) {
		const checked = (event.target as HTMLInputElement)?.checked ?? false;
		this.updatePermissionOptions({ video: checked });
	}

	/**
	 * Handles changes in the audio permission checkbox.
	 * This method updates the permission options and triggers a permission check.
	 * @param event The event object containing the checkbox state.
	 */
	onAudioPermissionChange(event: Event) {
		const checked = (event.target as HTMLInputElement)?.checked ?? false;
		this.updatePermissionOptions({ audio: checked });
	}

	/**
	 * Handles changes in the device selection dropdown.
	 * This method updates the selected device and triggers an auto-switch if the camera is already running.
	 * @param device The selected MediaDeviceInfo, or null to clear the selection.
	 */
	onDeviceChange(device: MediaDeviceInfo | null) {
		console.log("Selected device:", device);
		this.selectedDevice.set(device);
		// Only auto-switch if camera is already running
		if (this.uiState().isReady) {
			this.switchDevice();
		}
	}

	/**
	 * Handles changes in the resolution selection dropdown.
	 * This method updates the selected resolution and triggers an auto-switch if the camera is already running.
	 * @param event The event object containing the selected resolution value.
	 */
	onResolutionChange(event: Event) {
		const value = (event.target as HTMLSelectElement)?.value ?? "0";
		const index = parseInt(value, 10);
		if (index >= 0 && index < this.resolutions.length) {
			this.selectedResolution.set(this.resolutions[index]);
			// Only auto-switch if camera is already running
			if (this.uiState().isReady) {
				this.switchResolution();
			}
		}
	}

	/**
	 * Handles changes in the mirror checkbox.
	 * This method updates the mirror state and triggers a camera restart if the camera is already running.
	 * @param event The event object containing the checkbox state.
	 */
	async onMirrorChange(event: Event) {
		const checked = (event.target as HTMLInputElement)?.checked ?? false;
		this.enableMirror.set(checked);
		try {
			this.webcamService.webcamInstance.setMirror(checked);
		} catch (e) {
			console.error("Failed to set mirror:", e);
		}
	}

	/**
	 * Handles changes in the audio checkbox.
	 * This method updates the audio state and triggers a camera restart if the camera is already running.
	 * @param event The event object containing the checkbox state.
	 */
	async onAudioChange(event: Event) {
		const checked = (event.target as HTMLInputElement)?.checked ?? false;
		this.enableAudio.set(checked);
		await this.startCamera();
	}

	/**
	 * Handles changes in the zoom input field.
	 * This method updates the zoom level and triggers a camera restart if the camera is already running.
	 * @param event The event object containing the zoom value.
	 */
	async onZoomChange(event: Event) {
		const value = +(event.target as HTMLInputElement)?.value;
		if (isNaN(value) || this.zoom() === value) return;
		this.zoom.set(value);
		try {
			await this.webcamService.webcamInstance.setZoom(value);
		} catch (e) {
			console.error("Failed to set zoom:", e);
		}
	}

	/**
	 * Handles changes in the focus mode selection dropdown.
	 * This method updates the focus mode and triggers a camera restart if the camera is already running.
	 * @param event The event object containing the selected focus mode value.
	 */
	async onFocusModeChange(event: Event) {
		const value = (event.target as HTMLSelectElement)?.value;
		this.focusMode.set(value);
		try {
			await this.webcamService.webcamInstance.setFocusMode(value);
		} catch (e) {
			console.error("Failed to set focus mode:", e);
		}
	}

	/**
	 * Toggles the torch state.
	 * This method checks if the device supports torch, toggles the torch state, and updates the UI accordingly.
	 */
	async toggleTorch() {
		if (!this.hasTorch()) return;
		try {
			const enabled = !this.torchEnabled();
			await this.webcamService.webcamInstance.setTorch(enabled);
			this.torchEnabled.set(enabled);
		} catch (error) {
			console.error("Failed to toggle torch:", error);
		}
	}

	/**
	 * Checks if the device supports torch.
	 * This method retrieves the video track capabilities and updates the hasTorch state accordingly.
	 */
	private checkTorchSupport() {
		const stream = this.videoElementRef?.nativeElement?.srcObject as MediaStream;
		if (stream) {
			const track = stream.getVideoTracks()[0];
			if (track) {
				const capabilities = track.getCapabilities();
				this.hasTorch.set("torch" in capabilities);
			}
		}
	}

	/**
	 * Checks if the video is ready and playing.
	 * This method updates the videoReady state based on the video element's source and playback status.
	 */
	private checkVideoReady() {
		const videoElement = this.videoElementRef?.nativeElement;
		if (videoElement && videoElement.srcObject) {
			const stream = videoElement.srcObject as MediaStream;
			const isActive = stream.active && stream.getVideoTracks().length > 0;
			this.videoReady.set(isActive);

			// Clean up previous event listeners
			Object.keys(this.videoEventListeners).forEach((eventName) => {
				videoElement.removeEventListener(eventName, this.videoEventListeners[eventName]);
			});

			// Create new event listener function
			const updateVideoReady = () => {
				const hasStream = !!videoElement.srcObject;
				const streamActive = hasStream && (videoElement.srcObject as MediaStream).active;
				const isPlaying = !videoElement.paused && !videoElement.ended;
				const hasActiveTracks =
					hasStream && (videoElement.srcObject as MediaStream).getVideoTracks().length > 0;
				this.videoReady.set(hasStream && streamActive && isPlaying && hasActiveTracks);
			};

			// Store event listeners for proper cleanup
			this.videoEventListeners = {
				loadedmetadata: updateVideoReady,
				play: updateVideoReady,
				pause: updateVideoReady,
				ended: updateVideoReady,
			};

			// Add event listeners
			Object.keys(this.videoEventListeners).forEach((eventName) => {
				videoElement.addEventListener(eventName, this.videoEventListeners[eventName]);
			});
		} else {
			// No video source, definitely not ready
			this.videoReady.set(false);
		}
	}

	/**
	 * Retrieves the name of the currently selected camera.
	 * This method determines the device label or generates a name based on the device ID if available.
	 * @returns string - The name of the selected camera.
	 */
	public getCurrentCameraName(): string {
		const device = this.selectedDevice();
		if (!device) return "Unknown camera";

		return device.label || `Camera (${device.deviceId.slice(0, 8)}...)`;
	}

	/**
	 * Retrieves the type of the device running the application.
	 * This method uses the user agent to identify the device platform.
	 * @returns string - The type of the device (Android, iOS, macOS, Windows, Linux, or Desktop).
	 */
	public getDeviceType(): string {
		// Detect device type based on user agent
		const userAgent = navigator.userAgent.toLowerCase();
		if (/android/.test(userAgent)) return "Android";
		if (/iphone|ipad|ipod/.test(userAgent)) return "iOS";
		if (/mac/.test(userAgent)) return "macOS";
		if (/win/.test(userAgent)) return "Windows";
		if (/linux/.test(userAgent)) return "Linux";
		return "Desktop";
	}

	/**
	 * Retrieves the current status text based on the webcam state.
	 * This method maps the webcam state to a human-readable status text.
	 * @returns string - The status text corresponding to the current webcam state.
	 */
	public getStatusText(): string {
		const currentStatus: WebcamStatus = this.status();
		switch (currentStatus) {
			case "ready":
				return "Active";
			case "initializing":
				return "Starting...";
			case "error":
				return "Error";
			case "idle":
				return "Inactive";
			default:
				return "Unknown";
		}
	}
}
