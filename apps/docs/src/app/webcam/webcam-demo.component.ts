import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Resolution, Webcam, WebcamError } from '@repo/webcam';
import { UAInfo } from 'ua-info';

@Component({
  selector: 'app-webcam-demo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './webcam-demo.component.html',
  styles: []
})
export class WebcamDemoComponent implements AfterViewInit {
  @ViewChild('preview') previewElement!: ElementRef<HTMLVideoElement>;

  public readonly webcam = new Webcam();
  public uaInfo = new UAInfo();
  public videoDevices: MediaDeviceInfo[] = [];
  public selectedDevice: MediaDeviceInfo | null = null;
  public selectedResolution: Resolution | null = null;
  public isAudioEnabled: boolean = false;
  public isMirrorEnabled: boolean = false;
  public isAllowSwapResolution: boolean = false;
  public isAllowAnyResolution: boolean = false;

  public resolutions: Resolution[] = [
    // PORTRAIT RESOLUTIONS
    this.webcam.createResolution('PORTRAIT-360P', 360, 640),
    this.webcam.createResolution('PORTRAIT-480P', 480, 854),
    this.webcam.createResolution('PORTRAIT-720P', 720, 1280),
    this.webcam.createResolution('PORTRAIT-1080P', 1080, 1920),
    this.webcam.createResolution('PORTRAIT-2K', 1440, 2560),
    this.webcam.createResolution('PORTRAIT-4K', 2160, 3840),

    // LANDSCAPE RESOLUTIONS
    this.webcam.createResolution('LANDSCAPE-360P', 640, 360),
    this.webcam.createResolution('LANDSCAPE-480P', 854, 480),
    this.webcam.createResolution('LANDSCAPE-720P', 1280, 720),
    this.webcam.createResolution('LANDSCAPE-1080P', 1920, 1080),
    this.webcam.createResolution('LANDSCAPE-2K', 2560, 1440),
    this.webcam.createResolution('LANDSCAPE-4K', 3840, 2160),

    // SQUARE RESOLUTIONS
    this.webcam.createResolution('SQUARE-360', 360, 360),
    this.webcam.createResolution('SQUARE-480', 480, 480),
    this.webcam.createResolution('SQUARE-720', 720, 720),
    this.webcam.createResolution('SQUARE-1080', 1080, 1080),
    this.webcam.createResolution('SQUARE-1920', 1920, 1920),
    this.webcam.createResolution('SQUARE-2K', 2048, 2048),
    this.webcam.createResolution('SQUARE-4K', 4096, 4096)
  ];

