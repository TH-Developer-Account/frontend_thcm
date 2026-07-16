export type FileUploadKind =
	| "image"
	| "pdf"
	| "document"
	| "spreadsheet"
	| "any";

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

	/**
	 * Optional user-entered description for uploaded images.
	 * This can be submitted with report image metadata.
	 */
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
	showActions?: boolean;
	/**
	 * Displays a caption field after an image has been uploaded.
	 */
	enableCaption?: boolean;

	/**
	 * Marks the caption as mandatory.
	 * Validation should still be performed by the parent form.
	 */
	captionRequired?: boolean;

	captionLabel?: string;
	captionPlaceholder?: string;
	captionError?: string;
};
