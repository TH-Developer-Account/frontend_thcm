import type { FileUploadKind } from "./fileUpload.types";

export const FILE_UPLOAD_LIMITS: Record<
	FileUploadKind,
	{
		maxSize: number;
		mimeTypes: string[];
		label: string;
	}
> = {
	image: {
		maxSize: 5 * 1024 * 1024,
		mimeTypes: ["image/jpeg", "image/png", "image/webp"],
		label: "JPEG, PNG, or WebP",
	},
	pdf: {
		maxSize: 10 * 1024 * 1024,
		mimeTypes: ["application/pdf"],
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
		label: "PDF, image, DOC, or DOCX",
	},
	any: {
		maxSize: 10 * 1024 * 1024,
		mimeTypes: [],
		label: "file",
	},
};
