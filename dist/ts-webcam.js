"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webcam = void 0;
class Webcam {
    constructor() {
        this.config = null;
        this.stream = null;
        this.defaultConfig = {
            audio: false,
            device: "",
            resolutions: [
                { name: "HD", width: 1280, height: 720, aspectRatio: 16 / 9 },
                { name: "VGA", width: 640, height: 480, aspectRatio: 4 / 3 },
            ],
            allowAnyResolution: false,
            mirror: false,
            autoRotation: true,
            previewElement: undefined,
            onStart: () => { },
            onError: () => { },
        };
        // ไม่ต้องรับ config ในตอนสร้าง instance
    }
    /**
     * ตั้งค่าการทำงานของ webcam
     * @param config การตั้งค่าต่างๆ
     */
    setupConfiguration(config) {
        if (!config.device) {
            throw new Error("Device ID is required");
        }
        if (!config.resolutions || config.resolutions.length === 0) {
            throw new Error("At least one resolution must be specified");
        }
        this.config = Object.assign(Object.assign({}, this.defaultConfig), config);
    }
    /**
     * ตรวจสอบว่าได้ตั้งค่าแล้วหรือยัง
     */
    checkConfiguration() {
        if (!this.config) {
            throw new Error("Please call setupConfiguration() before using webcam");
        }
    }
    /**
     * ตรวจสอบสถานะการอนุญาตใช้งานกล้อง
     * @returns Promise<PermissionState> สถานะการอนุญาต ('granted', 'denied', 'prompt')
     */
    checkCameraPermission() {
        return __awaiter(this, void 0, void 0, function* () {
            let tempStream = null;
            try {
                tempStream = yield navigator.mediaDevices.getUserMedia({ video: true });
                return "granted";
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === "NotAllowedError" ||
                        error.name === "PermissionDeniedError") {
                        return "denied";
                    }
                }
                return "prompt";
            }
            finally {
                if (tempStream) {
                    tempStream.getTracks().forEach((track) => track.stop());
                }
            }
        });
    }
    /**
     * ตรวจสอบสถานะการอนุญาตใช้งานไมโครโฟน
     * @returns Promise<PermissionState> สถานะการอนุญาต ('granted', 'denied', 'prompt')
     */
    checkMicrophonePermission() {
        return __awaiter(this, void 0, void 0, function* () {
            let tempStream = null;
            try {
                tempStream = yield navigator.mediaDevices.getUserMedia({ audio: true });
                return "granted";
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.name === "NotAllowedError" ||
                        error.name === "PermissionDeniedError") {
                        return "denied";
                    }
                }
                return "prompt";
            }
            finally {
                if (tempStream) {
                    tempStream.getTracks().forEach((track) => track.stop());
                }
            }
        });
    }
    /**
     * ขอสิทธิ์การใช้งานกล้องและไมโครโฟน
     * @returns Promise<{camera: PermissionState, microphone: PermissionState}> สถานะการอนุญาตของทั้งกล้องและไมโครโฟน
     */
    requestPermissions() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const permissions = {
                camera: yield this.checkCameraPermission(),
                microphone: ((_a = this.config) === null || _a === void 0 ? void 0 : _a.audio)
                    ? yield this.checkMicrophonePermission()
                    : "prompt",
            };
            return permissions;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkConfiguration();
            try {
                // ตรวจสอบสิทธิ์ก่อน
                const permissions = yield this.requestPermissions();
                if (permissions.camera === "denied") {
                    throw new Error("Camera permission denied");
                }
                if (this.config.audio && permissions.microphone === "denied") {
                    throw new Error("Microphone permission denied");
                }
                // ลองเปิดกล้องด้วยความละเอียดที่กำหนดตามลำดับ
                for (const resolution of this.config.resolutions) {
                    try {
                        console.log(`Attempting to open camera with resolution: ${resolution.name} (${resolution.width}x${resolution.height})`);
                        const constraints = this.buildConstraints(resolution);
                        this.stream = yield navigator.mediaDevices.getUserMedia(constraints);
                        // หากเปิดสำเร็จ ตั้งค่า preview element
                        if (this.config.previewElement) {
                            this.config.previewElement.srcObject = this.stream;
                            this.config.previewElement.style.transform = this.config.mirror
                                ? "scaleX(-1)"
                                : "none";
                            yield this.config.previewElement.play();
                        }
                        console.log(`Successfully opened camera with resolution: ${resolution.name}`);
                        this.config.onStart();
                        return;
                    }
                    catch (error) {
                        console.log(`Failed to open camera with resolution: ${resolution.name}. Error:`, error);
                        // หากเปิดไม่สำเร็จ ลองความละเอียดถัดไป
                        continue;
                    }
                }
                // หากไม่สามารถเปิดด้วยความละเอียดที่กำหนดได้ทั้งหมด
                if (this.config.allowAnyResolution) {
                    console.log("Attempting to open camera with any supported resolution");
                    try {
                        const constraints = {
                            video: {
                                deviceId: { exact: this.config.device },
                            },
                            audio: this.config.audio,
                        };
                        this.stream = yield navigator.mediaDevices.getUserMedia(constraints);
                        // ดึงความละเอียดที่ได้
                        const videoTrack = this.stream.getVideoTracks()[0];
                        const settings = videoTrack.getSettings();
                        console.log(`Opened camera with resolution: ${settings.width}x${settings.height}`);
                        if (this.config.previewElement) {
                            this.config.previewElement.srcObject = this.stream;
                            this.config.previewElement.style.transform = this.config.mirror
                                ? "scaleX(-1)"
                                : "none";
                            yield this.config.previewElement.play();
                        }
                        this.config.onStart();
                    }
                    catch (error) {
                        console.error("Failed to open camera with any resolution:", error);
                        throw new Error("Unable to open camera with any resolution");
                    }
                }
                else {
                    throw new Error(`Unable to open camera with specified resolutions: ${this.config.resolutions.map((r) => `${r.name} (${r.width}x${r.height})`).join(", ")}`);
                }
            }
            catch (error) {
                this.config.onError(error);
                throw error;
            }
        });
    }
    stop() {
        this.checkConfiguration();
        if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
        }
        if (this.config.previewElement) {
            this.config.previewElement.srcObject = null;
        }
    }
    isActive() {
        return this.stream !== null && this.stream.active;
    }
    getCurrentResolution() {
        this.checkConfiguration();
        if (!this.stream)
            return null;
        const videoTrack = this.stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        return {
            name: "Current",
            width: this.config.autoRotation
                ? settings.height || 0
                : settings.width || 0,
            height: this.config.autoRotation
                ? settings.width || 0
                : settings.height || 0,
            aspectRatio: settings.aspectRatio,
        };
    }
    updateConfig(newConfig) {
        this.checkConfiguration();
        const wasActive = this.isActive();
        if (wasActive) {
            this.stop();
        }
        this.config = Object.assign(Object.assign({}, this.config), newConfig);
        if (wasActive) {
            this.start().catch(this.config.onError);
        }
    }
    buildConstraints(resolution) {
        const videoConstraints = {
            deviceId: { exact: this.config.device },
        };
        if (this.config.autoRotation) {
            videoConstraints.width = { exact: resolution.height };
            videoConstraints.height = { exact: resolution.width };
        }
        else {
            videoConstraints.width = { exact: resolution.width };
            videoConstraints.height = { exact: resolution.height };
        }
        if (resolution.aspectRatio) {
            videoConstraints.aspectRatio = { exact: resolution.aspectRatio };
        }
        return {
            video: videoConstraints,
            audio: this.config.audio,
        };
    }
    handleDeviceOrientation() {
        if (!this.config.previewElement)
            return;
        window.addEventListener("orientationchange", () => {
            const orientation = window.orientation;
            let rotation = "rotate(0deg)";
            if (orientation === 90)
                rotation = "rotate(-90deg)";
            else if (orientation === -90)
                rotation = "rotate(90deg)";
            else if (orientation === 180)
                rotation = "rotate(180deg)";
            this.config.previewElement.style.transform = `${rotation}${this.config.mirror ? " scaleX(-1)" : ""}`;
        });
    }
}
exports.Webcam = Webcam;
