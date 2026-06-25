export const MAX_IMAGES = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_MIME_TYPES: readonly string[] = [
	"image/jpeg",
	"image/png",
	"image/webp",
];

export const OUTCOME_OPTIONS = [
	{ value: "", label: "Select outcome" },
	{ value: "SUCCESSFUL", label: "Successful" },
	{
		value: "PARTIALLY_SUCCESSFUL",
		label: "Partially Successful",
	},
	{ value: "UNSUCCESSFUL", label: "Unsuccessful" },
] as const;

export const validateImageFile = (file: File): string | null => {
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		return `"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP.`;
	}

	if (file.size > MAX_IMAGE_SIZE_BYTES) {
		return `"${file.name}" exceeds the 5 MB limit.`;
	}

	return null;
};

export type FileUploadKind = "image" | "pdf" | "document" | "any";

type FileValidationConfig = {
	maxSize: number;
	mimeTypes: readonly string[];
	label: string;
};

export const FILE_UPLOAD_LIMITS: Record<FileUploadKind, FileValidationConfig> =
	{
		image: {
			maxSize: MAX_IMAGE_SIZE_BYTES,
			mimeTypes: ALLOWED_MIME_TYPES,
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

const formatFileSizeLimit = (bytes: number): string => {
	const megabytes = bytes / 1024 / 1024;

	return Number.isInteger(megabytes)
		? `${megabytes} MB`
		: `${megabytes.toFixed(1)} MB`;
};

export function validateUploadFile(
	file: File,
	kind: FileUploadKind = "image",
): string | null {
	const config = FILE_UPLOAD_LIMITS[kind];

	if (config.mimeTypes.length > 0 && !config.mimeTypes.includes(file.type)) {
		return `"${file.name}" is not supported. Use ${config.label}.`;
	}

	if (file.size > config.maxSize) {
		return `"${file.name}" exceeds the ${formatFileSizeLimit(
			config.maxSize,
		)} limit.`;
	}

	return null;
}

export function getAcceptByKind(
	kind: FileUploadKind = "image",
): string | undefined {
	const config = FILE_UPLOAD_LIMITS[kind];

	if (config.mimeTypes.length === 0) {
		return undefined;
	}

	return config.mimeTypes.join(",");
}
