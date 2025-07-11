import { Injectable, signal, Signal } from "@angular/core";
import {
	DeviceCapability,
	PermissionRequestOptions,
	Webcam,
	WebcamState,
	WebcamConfiguration,
} from "ts-webcam";

@Injectable({ providedIn: "root" })
export class WebcamService {
	webcam = new Webcam();
	state = signal<WebcamState>(this.webcam.getState());
	devices = signal<MediaDeviceInfo[]>([]);
	permissionChecked = signal<boolean>(false);
	deviceCapabilities = signal<DeviceCapability | null>(null);

	constructor() {}

	getState(): Signal<WebcamState> {
		return this.state.asReadonly();
	}

	getDevices(): Signal<MediaDeviceInfo[]> {
		return this.devices.asReadonly();
	}

	getPermissionChecked(): Signal<boolean> {
		return this.permissionChecked.asReadonly();
	}

	getDeviceCapabilities(): Signal<DeviceCapability | null> {
		return this.deviceCapabilities.asReadonly();
	}

	/** Type-safe getter for the underlying TsWebcam instance */
	get webcamInstance(): Webcam {
		return this.webcam;
	}

	/**
	 * Requests permissions and loads available devices
	 * @param options Permission options for video and audio access
	 * @returns Promise<void>
	 * @example
	 * // Request only camera
	 * await service.requestPermissionsAndLoadDevices({ video: true, audio: false });
	 *
	 * // Request both camera and microphone
	 * await service.requestPermissionsAndLoadDevices({ video: true, audio: true });
	 */
	async requestPermissionsAndLoadDevices(
		options: PermissionRequestOptions = { video: true, audio: false },
	) {
		try {
			const perms = await this.webcam.requestPermissions(options);
			this.permissionChecked.set(true);
			if (!this.isPermissionDenied(perms)) {
				await this.loadDevices();
			}
		} catch (e) {
			console.error("Permission request failed:", e);
			this.permissionChecked.set(false);
		}
	}

	/**
	 * Checks if camera or microphone permissions are denied
	 * @param perms Optional permissions object, uses current state if not provided
	 * @returns boolean - True if any required permission is denied or in prompt state
	 * @example
	 * if (service.isPermissionDenied()) {
	 *   console.log('Please allow camera access');
	 * }
	 */
	isPermissionDenied(perms?: Record<string, PermissionState>): boolean {
		const p = perms || this.state().permissions;
		return (
			p["camera"] === "denied" ||
			p["microphone"] === "denied" ||
			p["camera"] === "prompt" ||
			p["microphone"] === "prompt"
		);
	}

	async loadDevices() {
		try {
			const devices = await this.webcam.getVideoDevices();
			this.devices.set(devices);
			console.log("Devices:", this.devices());
		} catch (e) {
			console.error("Load devices failed:", e);
		}
	}

	async startCamera(config: WebcamConfiguration) {
		try {
			// Add callbacks to the configuration
			const configWithCallbacks: WebcamConfiguration = {
				...config,
				onStateChange: (state: WebcamState) => {
					this.state.set(state);
				},
				onStreamStart: (stream: MediaStream) => {
					console.log("Stream started:", stream);
				},
				onStreamStop: () => {
					console.log("Stream stopped");
				},
				onError: (error) => {
					console.error("Webcam error:", error);
				},
				onPermissionChange: (permissions) => {
					console.log("Permissions changed:", permissions);
					this.permissionChecked.set(true);
				},
				onDeviceChange: (devices) => {
					this.devices.set(devices);
				},
			};

			await this.webcam.startCamera(configWithCallbacks);
		} catch (e) {
			console.error("Start camera failed:", e);
		}
	}

	stopCamera() {
		this.webcam.stopCamera();
	}

	async testDeviceCapabilities(deviceId: string) {
		this.deviceCapabilities.set(null);
		try {
			const caps = await this.webcam.getDeviceCapabilities(deviceId);
			this.deviceCapabilities.set(caps);
		} catch (e) {
			console.error("Test device capabilities failed:", e);
		}
	}

	async capture(): Promise<Blob> {
		try {
			return await this.webcam.captureImage();
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : "ไม่สามารถจับภาพได้";
			console.error("Capture failed:", errorMessage);
			throw new Error(errorMessage);
		}
	}

	dispose() {
		this.webcam.dispose();
	}
}
