import { CommonModule } from "@angular/common";
import {
	AfterViewInit,
	Component,
	ElementRef,
	TemplateRef,
	ViewChild,
} from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule } from "@angular/material/checkbox";
import {
	MatDialog,
	MatDialogModule,
	MatDialogRef,
} from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";
import { Resolution, Webcam, WebcamError } from "@repo/webcam";
import { UAInfo } from "ua-info";

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
	public isAllowSwapResolution: boolean = false;
	public isAllowAnyResolution: boolean = false;

	// New properties for improved UX
	public capturedImage: SafeUrl | null = null;
	public showCapturedImage: boolean = false;
	public activeTab: number = 0;
	public isFullscreen: boolean = false;
	public isLoading: boolean = false;
	public helpDialogRef: MatDialogRef<any> | null = null;

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
		private snackBar: MatSnackBar,
		private dialog: MatDialog,
		private sanitizer: DomSanitizer,
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
		const state = await this.webcam.checkCameraPermission();
		await this.showMessage("success", "Permission state: " + state);

		switch (state) {
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
		// console.log('presentAlertConfirm');
		// const alert = await this.alertController.create({
		//   header: 'Confirm!',
		//   message: 'Message <strong>text</strong>!!!',
		//   buttons: [
		//     {
		//       text: 'Cancel',
		//       role: 'cancel',
		//       cssClass: 'secondary',
		//       handler: () => {
		//         console.log('Confirm Cancel: blah');
		//       }
		//     },
		//     {
		//       text: 'Okay',
		//       handler: async () => {
		//         await this.initializeWebcam();
		//       }
		//     }
		//   ]
		// });
		// console.log('alert', alert);
		// await alert.present();
	}

	private async initializeWebcam(): Promise<void> {
		console.log("Initialize Webcam...");
		this.videoDevices = await this.webcam.getVideoDevices();
		if (this.videoDevices.length === 0) {
			await this.showMessage(
				"danger",
				"No cameras found. Please check your camera connection.",
			);
			return;
		}

		this.selectedDevice = this.videoDevices[0];
		if (!this.selectedDevice) return;

		// setup the webcam
		this.webcam.setupConfiguration({
			audioEnabled: this.isAudioEnabled,
			device: this.selectedDevice,
			mirrorEnabled: this.isMirrorEnabled,
			previewElement: this.previewElement.nativeElement,
			allowAnyResolution: this.isAllowAnyResolution,
			resolution: [
				this.webcam.createResolution("SQUARE-4K", 4096, 4096),
				this.webcam.createResolution("SQUARE-2K", 2048, 2048),
				this.webcam.createResolution("SQUARE-1920", 1920, 1920),
				this.webcam.createResolution("SQUARE-1080", 1080, 1080),
				this.webcam.createResolution("SQUARE-720", 720, 720),
				this.webcam.createResolution("SQUARE-480", 480, 480),
				this.webcam.createResolution("SQUARE-360", 360, 360),
			],
			onStart: async () => await this.handleOnStart(),
			onError: async (error) => this.handleOnError(error),
		});

		// start the webcam
		await this.webcam.start();
	}

	private async checkDeviceCapabilities(): Promise<void> {
		try {
			await this.showLoading("Checking device capabilities...");
			const devices = await this.webcam.getVideoDevices();
			const capabilities = [];

			// check device capabilities
			for (const device of devices) {
				const capability = await this.webcam.checkDevicesCapabilitiesData(
					device.deviceId,
				);
				capabilities.push(capability);
			}

			// check supported resolutions
			const result = this.webcam.checkSupportedResolutions(
				capabilities,
				this.resolutions,
			);

			result.resolutions.forEach((res: any) => {
				console.log(
					`${res.name} (${res.width}x${res.height}): ${
						res.supported ? "Supported" : "Not supported"
					}`,
				);
			});

			await this.showMessage(
				"success",
				`Supported resolutions: ${result.resolutions.length}`,
			);
		} finally {
			// await this.dismissLoading();
		}
	}

	private async handleOnStart(): Promise<void> {
		if (await this.webcam.previewIsReady()) {
			// get the current device and resolution
			this.selectedDevice = this.webcam.getCurrentDevice();
			this.selectedResolution = this.webcam.getCurrentResolution();
			await this.showMessage(
				"success",
				`Opened camera ${this.selectedDevice?.label} with resolution ${this.selectedResolution?.id} successfully`,
			);

			// update the allowAnyResolution and mirror
			const config = this.webcam.getConfiguration();
			console.log("config", config);

			this.isAudioEnabled = config?.audioEnabled || false;
			this.isMirrorEnabled = config?.mirrorEnabled || false;
			this.isAllowAnyResolution = config?.allowAnyResolution || false;
			this.isAllowSwapResolution = config?.allowResolutionSwap || false;
		} else {
			await this.showMessage("warning", "Video not ready. Please wait...");
		}
	}

	private async handleOnError(error: WebcamError): Promise<void> {
		const message = error?.message || "Unable to access camera";
		await this.showMessage("danger", message);
	}

	public async showPermissionExplanation(): Promise<void> {
		// const alert = await this.alertController.create({
		//   header: 'Permission Required',
		//   message: 'Camera access permission is required to take photos.',
		//   buttons: ['OK']
		// });
		// await alert.present();
	}

	public async showPermissionDeniedHelp(): Promise<void> {
		// const alert = await this.alertController.create({
		//   header: 'Permission Denied',
		//   message: 'Camera access permission was denied. Please enable it in settings.',
		//   buttons: ['OK']
		// });
		// await alert.present();
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
			this.isLoading = true;
			const image = await this.webcam.captureImage({
				quality: 0.9,
				mediaType: "image/jpeg",
				scale: 0.5,
			});

			// Convert base64 image to SafeUrl for display
			this.capturedImage = this.sanitizer.bypassSecurityTrustUrl(image);
			this.showCapturedImage = true;

			await this.showMessage("success", "Image captured successfully");
		} catch (error) {
			await this.showMessage("danger", "Failed to capture image");
			console.error("Capture error:", error);
		} finally {
			this.isLoading = false;
		}
	}

	// Method to download the captured image
	public downloadImage(): void {
		if (!this.capturedImage) {
			this.showMessage("warning", "No image to download");
			return;
		}

		// Create a temporary link element to trigger download
		const link = document.createElement("a");
		link.href = this.capturedImage.toString();
		link.download = `webcam-capture-${new Date().toISOString()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		this.showMessage("success", "Image downloaded");
	}

	// Method to discard the captured image
	public discardImage(): void {
		this.capturedImage = null;
		this.showCapturedImage = false;
	}

	// Method to toggle fullscreen mode
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

	// Method to open help dialog
	public openHelpDialog(): void {
		this.helpDialogRef = this.dialog.open(this.helpDialogTemplate, {
			width: "500px",
			maxHeight: "80vh",
		});
	}

	public async setDevice(event: any): Promise<void> {
		const deviceId = event.value;
		const device = this.videoDevices.find((d) => d.deviceId === deviceId);

		if (device) {
			this.webcam.clearError();
			this.webcam.updateDevice(device);
			this.selectedDevice = device;
		} else {
			await this.showMessage("danger", "Failed to switch camera");
		}
	}

	public async setResolution(event: any): Promise<void> {
		const id = event.value;
		const selectedResolution = this.resolutions.find((r) => r.id === id);
		if (selectedResolution) {
			this.webcam.clearError();
			this.webcam.updateResolution(selectedResolution);
		} else {
			await this.showMessage("danger", "Failed to change resolution");
		}
	}

	public toggleAllowAnyResolution(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggle("allowAnyResolution");
			this.isAllowAnyResolution = this.webcam.isAnyResolutionAllowed() || false;
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
			this.webcam.toggle("audioEnabled");
			this.isAudioEnabled = this.webcam.isAudioEnabled() || false;
		}
	}

	public toggleAllowSwapResolution(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggle("allowResolutionSwap");
			this.isAllowSwapResolution =
				this.webcam.isResolutionSwapAllowed() || false;
		}
	}

	public toggleTorch(): void {
		if (this.webcam.isActive()) {
			this.webcam.toggleTorch();
		}
	}

	private async showMessage(
		type: "success" | "warning" | "danger",
		detail: string,
	): Promise<void> {
		console.log(`[${type.toUpperCase()}] ${detail}`);

		const panelClass =
			type === "success"
				? ["mat-snack-bar-success"]
				: type === "warning"
					? ["mat-snack-bar-warning"]
					: ["mat-snack-bar-danger"];

		this.snackBar.open(detail, "Close", {
			duration: 3000,
			panelClass,
		});
	}

	async showLoading(message: string) {
		console.log(`[LOADING] ${message}`);
		this.snackBar.open(message, "", {
			duration: 2000,
		});
	}
}
