import { FILE_UPLOAD_LIMITS } from "./fileUpload.constants";

import type {
	FileUploadError,
	FileUploadKind,
	FileUploadValue,
	RemoteFileUploadValue,
} from "./fileUpload.types";

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
	pdf: "application/pdf",

	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	png: "image/png",
	webp: "image/webp",

	doc: "application/msword",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

	xls: "application/vnd.ms-excel",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	csv: "text/csv",
};

export function getFileExtension(fileName: string): string {
	const normalizedFileName = fileName.split(/[?#]/)[0];
	const lastDotIndex = normalizedFileName.lastIndexOf(".");

	if (lastDotIndex < 0) {
		return "";
	}

	return normalizedFileName.slice(lastDotIndex + 1).toLowerCase();
}

export function getMimeTypeFromFileName(fileName: string): string {
	return MIME_TYPES_BY_EXTENSION[getFileExtension(fileName)] ?? "";
}

export function getFileNameFromUrl(fileUrl: string, fallback = "file"): string {
	try {
		const pathname = new URL(fileUrl).pathname;
		const fileName = pathname.split("/").pop();

		return fileName ? decodeURIComponent(fileName) : fallback;
	} catch {
		const normalizedUrl = fileUrl.split(/[?#]/)[0];
		const fileName = normalizedUrl.split("/").pop();

		return fileName ? decodeURIComponent(fileName) : fallback;
	}
}

export function formatFileSize(bytes?: number | null): string {
	if (!bytes) {
		return "";
	}

	const kb = bytes / 1024;
	const mb = kb / 1024;

	if (mb >= 1) {
		return `${mb.toFixed(2)} MB`;
	}

	return `${kb.toFixed(1)} KB`;
}

export function getAcceptByKind(
	kind: FileUploadKind = "image",
): string | undefined {
	const config = FILE_UPLOAD_LIMITS[kind];

	const acceptValues = [
		...config.mimeTypes,
		...(config.extensions ?? []).map((extension) => `.${extension}`),
	];

	return acceptValues.length ? [...new Set(acceptValues)].join(",") : undefined;
}

export function createFileUploadValue(file: File): FileUploadValue {
	return {
		id: crypto.randomUUID(),
		file,
		url: URL.createObjectURL(file),
		name: file.name,
		type: file.type || getMimeTypeFromFileName(file.name),
		size: file.size,
		extension: getFileExtension(file.name),
		sizeLabel: formatFileSize(file.size),
		isLocal: true,
		caption: "",
	};
}

type CreateRemoteFileUploadValueParams = {
	id?: string;
	url: string;
	name?: string;
	type?: string;
	size?: number | null;
	caption?: string | null;
	fallbackName?: string;
};

export function createRemoteFileUploadValue({
	id,
	url,
	name,
	type,
	size,
	caption,
	fallbackName = "file",
}: CreateRemoteFileUploadValueParams): RemoteFileUploadValue {
	const resolvedName = name?.trim() || getFileNameFromUrl(url, fallbackName);
	const resolvedSize = size ?? 0;

	return {
		id,
		file: null,
		url,
		name: resolvedName,
		type: type || getMimeTypeFromFileName(resolvedName),
		size: resolvedSize,
		extension: getFileExtension(resolvedName),
		sizeLabel: formatFileSize(resolvedSize),
		isLocal: false,
		caption: caption ?? "",
	};
}

export function revokeFilePreview(value?: FileUploadValue | null): void {
	if (value?.isLocal && value.url) {
		URL.revokeObjectURL(value.url);
	}
}

export function isImageUpload(value: FileUploadValue): boolean {
	return (
		value.type.startsWith("image/") ||
		/\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i.test(value.name) ||
		/\.(jpg|jpeg|png|webp)(?:[?#].*)?$/i.test(value.url)
	);
}

export function isPdfUpload(value: FileUploadValue): boolean {
	return (
		value.type === "application/pdf" ||
		/\.pdf(?:[?#].*)?$/i.test(value.name) ||
		/\.pdf(?:[?#].*)?$/i.test(value.url)
	);
}

export function validateUploadFile(
	file: File,
	kind: FileUploadKind = "image",
): FileUploadError {
	const config = FILE_UPLOAD_LIMITS[kind];
	const extension = getFileExtension(file.name);

	const hasMimeRestrictions = config.mimeTypes.length > 0;
	const hasExtensionRestrictions = Boolean(config.extensions?.length);

	const validMimeType =
		!hasMimeRestrictions || config.mimeTypes.includes(file.type);

	const validExtension =
		!hasExtensionRestrictions ||
		Boolean(config.extensions?.includes(extension));

	// Some browsers provide an empty MIME type, so extension is also checked.
	if (!validMimeType && !validExtension) {
		return `"${file.name}" is not supported. Use ${config.label}.`;
	}

	if (file.size > config.maxSize) {
		return `"${file.name}" exceeds the ${formatFileSize(
			config.maxSize,
		)} limit.`;
	}

	return null;
}
