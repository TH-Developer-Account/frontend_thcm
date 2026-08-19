export type FileUploadKind =
	| "image"
	| "pdf"
	| "document"
	| "spreadsheet"
	| "any"
	| "vendorDocument"
	| "mediclaimDocument";

export type FileUploadValue = {
	id?: string;
	file: File | null;
	url: string;
	name: string;
	type: string;
	size: number;
	extension: string;
	sizeLabel: string;
	isLocal: boolean;
	caption?: string;
};

export type RemoteFileUploadValue = Omit<
	FileUploadValue,
	"file" | "isLocal"
> & {
	file: null;
	isLocal: false;
};

export type FileUploadError = string | null;

export type FileUploadChangeMeta = {
	action: "add" | "replace" | "remove" | "update";
	previousValue?: FileUploadValue | null;
	affectedValue?: FileUploadValue | null;
};

export type MultipleFileUploadChangeMeta = {
	action: "add" | "replace" | "remove" | "update";
	previousValue?: FileUploadValue[];
	affectedValue?: FileUploadValue | null;
};

/**
 * "card" (default) — existing thumbnail + name + meta layout.
 * "line" — compact single row: file name only (click opens the preview
 * modal) plus the same optional actions (replace/preview/remove), gated by
 * `showActions` as before. No thumbnail, no size/type meta text.
 */
export type FileUploadPreviewVariant = "card" | "line";

type FileUploadSharedProps = {
	kind?: FileUploadKind;
	label?: string;
	description?: string;
	required?: boolean;
	error?: string;
	disabled?: boolean;
	readonly?: boolean;
	heightClassName?: string;
	className?: string;
	inputName?: string;
	showActions?: boolean;
	previewVariant?: FileUploadPreviewVariant;
	enableCaption?: boolean;
	captionRequired?: boolean;
	captionLabel?: string;
	captionPlaceholder?: string;
	captionError?: string;
	maxFiles?: number;
};

export type SingleFileUploadFieldProps = FileUploadSharedProps & {
	multiple?: false;
	value: FileUploadValue | null;
	onChange: (value: FileUploadValue | null, meta: FileUploadChangeMeta) => void;
};

export type MultipleFileUploadFieldProps = FileUploadSharedProps & {
	multiple: true;
	value: FileUploadValue[];
	onChange: (
		value: FileUploadValue[],
		meta: MultipleFileUploadChangeMeta,
	) => void;
};

export type FileUploadFieldProps =
	| SingleFileUploadFieldProps
	| MultipleFileUploadFieldProps;
