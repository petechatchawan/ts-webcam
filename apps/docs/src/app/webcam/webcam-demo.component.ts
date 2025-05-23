import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, TemplateRef, ViewChild } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDialog, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectChange, MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UAInfo } from "ua-info";
import { Resolution, Webcam, WebcamError } from "ts-webcam";

@Component({
	selector: "app-webcam-demo",
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		MatButtonModule,
		MatButtonToggleModule,
		MatSelectModule,
		MatCheckboxModule,
		MatDialogModule,
		MatIconModule,
		MatFormFieldModule,
		MatCardModule,
		MatDividerModule,
		MatProgressSpinnerModule,
		MatTabsModule,
		MatTooltipModule,
		MatSlideToggleModule,
	],
	templateUrl: "./webcam-demo.component.html",
	styles: [],
})
export class WebcamDemoComponent implements AfterViewInit {
	@ViewChild("preview") previewElement!: ElementRef<HTMLVideoElement>;
	@ViewChild("helpDialog") helpDialogTemplate!: TemplateRef<any>;

	public readonly webcam = new Webcam();
	public uaInfo = new UAInfo();
	public videoDevices: MediaDeviceInfo[] = [];
	public selectedDevice: MediaDeviceInfo | null = null;
	public selectedResolution: Resolution | null = null;
	public isAudioEnabled: boolean = false;
	public isMirrorEnabled: boolean = false;
	public isAutoSwapResolutionOnMobile: boolean = false;
	public isAllowFallbackResolution: boolean = false;

	// UI state properties
	public isFullscreen: boolean = false;
	public isLoading: boolean = false;
	public showCapturedImage: boolean = false;
	public capturedImage: string | null = null;

	// Dialog reference
	private dialogRef: MatDialogRef<any> | null = null;

	public resolutions: Resolution[] = [
		// PORTRAIT RESOLUTIONS
		this.webcam.createResolution("PORTRAIT-360P", 360, 640),
		this.webcam.createResolution("PORTRAIT-480P", 480, 854),
		this.webcam.createResolution("PORTRAIT-720P", 720, 1280),
		this.webcam.createResolution("PORTRAIT-1080P", 1080, 1920),
		this.webcam.createResolution("PORTRAIT-2K", 1440, 2560),
		this.webcam.createResolution("PORTRAIT-4K", 2160, 3840),

		// LANDSCAPE RESOLUTIONS
		this.webcam.createResolution("LANDSCAPE-360P", 640, 360),
		this.webcam.createResolution("LANDSCAPE-480P", 854, 480),
		this.webcam.createResolution("LANDSCAPE-720P", 1280, 720),
		this.webcam.createResolution("LANDSCAPE-1080P", 1920, 1080),
		this.webcam.createResolution("LANDSCAPE-2K", 2560, 1440),
		this.webcam.createResolution("LANDSCAPE-4K", 3840, 2160),

		// SQUARE RESOLUTIONS
		this.webcam.createResolution("SQUARE-360", 360, 360),
		this.webcam.createResolution("SQUARE-480", 480, 480),
		this.webcam.createResolution("SQUARE-720", 720, 720),
		this.webcam.createResolution("SQUARE-1080", 1080, 1080),
		this.webcam.createResolution("SQUARE-1920", 1920, 1920),
		this.webcam.createResolution("SQUARE-2K", 2048, 2048),
		this.webcam.createResolution("SQUARE-4K", 4096, 4096),
	];

	constructor(
		private dialog: MatDialog,
		private snackBar: MatSnackBar,
	) {
		this.uaInfo.setUserAgent(navigator.userAgent);
	}

	async ngAfterViewInit(): Promise<void> {
		try {
			// request camera permission
			await this.requestCameraPermission();
		} catch (error) {
			await this.showMessage("danger", "Failed to initialize camera");
		}
	}

	private async requestCameraPermission(): Promise<void> {
		const permission = await this.webcam.checkCameraPermission();
		await this.showMessage("success", "Permission status: " + permission);
		switch (permission) {
			case "granted":
				// check device capabilities
				await this.checkDeviceCapabilities();

				// initialize the webcam
				await this.initializeWebcam();
				break;
			case "prompt":
				await this.showPermissionExplanation();
				break;
			default:
				await this.showPermissionDeniedHelp();
		}
	}

	async presentAlertConfirm() {
		console.log("presentAlertConfirm");
		this.dialogRef = this.dialog.open(this.helpDialogTemplate, {
			width: "400px",
			data: {
				title: "Confirm!",
				message: "Message <strong>text</strong>!!!",
			},
		});

		this.dialogRef.afterClosed().subscribe(async (result) => {
			if (result) {
				await this.initializeWebcam();
			}
		});
	}

