import { FILE_UPLOAD_LIMITS } from "./fileUpload.constants";
import type {
	FileUploadError,
	FileUploadKind,
	FileUploadValue,
	RemoteFileUploadValue,
} from "./fileUpload.types";

export function getFileExtension(fileName: string): string {
	const parts = fileName.split(".");
	return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? "") : "";
}

export function formatFileSize(bytes: number): string {
	if (!bytes) return "0 KB";

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

	if (!config.mimeTypes.length) return undefined;

	return config.mimeTypes.join(",");
}

export function validateUploadFile(
	file: File,
	kind: FileUploadKind = "image",
): FileUploadError {
	const config = FILE_UPLOAD_LIMITS[kind];

	if (config.mimeTypes.length > 0 && !config.mimeTypes.includes(file.type)) {
		return `"${file.name}" is not supported. Use ${config.label}.`;
	}

	if (file.size > config.maxSize) {
		return `"${file.name}" exceeds the ${formatFileSize(config.maxSize)} limit.`;
	}

	return null;
}

export function createFileUploadValue(file: File): FileUploadValue {
	const url = URL.createObjectURL(file);

	return {
		id: crypto.randomUUID(),
		file,
		url,
		name: file.name,
		type: file.type,
		size: file.size,
		extension: getFileExtension(file.name),
		sizeLabel: formatFileSize(file.size),
		isLocal: true,
	};
}

export function createRemoteFileUploadValue(params: {
	id: string;
	url: string;
	name: string;
	type?: string;
	size?: number;
}): RemoteFileUploadValue {
	return {
		id: params.id,
		file: null,
		url: params.url,
		name: params.name,
		type: params.type ?? "",
		size: params.size ?? 0,
		extension: getFileExtension(params.name),
		sizeLabel: params.size ? formatFileSize(params.size) : "",
		isLocal: false,
	};
}

export function revokeFilePreview(value?: FileUploadValue | null): void {
	if (!value?.isLocal || !value.url) return;

	URL.revokeObjectURL(value.url);
}

export function isImageUpload(value: FileUploadValue): boolean {
	return (
		value.type.startsWith("image/") ||
		/\.(jpg|jpeg|png|webp)$/i.test(value.name || value.url)
	);
}

export function isPdfUpload(value: FileUploadValue): boolean {
	return (
		value.type === "application/pdf" || /\.pdf$/i.test(value.name || value.url)
	);
}
