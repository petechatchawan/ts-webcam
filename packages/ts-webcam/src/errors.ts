// Error code enum for all webcam errors
export enum WebcamErrorCode {
	// Permissions
	PERMISSION_DENIED = "PERMISSION_DENIED",

	// Device Issues
	DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND",
	DEVICE_BUSY = "DEVICE_BUSY",
	DEVICES_ERROR = "DEVICES_ERROR",
	OVERCONSTRAINED = "OVERCONSTRAINED",

	// Configuration Issues
	INVALID_CONFIG = "INVALID_CONFIG",
	VIDEO_ELEMENT_NOT_SET = "VIDEO_ELEMENT_NOT_SET",
	INVALID_VIDEO_ELEMENT = "INVALID_VIDEO_ELEMENT",

	// Stream & Resolution Issues
	STREAM_FAILED = "STREAM_FAILED",
	RESOLUTION_NOT_SUPPORTED = "RESOLUTION_NOT_SUPPORTED",
	RESOLUTION_FAILED = "RESOLUTION_FAILED",

	// Control Issues (Zoom, Torch, Focus)
	ZOOM_NOT_SUPPORTED = "ZOOM_NOT_SUPPORTED",
	TORCH_NOT_SUPPORTED = "TORCH_NOT_SUPPORTED",
	FOCUS_NOT_SUPPORTED = "FOCUS_NOT_SUPPORTED",
	CONTROL_ERROR = "CONTROL_ERROR",

	// Capture Issues
	CAPTURE_FAILED = "CAPTURE_FAILED",
	CANVAS_ERROR = "CANVAS_ERROR",

	// General
	NOT_SUPPORTED = "NOT_SUPPORTED",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class WebcamError extends Error {
	code: WebcamErrorCode;
	constructor(message: string, code: WebcamErrorCode) {
		super(message);
		this.name = "WebcamError";
		this.code = code;
	}
}

/**
 * Map WebcamErrorCode to user-friendly message (i18n-ready)
 * @param error WebcamError
 * @param locale (optional) locale string, e.g. 'th', 'en'
 */
export function getWebcamErrorMessage(error: WebcamError, locale: string = "th"): string {
	const messages: Record<string, Record<WebcamErrorCode, string>> = {
		th: {
			[WebcamErrorCode.PERMISSION_DENIED]: "ไม่ได้รับอนุญาตให้เข้าถึงกล้องหรือไมโครโฟน",
			[WebcamErrorCode.DEVICE_NOT_FOUND]: "ไม่พบอุปกรณ์กล้อง",
			[WebcamErrorCode.DEVICE_BUSY]: "กล้องถูกใช้งานโดยแอปอื่น",
			[WebcamErrorCode.DEVICES_ERROR]: "เกิดข้อผิดพลาดกับอุปกรณ์กล้อง",
			[WebcamErrorCode.INVALID_CONFIG]: "การตั้งค่ากล้องไม่ถูกต้อง",
			[WebcamErrorCode.VIDEO_ELEMENT_NOT_SET]: "ไม่ได้ระบุ video element",
			[WebcamErrorCode.INVALID_VIDEO_ELEMENT]: "video element ไม่ถูกต้อง",
			[WebcamErrorCode.STREAM_FAILED]: "ไม่สามารถเปิดกล้องได้",
			[WebcamErrorCode.OVERCONSTRAINED]: "กล้องไม่สามารถตอบสนองความต้องการได้",
			[WebcamErrorCode.RESOLUTION_NOT_SUPPORTED]: "ความละเอียดนี้ไม่รองรับ",
			[WebcamErrorCode.RESOLUTION_FAILED]: "เปลี่ยนความละเอียดไม่สำเร็จ",
			[WebcamErrorCode.ZOOM_NOT_SUPPORTED]: "กล้องนี้ไม่รองรับการซูม",
			[WebcamErrorCode.TORCH_NOT_SUPPORTED]: "กล้องนี้ไม่รองรับแฟลช/torch",
			[WebcamErrorCode.FOCUS_NOT_SUPPORTED]: "กล้องนี้ไม่รองรับการโฟกัส",
			[WebcamErrorCode.CONTROL_ERROR]: "ควบคุมกล้องล้มเหลว",
			[WebcamErrorCode.CAPTURE_FAILED]: "จับภาพล้มเหลว",
			[WebcamErrorCode.CANVAS_ERROR]: "เกิดข้อผิดพลาดกับ canvas",
			[WebcamErrorCode.NOT_SUPPORTED]: "ฟีเจอร์นี้ไม่รองรับ",
			[WebcamErrorCode.UNKNOWN_ERROR]: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
		},
		en: {
			[WebcamErrorCode.PERMISSION_DENIED]: "Camera or microphone access denied",
			[WebcamErrorCode.DEVICE_NOT_FOUND]: "Camera device not found",
			[WebcamErrorCode.DEVICE_BUSY]: "Camera is in use by another app",
			[WebcamErrorCode.DEVICES_ERROR]: "Camera device error",
			[WebcamErrorCode.INVALID_CONFIG]: "Invalid camera configuration",
			[WebcamErrorCode.VIDEO_ELEMENT_NOT_SET]: "Video element not set",
			[WebcamErrorCode.INVALID_VIDEO_ELEMENT]: "Invalid video element",
			[WebcamErrorCode.STREAM_FAILED]: "Failed to start camera",
			[WebcamErrorCode.OVERCONSTRAINED]: "Camera constraints not satisfied",
			[WebcamErrorCode.RESOLUTION_NOT_SUPPORTED]: "Resolution not supported",
			[WebcamErrorCode.RESOLUTION_FAILED]: "Failed to change resolution",
			[WebcamErrorCode.ZOOM_NOT_SUPPORTED]: "Zoom not supported",
			[WebcamErrorCode.TORCH_NOT_SUPPORTED]: "Torch/flash not supported",
			[WebcamErrorCode.FOCUS_NOT_SUPPORTED]: "Focus not supported",
			[WebcamErrorCode.CONTROL_ERROR]: "Camera control failed",
			[WebcamErrorCode.CAPTURE_FAILED]: "Capture failed",
			[WebcamErrorCode.CANVAS_ERROR]: "Canvas error",
			[WebcamErrorCode.NOT_SUPPORTED]: "Feature not supported",
			[WebcamErrorCode.UNKNOWN_ERROR]: "Unknown error occurred",
		},
	};
	const code = error.code || WebcamErrorCode.UNKNOWN_ERROR;
	return messages[locale]?.[code] || messages["en"][code] || error.message || "Unknown error";
}