	private async initializeWebcam(): Promise<void> {
		console.log("Initialize Webcam...");
		this.videoDevices = await this.webcam.getVideoDevices();
		if (this.videoDevices.length === 0) {
			await this.showMessage("danger", "No cameras found. Please check your camera connection.");
			return;
		}

		this.selectedDevice = this.videoDevices[0];
		if (!this.selectedDevice) return;

		// resolutions
		const resolutionPacks: Resolution[] = [
			this.webcam.createResolution("SQUARE-4K", 4096, 4096),
			this.webcam.createResolution("SQUARE-2K", 2048, 2048),
			this.webcam.createResolution("SQUARE-1920", 1920, 1920),
			this.webcam.createResolution("SQUARE-1080", 1080, 1080),
			this.webcam.createResolution("SQUARE-720", 720, 720),
			this.webcam.createResolution("SQUARE-480", 480, 480),
			this.webcam.createResolution("SQUARE-360", 360, 360),
		];

		// setup the webcam
		this.webcam.setupConfiguration({
			enableAudio: this.isAudioEnabled,
			deviceInfo: this.selectedDevice,
			mirrorVideo: this.isMirrorEnabled,
			videoElement: this.previewElement.nativeElement,
			allowFallbackResolution: this.isAllowFallbackResolution,
			allowAutoRotateResolution: this.isAutoSwapResolutionOnMobile,
			preferredResolutions: resolutionPacks,
			debug: true, // Enable debug logging
			onStart: async () => await this.handleStart(),
			onError: async (error) => this.handleError(error),
		});

		console.log("Before start - Status:", this.webcam.getStatus());
		console.log("Before start - isActive:", this.webcam.isActive());

		// start the webcam
		await this.webcam.start();

		console.log("After start - Status:", this.webcam.getStatus());
		console.log("After start - isActive:", this.webcam.isActive());
	}

	private async checkDeviceCapabilities(): Promise<void> {
		try {
			await this.showLoading("Checking device capabilities...");
			const devices = await this.webcam.getVideoDevices();
			const capabilities = [];

			// check device capabilities
			for (const device of devices) {
				const capability = await this.webcam.getDeviceCapabilities(device.deviceId);
				capabilities.push(capability);
			}

			// check supported resolutions
			const result = this.webcam.checkSupportedResolutions(capabilities, this.resolutions);
			result.resolutions.forEach((res: any) => {
				console.log(`${res.name} (${res.width}x${res.height}): ${res.supported ? "Supported" : "Not supported"}`);
			});

			await this.showMessage("success", `Supported resolutions: ${result.resolutions.length}`);
		} finally {
			await this.dismissLoading();
		}
	}

	private async handleStart(): Promise<void> {
		console.log("handleStart called - Status:", this.webcam.getStatus());
		console.log("handleStart called - isActive:", this.webcam.isActive());

		if (await this.webcam.isVideoPreviewReady()) {
			// get the current device and resolution
			this.selectedDevice = this.webcam.getCurrentDevice();
			this.selectedResolution = this.webcam.getCurrentResolution();
			await this.showMessage(
				"success",
				`Opened camera ${this.selectedDevice?.label} with resolution ${this.selectedResolution?.id} successfully`,
			);

			// update configuration values
			const config = this.webcam.getConfiguration();
			console.log("config", config);

			this.isAudioEnabled = config?.enableAudio || false;
			this.isMirrorEnabled = config?.mirrorVideo || false;
			this.isAllowFallbackResolution = config?.allowFallbackResolution || false;
			this.isAutoSwapResolutionOnMobile = config?.allowAutoRotateResolution || false;
		} else {
			await this.showMessage("warning", "Video not ready. Please wait...");
		}
	}

	private async handleError(error: any): Promise<void> {
		const message = error?.message || "Unable to access camera";
		let errorType: "success" | "warning" | "danger" = "danger";

		// Handle specific error codes if it's a WebcamError
		if (error instanceof WebcamError) {
			switch (error.code) {
				case "PERMISSION_DENIED":
					await this.showMessage("danger", "Camera permission was denied. Please enable it in your browser settings.");
					return;

				case "DEVICE_NOT_FOUND":
					await this.showMessage("danger", "No camera device was found. Please check your camera connection.");
					return;

				case "RESOLUTION_UNSUPPORTED":
					await this.showMessage("warning", "The requested resolution is not supported by your camera.");
					return;

				case "STREAM_ERROR":
					await this.showMessage("danger", "Failed to access camera stream: " + message);
					return;

				case "NOT_INITIALIZED":
					await this.showMessage("warning", "Camera is not properly initialized.");
					return;

				case "PERMISSION_PROMPT_BLOCKED":
					await this.showMessage(
						"danger",
						"Permission prompt was blocked. Please allow camera access in your browser settings.",
					);
					return;

				case "UNKNOWN_ERROR":
				default:
					// Fall through to generic error handling
					break;
			}
		}

		// Generic error handling
		await this.showMessage(errorType, message);
	}

