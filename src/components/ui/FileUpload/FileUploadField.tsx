import React from "react";
import { FileText, ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";

import Button from "../../common/Button";

import type { FileUploadFieldProps } from "./fileUpload.types";

import {
	createFileUploadValue,
	getAcceptByKind,
	isImageUpload,
	isPdfUpload,
	revokeFilePreview,
	validateUploadFile,
} from "./fileUpload.helpers";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

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
		heightClassName = "",
		className = "",
		inputName,
	}: FileUploadFieldProps) => {
		const inputRef = React.useRef<HTMLInputElement>(null);

		const inputId = React.useId();

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
			[disabled, onChange, readonly, value],
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
			<div
				className={joinClassNames("form-field", "file-upload-field", className)}
			>
				<div className="form-label-row">
					<label htmlFor={inputId} className="form-label">
						{label}

						{required ? <span className="form-required"> *</span> : null}
					</label>
				</div>

				<input
					id={inputId}
					ref={inputRef}
					name={inputName}
					type="file"
					accept={accept}
					className="file-upload-native-input"
					disabled={disabled || readonly}
					aria-invalid={Boolean(error)}
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

				{error ? <p className="form-error-text">{error}</p> : null}
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
		// label,
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
				className={joinClassNames(
					"file-upload-preview",
					showImagePreview && "file-upload-preview-image",
					heightClassName,
				)}
				onClick={(event) => event.stopPropagation()}
			>
				{showImagePreview ? (
					<>
						<img
							src={value.url}
							alt={value.name}
							className="file-upload-preview-image-content"
							loading="lazy"
						/>

						<div className="file-upload-preview-overlay" aria-hidden="true" />
					</>
				) : (
					<div className="file-upload-document-preview">
						<div className="file-upload-document-icon">
							{showPdfPreview ? (
								<FileText aria-hidden="true" />
							) : (
								<ImageIcon aria-hidden="true" />
							)}
						</div>

						<div className="file-upload-document-copy">
							<p className="file-upload-file-name" title={value.name}>
								{value.name}
							</p>

							<p className="file-upload-file-meta">
								{showPdfPreview
									? "PDF document"
									: value.type || "Uploaded file"}

								{value.sizeLabel ? ` · ${value.sizeLabel}` : ""}
							</p>
						</div>
					</div>
				)}

				{!readonly && !disabled ? (
					<div className="file-upload-preview-actions">
						<Button
							type="button"
							appearance="icon"
							variant="secondary"
							size="sm"
							Icon={RefreshCw}
							aria-label="Replace file"
							onClick={onReplace}
						/>

						<Button
							type="button"
							appearance="icon"
							variant="secondary"
							size="sm"
							Icon={Trash2}
							aria-label="Remove file"
							onClick={onRemove}
						/>
					</div>
				) : null}

				{/* <div className="file-upload-preview-label">
					<Upload aria-hidden="true" />

					<span>{label}</span>
				</div> */}
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
				className={joinClassNames("file-upload-empty", heightClassName)}
			>
				<span className="file-upload-empty-icon">
					<Upload aria-hidden="true" />
				</span>

				<span className="file-upload-empty-copy">
					<span className="file-upload-empty-title">{label}</span>

					{description ? (
						<span className="file-upload-empty-description">{description}</span>
					) : null}
				</span>
			</button>
		);
	},
);

FileUploadEmptyState.displayName = "FileUploadEmptyState";
