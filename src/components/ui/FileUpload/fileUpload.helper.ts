import { formatFileSize, getFileExtension } from "./fileUpload.helpers";
import type { FileUploadValue } from "./fileUpload.types";

export function createFileUploadValue(file: File): FileUploadValue {
	return {
		id: crypto.randomUUID(),
		file,
		url: URL.createObjectURL(file),
		name: file.name,
		type: file.type,
		size: file.size,
		extension: getFileExtension(file.name),
		sizeLabel: formatFileSize(file.size),
		isLocal: true,
	};
}