  constructor() {
    this.uaInfo.setUserAgent(navigator.userAgent);
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      // request camera permission
      await this.requestCameraPermission();
    } catch (error) {
      await this.showMessage('danger', 'Failed to initialize camera');
    }
  }

  private async requestCameraPermission(): Promise<void> {
    const state = await this.webcam.checkCameraPermission();
    await this.showMessage('success', 'Permission state: ' + state);

    switch (state) {
      case 'granted':
        // check device capabilities
        await this.checkDeviceCapabilities();

        // initialize the webcam
        await this.initializeWebcam();
        break;
      case 'prompt':
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
    console.log('Initialize Webcam...');
    this.videoDevices = await this.webcam.getVideoDevices();
    if (this.videoDevices.length === 0) {
      await this.showMessage('danger', 'No cameras found. Please check your camera connection.');
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
        this.webcam.createResolution('SQUARE-4K', 4096, 4096),
        this.webcam.createResolution('SQUARE-2K', 2048, 2048),
        this.webcam.createResolution('SQUARE-1920', 1920, 1920),
        this.webcam.createResolution('SQUARE-1080', 1080, 1080),
        this.webcam.createResolution('SQUARE-720', 720, 720),
        this.webcam.createResolution('SQUARE-480', 480, 480),
        this.webcam.createResolution('SQUARE-360', 360, 360)
      ],
      onStart: async () => await this.handleOnStart(),
      onError: async (error) => this.handleOnError(error)
    });

    // start the webcam
    await this.webcam.start();
  }

  private async checkDeviceCapabilities(): Promise<void> {
    try {
      await this.showLoading('Checking device capabilities...');
      const devices = await this.webcam.getVideoDevices();
      const capabilities = [];

      // check device capabilities
      for (const device of devices) {
        const capability = await this.webcam.checkDevicesCapabilitiesData(device.deviceId);
        capabilities.push(capability);
      }

      // check supported resolutions
      const result = this.webcam.checkSupportedResolutions(capabilities, this.resolutions);

      result.resolutions.forEach((res: any) => {
        console.log(
          `${res.name} (${res.width}x${res.height}): ${
            res.supported ? 'Supported' : 'Not supported'
          }`
        );
      });

      await this.showMessage('success', `Supported resolutions: ${result.resolutions.length}`);
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
        'success',
        `Opened camera ${this.selectedDevice?.label} with resolution ${this.selectedResolution?.id} successfully`
      );

      // update the allowAnyResolution and mirror
      const config = this.webcam.getConfiguration();
      console.log('config', config);

      this.isAudioEnabled = config?.audioEnabled || false;
      this.isMirrorEnabled = config?.mirrorEnabled || false;
      this.isAllowAnyResolution = config?.allowAnyResolution || false;
      this.isAllowSwapResolution = config?.allowResolutionSwap || false;
    } else {
      await this.showMessage('warning', 'Video not ready. Please wait...');
    }
  }

  private async handleOnError(error: WebcamError): Promise<void> {
    const message = error?.message || 'Unable to access camera';
    await this.showMessage('danger', message);
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
      if (permissions.camera === 'granted') {
        // initialize the camera
        await this.initializeWebcam();
      } else {
        await this.showMessage('danger', 'Camera permission denied');
      }
    } else {
      await this.initializeWebcam();
    }
  }

  public async captureImage(): Promise<void> {
    const image = await this.webcam.captureImage({
      quality: 0.9,
      mediaType: 'image/jpeg',
      scale: 0.5
    });

    // show the image
    await this.showMessage('success', `Image captured: ${image.slice(-10)}`);
  }

  public async setDevice(device: any): Promise<void> {
    if (device) {
      this.webcam.clearError();
      this.webcam.updateDevice(device);
    } else {
      await this.showMessage('danger', 'Failed to switch camera');
    }
  }

  public async setResolution(id: any): Promise<void> {
    const selectedResolution = this.resolutions.find((r) => r.id === id);
    if (selectedResolution) {
      this.webcam.clearError();
      this.webcam.updateResolution(selectedResolution);
    } else {
      await this.showMessage('danger', 'Failed to change resolution');
    }
  }

  public toggleAllowAnyResolution(): void {
    if (this.webcam.isActive()) {
      this.webcam.toggle('allowAnyResolution');
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
      this.webcam.toggle('audioEnabled');
      this.isAudioEnabled = this.webcam.isAudioEnabled() || false;
    }
  }

  public toggleAllowSwapResolution(): void {
    if (this.webcam.isActive()) {
      this.webcam.toggle('allowResolutionSwap');
      this.isAllowSwapResolution = this.webcam.isResolutionSwapAllowed() || false;
    }
  }

  public toggleTorch(): void {
    if (this.webcam.isActive()) {
      this.webcam.toggleTorch();
    }
  }

  private async showMessage(type: 'success' | 'warning' | 'danger', detail: string): Promise<void> {
    // const toast = await this.toastController.create({
    //   message: detail,
    //   duration: 1500,
    //   position: 'top',
    //   color: type
    // });
    // await toast.present();
  }

  async showLoading(message: string) {
    // const loading = await this.loadingController.create({
    //   message: message,
    //   duration: 2000,
    //   spinner: 'circular'
    // });
    // await loading.present();
  }
}
