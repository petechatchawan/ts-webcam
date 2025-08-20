import { CommonModule } from "@angular/common";
import {
	Component,
	ElementRef,
	OnDestroy,
	OnInit,
	ViewChild,
	computed,
	effect,
	inject,
	signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { SliderModule } from "primeng/slider";
import { SliderChangeEvent } from "primeng/slider";
import { CardModule } from "primeng/card";
import { PanelModule } from "primeng/panel";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import {
	PermissionRequestOptions,
	Resolution,
	WebcamConfiguration,
	WebcamState,
	WebcamStatus,
} from "ts-webcam";
import { WebcamService } from "./webcam.service";
import { SelectChangeEvent, SelectModule } from "primeng/select";
import { DeviceManagerUtils } from "../utils/device-manager-utils";
import { DividerModule } from "primeng/divider";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { MessageService } from "primeng/api";
import { ToolbarModule } from "primeng/toolbar";
import { TagModule } from "primeng/tag";
import { ToggleSwitchChangeEvent, ToggleSwitchModule } from "primeng/toggleswitch";
import { DialogModule } from "primeng/dialog";
import { SkeletonModule } from "primeng/skeleton";

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
	imports: [
		CommonModule,
		FormsModule,
		// PrimeNG
		ToolbarModule,
		TagModule,
		ToggleSwitchModule,
		SelectModule,
		CheckboxModule,
		SliderModule,
		CardModule,
		PanelModule,
		ProgressSpinnerModule,
		ButtonModule,
		DividerModule,
		ToastModule,
		TooltipModule,
		DialogModule,
		SkeletonModule,
	],
	providers: [MessageService],
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

	// Inject() to get instance of services
	readonly webcamService: WebcamService = inject(WebcamService);
	readonly messageService: MessageService = inject(MessageService);

	// Reactive state using signals
	readonly permissionOptions = signal<PermissionRequestOptions>({ video: true, audio: false });
	readonly selectedDevice = signal<MediaDeviceInfo | null>(null);
	readonly selectedResolution = signal<Resolution>(this.resolutions[0]);
	readonly enableAudio = signal<boolean>(false);
	readonly enableMirror = signal<boolean>(true);
	readonly enableTorch = signal<boolean>(false);
	readonly zoomValue = signal<number | null>(null);
	readonly minZoom = signal<number | null>(null);
	readonly maxZoom = signal<number | null>(null);
	readonly focusMode = signal<string | null>(null);
	readonly supportedFocusModes = signal<string[]>([]);
	readonly capturedImageUrl = signal<string | null>(null);
	readonly selectDeviceDetails = signal<MediaDeviceInfo | null>(null);
	readonly helpDialogVisible = signal(false);
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
			preferredResolutions: [
				{ name: "S1920", width: 1920, height: 1920 },
				{ name: "S1080", width: 1080, height: 1080 },
				{ name: "S720", width: 720, height: 720 },
			],
			videoElement: this.videoElementRef.nativeElement,
			enableMirror: this.enableMirror(),
			enableAudio: this.enableAudio(),
		} as WebcamConfiguration;
	});

	// Reactive state from service
	readonly devices = signal<MediaDeviceInfo[]>([]);
	readonly webcamState = signal<WebcamState | null>(null);

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
		const isPermissionGranted =
			this.webcamService.permissionChecked() && !this.webcamService.isPermissionDenied();

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
	constructor() {
		// Auto-select first device when devices change
		effect(
			() => {
				const devices = this.devices();
				if (devices.length > 0 && !this.selectedDevice()) {
					this.showToast(`Selecting first device ${devices[0].label}`);
					this.selectedDevice.set(devices[0]);
				}
			},
			{ allowSignalWrites: true },
		);

		// Use effects for service signals synchronization
		effect(
			() => {
				const state = this.webcamService.state();
				this.showToast(`Webcam state changed: ${state.status}`);
				this.webcamState.set(state);

				// Reset video ready state when status changes to non-ready states
				if (state.status !== "ready") {
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
				const devices = this.webcamService.devices();
				this.devices.set(devices);
			},
			{ allowSignalWrites: true },
		);

		effect(
			() => {
				const caps = this.webcamService.deviceCapability();
				if (caps && typeof caps.maxZoom === "number" && typeof caps.minZoom === "number") {
					this.minZoom.set(caps.minZoom);
					this.maxZoom.set(caps.maxZoom);
					this.zoomValue.set(caps.minZoom);
				} else {
					this.minZoom.set(null);
					this.maxZoom.set(null);
					this.zoomValue.set(null);
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

	/**
	 * Starts the camera with the current configuration.
	 * This method initializes the camera with the selected device and settings, and updates the video source.
	 */
	public async startCamera(): Promise<void> {
		const config = this.currentConfig();
		if (!config) {
			this.showToast("Configuration is invalid, please check settings");
			return;
		}

		// Start camera with configuration
		await this.webcamService.startCamera(config);

		// Check torch support and set video ready state
		setTimeout(() => {
			// Update device capabilities after camera starts
			// const caps = this.webcamService.deviceCapability();
			// this.webcamService.deviceCapability.set(caps);
		}, 100);
	}

	/**
	 * Stops the currently running camera.
	 * This method releases the camera resources and clears the video source.
	 */
	public stopCamera() {
		// Stop camera
		this.webcamService.stopCamera();
		this.showToast(`Camera stopped`);

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
			this.showToast("Cannot switch device: no device selected or camera is loading");
			return;
		}

		// Stop the current camera
		this.stopCamera();

		// Restart the camera with the new configuration
		await this.startCamera();
	}

	/**
	 * Switches the currently selected resolution.
	 * This method stops the current camera, updates the selected resolution, and restarts the camera with the new configuration.
	 * @returns A Promise that resolves when the resolution switch is complete.
	 */
	async switchResolution(): Promise<void> {
		if (!this.uiState().canSwitchResolution) {
			this.showToast("Cannot switch resolution: no resolution selected or camera is loading");
			return;
		}

		// Stop the current camera
		this.stopCamera();

		// Restart the camera with the new configuration
		await this.startCamera();
	}

	/**
	 * Captures an image from the webcam.
	 * This method triggers the capture process and updates the captured image URL.
	 * @returns A Promise that resolves when the capture is complete.
	 */
	async captureImage(): Promise<void> {
		if (!this.uiState().canCapture) {
			this.showToast("Cannot capture: no device selected or camera is loading");
			return;
		}

		try {
			const { blob } = await this.webcamService.captureImage();
			if (blob) {
				// Create a temporary object URL for preview
				const url = URL.createObjectURL(blob);
				this.capturedImageUrl.set(url);
			}
		} catch (error) {
			this.showToast(`Capture failed`);
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

	async testSelectDevice(facing: "front" | "back") {
		const deviceManagerUtils = new DeviceManagerUtils();
		const devices = await this.webcamService.getAvailableDevices();
		const selectDevice = await deviceManagerUtils.selectCamera(devices, facing);
		this.selectDeviceDetails.set(selectDevice);
	}

	/**
	 * Tests the capabilities of the currently selected device.
	 * This method stops the camera, tests the device capabilities, and restarts the camera if needed.
	 * @returns A Promise that resolves when the test is complete.
	 */
	async testDeviceCapabilities() {
		const device = this.selectedDevice();
		if (!device) {
			this.showToast(`Please select a device`);
			return;
		}

		try {
			// Stop camera if running
			if (this.uiState().isReady) {
				this.stopCamera();
			}
			// Test device capabilities via service
			await this.webcamService.testDeviceCapabilitiesByDeviceId(device.deviceId);
			// Store the result for display
			// this.deviceCapability.set(this.deviceCapability());
			// Optionally, start camera again after testing
			// await this.startCamera();
			this.showToast(`Test device capabilities success`);
		} catch (e) {
			this.showToast(`Test device capabilities failed`);
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
	onVideoPermissionChange(event: ToggleSwitchChangeEvent) {
		const checked = event.checked;
		this.updatePermissionOptions({ video: checked });
	}

	/**
	 * Handles changes in the audio permission checkbox.
	 * This method updates the permission options and triggers a permission check.
	 * @param event The event object containing the checkbox state.
	 */
	onAudioPermissionChange(event: ToggleSwitchChangeEvent) {
		const checked = event.checked;
		this.updatePermissionOptions({ audio: checked });
	}

	/**
	 * Handles changes in the device selection dropdown.
	 * This method updates the selected device and triggers an auto-switch if the camera is already running.
	 * @param device The selected MediaDeviceInfo, or null to clear the selection.
	 */
	async onDeviceChange(device: MediaDeviceInfo | null) {
		this.selectedDevice.set(device);
		// Only auto-switch if camera is already running
		if (this.uiState().isReady) {
			await this.switchDevice();
			this.showToast(`Device set to ${device?.label}`);
		}
	}

	/**
	 * Handles changes in the resolution selection dropdown.
	 * This method updates the selected resolution and triggers an auto-switch if the camera is already running.
	 * @param event The DropdownChangeEvent object containing the selected resolution.
	 */
	async onResolutionChange(event: SelectChangeEvent) {
		const selectedResolution = event.value as Resolution;
		if (selectedResolution) {
			this.selectedResolution.set(selectedResolution);
			// Only auto-switch if camera is already running
			if (this.uiState().isReady) {
				await this.switchResolution();
			}
		}

		this.showToast(`Resolution set to ${selectedResolution?.name}`);
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
			await this.startCamera();
			this.showToast(`Mirror ${checked ? "enabled" : "disabled"}`);
		} catch (e) {
			this.showToast("Failed to set mirror");
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
		try {
			await this.startCamera();
			this.showToast(`Audio ${checked ? "enabled" : "disabled"}`);
		} catch (e) {
			this.showToast("Failed to set audio");
		}
	}

	/**
	 * Handles changes in the zoom input field.
	 * This method updates the zoom level and triggers a camera restart if the camera is already running.
	 * @param event The SliderChangeEvent object containing the zoom value.
	 */
	async onZoomChange(event: SliderChangeEvent) {
		const value = event.value as number;
		if (isNaN(value) || this.zoomValue() === value) return;
		this.zoomValue.set(value);
		try {
			await this.webcamService.webcamInstance.setZoom(value);
			this.showToast(`Zoom set to ${value}`);
		} catch (e) {
			this.showToast("Failed to set zoom");
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
			this.showToast(`Focus mode set to ${value}`);
		} catch (e) {
			this.showToast("Failed to set focus mode");
		}
	}

	/**
	 * Toggles the torch state.
	 * This method checks if the device supports torch, toggles the torch state, and updates the UI accordingly.
	 */
	async toggleTorch() {
		if (!this.webcamService.webcamInstance.isTorchSupported()) {
			this.showToast("Torch is not supported on this device");
			return;
		}

		try {
			const enabled = !this.enableTorch();
			await this.webcamService.webcamInstance.setTorch(enabled);
			this.enableTorch.set(enabled);
			this.showToast(`Torch ${enabled ? "enabled" : "disabled"}`);
		} catch (error) {
			this.showToast("Failed to toggle torch");
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

	openHelpDialog() {
		this.helpDialogVisible.set(true);
	}

	closeHelpDialog() {
		this.helpDialogVisible.set(false);
	}

	showToast(message: string) {
		this.messageService.add({
			severity: "contrast",
			summary: "Info",
			detail: message,
			life: 1500,
		});
	}
}
