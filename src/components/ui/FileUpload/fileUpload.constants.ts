import type { FileUploadKind } from "./fileUpload.types";

export const FILE_UPLOAD_LIMITS: Record<
	FileUploadKind,
	{
		maxSize: number;
		mimeTypes: string[];
		extensions?: string[];
		label: string;
	}
> = {
	image: {
		maxSize: 5 * 1024 * 1024,
		mimeTypes: ["image/jpeg", "image/png", "image/webp"],
		extensions: ["jpg", "jpeg", "png", "webp"],
		label: "JPEG, PNG, or WebP",
	},

	pdf: {
		maxSize: 10 * 1024 * 1024,
		mimeTypes: ["application/pdf"],
		extensions: ["pdf"],
		label: "PDF",
	},

	document: {
		maxSize: 10 * 1024 * 1024,
		mimeTypes: [
			"application/pdf",
			"image/jpeg",
			"image/png",
			"image/webp",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		],
		extensions: ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"],
		label: "PDF, image, DOC, or DOCX",
	},

	spreadsheet: {
		maxSize: 10 * 1024 * 1024,
		mimeTypes: [
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			"application/vnd.ms-excel",
			"text/csv",
			"application/csv",
		],
		extensions: ["xlsx", "xls", "csv"],
		label: "XLSX, XLS, or CSV",
	},

	any: {
		maxSize: 10 * 1024 * 1024,
		mimeTypes: [],
		extensions: [],
		label: "file",
	},
	vendorDocument: {
		maxSize: 5 * 1024 * 1024,
		mimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
		extensions: ["pdf", "jpg", "jpeg", "png", "webp"],
		label: "PDF, JPG, JPEG, PNG, or WEBP files",
	},
};
