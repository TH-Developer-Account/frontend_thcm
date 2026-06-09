export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const OUTCOME_OPTIONS = [
	{ value: "", label: "Select outcome" },
	{ value: "SUCCESSFUL", label: "Successful" },
	{ value: "PARTIALLY_SUCCESSFUL", label: "Partially Successful" },
	{ value: "UNSUCCESSFUL", label: "Unsuccessful" },
];

export const validateImageFile = (file: File): string | null => {
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		return `"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP`;
	}
	if (file.size > MAX_IMAGE_SIZE_BYTES) {
		return `"${file.name}" exceeds the 5 MB limit`;
	}
	return null;
};

export const FILE_UPLOAD_LIMITS = {
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

export function validateUploadFile(
	file: File,
	kind: keyof typeof FILE_UPLOAD_LIMITS = "image",
): string | null {
	const config = FILE_UPLOAD_LIMITS[kind];

	if (config.mimeTypes.length > 0 && !config.mimeTypes.includes(file.type)) {
		return `"${file.name}" is not supported. Use ${config.label}.`;
	}

	if (file.size > config.maxSize) {
		return `"${file.name}" exceeds the ${config.maxSize / 1024 / 1024} MB limit.`;
	}

	return null;
}

export function getAcceptByKind(
	kind: keyof typeof FILE_UPLOAD_LIMITS = "image",
) {
	const config = FILE_UPLOAD_LIMITS[kind];

	if (config.mimeTypes.length === 0) return undefined;

	return config.mimeTypes.join(",");
}