	public async showPermissionExplanation(): Promise<void> {
		this.dialog.open(this.helpDialogTemplate, {
			width: "400px",
			data: {
				title: "Permission Required",
				message: "Camera access permission is required to take photos.",
			},
		});
	}

	public async showPermissionDeniedHelp(): Promise<void> {
		this.dialog.open(this.helpDialogTemplate, {
			width: "400px",
			data: {
				title: "Permission Denied",
				message: "Camera access permission was denied. Please enable it in settings.",
			},
		});
	}

	public async handlePermissionDialogConfirm(): Promise<void> {
		await this.handleRequestPermission();
	}

	private async handleRequestPermission(): Promise<void> {
		if (this.webcam.needsPermissionRequest()) {
			const permissions = await this.webcam.requestPermissions();
			if (permissions.camera === "granted") {
				// initialize the camera
				await this.initializeWebcam();
			} else {
				await this.showMessage("danger", "Camera permission denied");
			}
		} else {
			await this.initializeWebcam();
		}
	}

	public async captureImage(): Promise<void> {
		try {
			const image = await this.webcam.captureImage({
				quality: 1,
				mediaType: "image/jpeg",
				scale: 1,
			});

			// Store the captured image and show it
			this.capturedImage = image;
			this.showCapturedImage = true;

			// show success message
			await this.showMessage("success", "Image captured successfully");
		} catch (error) {
			await this.showMessage("danger", "Failed to capture image");
		}
	}

	public downloadImage(): void {
		if (!this.capturedImage) return;

		// Create a temporary link element to download the image
		const link = document.createElement("a");
		link.href = this.capturedImage;
		link.download = `webcam-capture-${new Date().getTime()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	public discardImage(): void {
		this.capturedImage = null;
		this.showCapturedImage = false;
	}

	public toggleFullscreen(): void {
		const element = document.documentElement;

		if (!this.isFullscreen) {
			if (element.requestFullscreen) {
				element.requestFullscreen();
			}
			this.isFullscreen = true;
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
			this.isFullscreen = false;
		}
	}

	public openHelpDialog(): void {
		this.dialog.open(this.helpDialogTemplate, {
			width: "500px",
		});
	}

	public async setDevice(event: MatSelectChange): Promise<void> {
		const deviceId = event.value;
		const device = this.videoDevices.find((d) => d.deviceId === deviceId);

		if (device) {
			this.webcam.clearError();
			this.webcam.updateDevice(device);
		} else {
			await this.showMessage("danger", "Failed to switch camera");
		}
	}

	public async setResolution(event: MatSelectChange): Promise<void> {
		const id = event.value;
		const selectedResolution = this.resolutions.find((r) => r.id === id);

		if (selectedResolution) {
			this.webcam.clearError();
			this.webcam.updateResolution(selectedResolution);
		} else {
			await this.showMessage("danger", "Failed to change resolution");
		}
	}

	public toggleAllowFallbackResolution(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggleSetting("allowFallbackResolution");
			this.isAllowFallbackResolution = this.webcam.isFallbackResolutionAllowed() || false;
		}
	}

	public toggleMirror(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggleMirror();
			this.isMirrorEnabled = this.webcam.isMirrorEnabled() || false;
		}
	}

	public toggleAudio(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggleSetting("enableAudio");
			this.isAudioEnabled = this.webcam.isAudioEnabled() || false;
		}
	}

	public toggleAutoSwapResolutionOnMobile(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggleSetting("allowAutoRotateResolution");
			this.isAutoSwapResolutionOnMobile = this.webcam.isResolutionSwapAllowed() || false;
		}
	}

	public toggleTorch(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggleTorch();
		}
	}

	private async showMessage(type: "success" | "warning" | "danger", detail: string): Promise<void> {
		const panelClass = type === "success" ? "green-snackbar" : type === "warning" ? "orange-snackbar" : "red-snackbar";

		this.snackBar.open(detail, "Close", {
			duration: 3000,
			horizontalPosition: "center",
			verticalPosition: "top",
			panelClass: [panelClass],
		});
	}

	async showLoading(_message: string) {
		this.isLoading = true;
		// No need for a separate loading controller with Angular Material
		// We'll use the isLoading property with mat-spinner in the template
	}

	async dismissLoading() {
		this.isLoading = false;
	}
}
