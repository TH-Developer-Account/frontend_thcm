import React from "react";
import { FileText, ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";

import type { FileUploadFieldProps } from "./fileUpload.types";
import {
	createFileUploadValue,
	getAcceptByKind,
	isImageUpload,
	isPdfUpload,
	revokeFilePreview,
	validateUploadFile,
} from "./fileUpload.helpers";

export const FileUploadField = React.memo(
	({
		value,
		onChange,
		kind = "document",
		label = "Upload File",
		description,
		required = false,
		error,
		disabled = false,
		readonly = false,
		heightClassName = "h-[105px]",
		className = "",
		inputName,
	}: FileUploadFieldProps) => {
		const inputRef = React.useRef<HTMLInputElement>(null);

		const openFilePicker = React.useCallback(
			(event?: React.MouseEvent) => {
				event?.preventDefault();
				event?.stopPropagation();

				if (disabled || readonly) return;

				inputRef.current?.click();
			},
			[disabled, readonly],
		);

		const handleFileChange = React.useCallback(
			(event: React.ChangeEvent<HTMLInputElement>) => {
				const file = event.target.files?.[0];

				if (!file) return;

				const validationError = validateUploadFile(file, kind);

				if (validationError) {
					onChange(null, {
						action: "remove",
						previousValue: value,
					});

					event.target.value = "";
					return;
				}

				const nextValue = createFileUploadValue(file);

				if (value?.isLocal) {
					revokeFilePreview(value);
				}

				onChange(nextValue, {
					action: value ? "replace" : "add",
					previousValue: value,
				});

				event.target.value = "";
			},
			[kind, onChange, value],
		);

		const handleRemove = React.useCallback(
			(event?: React.MouseEvent) => {
				event?.preventDefault();
				event?.stopPropagation();

				if (disabled || readonly) return;

				if (value?.isLocal) {
					revokeFilePreview(value);
				}

				onChange(null, {
					action: "remove",
					previousValue: value,
				});
			},
			[disabled, readonly, onChange, value],
		);

		React.useEffect(() => {
			return () => {
				if (value?.isLocal) {
					revokeFilePreview(value);
				}
			};
		}, [value]);

		const accept = React.useMemo(() => getAcceptByKind(kind), [kind]);

		return (
			<div className={`form-field ${className}`}>
				<div className="form-label-row">
					<label className="form-label">
						{label}
						{required && <span className="form-required"> *</span>}
					</label>
				</div>

				<input
					ref={inputRef}
					name={inputName}
					type="file"
					accept={accept}
					className="hidden"
					disabled={disabled || readonly}
					onChange={handleFileChange}
				/>

				{value ? (
					<FileUploadPreviewCard
						value={value}
						label={label}
						heightClassName={heightClassName}
						readonly={readonly}
						disabled={disabled}
						onReplace={openFilePicker}
						onRemove={handleRemove}
					/>
				) : (
					<FileUploadEmptyState
						label={label}
						description={description}
						heightClassName={heightClassName}
						disabled={disabled || readonly}
						onClick={openFilePicker}
					/>
				)}

				{error && <p className="form-error-text">{error}</p>}
			</div>
		);
	},
);

FileUploadField.displayName = "FileUploadField";

type PreviewCardProps = {
	value: NonNullable<FileUploadFieldProps["value"]>;
	label: string;
	heightClassName: string;
	readonly: boolean;
	disabled: boolean;
	onReplace: (event?: React.MouseEvent) => void;
	onRemove: (event?: React.MouseEvent) => void;
};

const FileUploadPreviewCard = React.memo(
	({
		value,
		label,
		heightClassName,
		readonly,
		disabled,
		onReplace,
		onRemove,
	}: PreviewCardProps) => {
		const showImagePreview = isImageUpload(value);
		const showPdfPreview = isPdfUpload(value);

		return (
			<div
				className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 ${heightClassName}`}
				onClick={(event) => event.stopPropagation()}
			>
				{showImagePreview ? (
					<img
						src={value.url}
						alt={value.name}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
						loading="lazy"
					/>
				) : (
					<div className="flex h-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
							{showPdfPreview ? (
								<FileText className="h-6 w-6 text-red-500" />
							) : (
								<ImageIcon className="h-6 w-6 text-gray-500" />
							)}
						</div>

						<p className="mt-3 max-w-full truncate text-xs font-semibold text-gray-800">
							{value.name}
						</p>

						<p className="mt-1 text-[11px] text-gray-500">
							{showPdfPreview ? "PDF Document" : value.type || "Uploaded file"}
							{value.sizeLabel ? ` · ${value.sizeLabel}` : ""}
						</p>
					</div>
				)}

				{showImagePreview && (
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
				)}

				{!readonly && !disabled && (
					<>
						<button
							type="button"
							onClick={onReplace}
							className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white"
							title="Replace file"
						>
							<RefreshCw className="h-4 w-4 text-gray-700" />
						</button>

						<button
							type="button"
							onClick={onRemove}
							className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 shadow-sm backdrop-blur-sm transition hover:bg-white"
							title="Remove file"
						>
							<Trash2 className="h-4 w-4 text-gray-700" />
						</button>
					</>
				)}

				<div className="absolute bottom-3 left-3 max-w-[calc(100%-24px)] rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
					<span className="inline-flex items-center gap-1 truncate">
						<Upload className="h-3 w-3 shrink-0" />
						{label}
					</span>
				</div>
			</div>
		);
	},
);

FileUploadPreviewCard.displayName = "FileUploadPreviewCard";

type EmptyStateProps = {
	label: string;
	description?: string;
	heightClassName: string;
	disabled: boolean;
	onClick: (event?: React.MouseEvent) => void;
};

const FileUploadEmptyState = React.memo(
	({
		label,
		description,
		heightClassName,
		disabled,
		onClick,
	}: EmptyStateProps) => {
		return (
			<button
				type="button"
				disabled={disabled}
				onClick={onClick}
				className={`group relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/40 disabled:cursor-not-allowed disabled:opacity-60 ${heightClassName}`}
			>
				<div className="flex h-full flex-col items-center justify-center px-4 text-center">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-105">
						<Upload className="h-4 w-4 text-gray-500" />
					</div>

					<span className="mt-2 text-sm font-medium text-gray-600">
						{label}
					</span>

					{description && (
						<span className="mt-1 text-xs text-gray-400">{description}</span>
					)}
				</div>
			</button>
		);
	},
);

FileUploadEmptyState.displayName = "FileUploadEmptyState";
