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
