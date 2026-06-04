export type FileUploadKind = "image" | "pdf" | "document" | "any";

export type FileUploadValue = {
	id: string;
	file: File | null;
	url: string;
	name: string;
	type: string;
	size: number;
	extension: string;
	sizeLabel: string;
	isLocal: boolean;
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
	action: "add" | "replace" | "remove";
	previousValue?: FileUploadValue | null;
};

export type FileUploadFieldProps = {
	value: FileUploadValue | null;
	onChange: (value: FileUploadValue | null, meta: FileUploadChangeMeta) => void;

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
};
