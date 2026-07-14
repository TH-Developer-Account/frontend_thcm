import React from "react";
import {
	FileText,
	ImageIcon,
	RefreshCw,
	Trash2,
	Upload,
	Eye,
} from "lucide-react";

import Button from "../../common/Button";

import type { FileUploadFieldProps, FileUploadValue } from "./fileUpload.types";

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
		enableCaption = false,
		captionRequired = false,
		captionLabel = "Photo caption",
		captionPlaceholder = "Describe what is shown in this photo",
		captionError,
	}: FileUploadFieldProps) => {
		const inputRef = React.useRef<HTMLInputElement>(null);
		const latestValueRef = React.useRef<FileUploadValue | null>(value);

		const inputId = React.useId();
		const captionId = React.useId();
		const captionErrorId = `${captionId}-error`;

		React.useEffect(() => {
			latestValueRef.current = value;
		}, [value]);

		/**
		 * Revoke only the final local preview URL when this upload field
		 * unmounts. Depending directly on `value` would revoke the same
		 * image URL whenever only its caption changes.
		 */
		React.useEffect(() => {
			return () => {
				const latestValue = latestValueRef.current;

				if (latestValue?.isLocal) {
					revokeFilePreview(latestValue);
				}
			};
		}, []);

		const openFilePicker = React.useCallback(
			(event?: React.MouseEvent) => {
				event?.preventDefault();
				event?.stopPropagation();

				if (disabled || readonly) {
					return;
				}

				inputRef.current?.click();
			},
			[disabled, readonly],
		);

		const handleFileChange = React.useCallback(
			(event: React.ChangeEvent<HTMLInputElement>) => {
				const file = event.target.files?.[0];

				if (!file) {
					return;
				}

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

				if (disabled || readonly) {
					return;
				}

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

		const handleCaptionChange = React.useCallback(
			(event: React.ChangeEvent<HTMLTextAreaElement>) => {
				if (!value || disabled || readonly) {
					return;
				}

				const nextValue: FileUploadValue = {
					...value,
					caption: event.target.value,
				};

				onChange(nextValue, {
					action: "update",
					previousValue: value,
				});
			},
			[disabled, onChange, readonly, value],
		);

		const accept = React.useMemo(() => getAcceptByKind(kind), [kind]);

		const shouldShowCaption =
			Boolean(value) && enableCaption && value !== null && isImageUpload(value);

		return (
			<div
				className={joinClassNames("form-field", "file-upload-field", className)}
			>
				{label ? (
					<div className="form-label-row">
						<label htmlFor={inputId} className="form-label">
							{label}

							{required ? <span className="form-required"> *</span> : null}
						</label>
					</div>
				) : null}

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

				{shouldShowCaption && value ? (
					<div className="file-upload-caption-field">
						<label
							htmlFor={captionId}
							className="form-label file-upload-caption-label"
						>
							{captionLabel}

							{captionRequired ? (
								<span className="form-required"> *</span>
							) : null}
						</label>

						<textarea
							id={captionId}
							name={inputName ? `${inputName}Caption` : undefined}
							rows={2}
							value={value.caption ?? ""}
							placeholder={captionPlaceholder}
							disabled={disabled}
							readOnly={readonly}
							required={captionRequired}
							maxLength={500}
							className="file-upload-caption-input"
							aria-invalid={Boolean(captionError)}
							aria-describedby={captionError ? captionErrorId : undefined}
							onChange={handleCaptionChange}
						/>

						<div className="file-upload-caption-meta">
							<span>
								Use a short description suitable for the final report.
							</span>

							<span>{value.caption?.length ?? 0}/500</span>
						</div>

						{captionError ? (
							<p id={captionErrorId} className="form-error-text" role="alert">
								{captionError}
							</p>
						) : null}
					</div>
				) : null}

				{error ? <p className="form-error-text">{error}</p> : null}
			</div>
		);
	},
);

FileUploadField.displayName = "FileUploadField";
type PreviewCardProps = {
	value: NonNullable<FileUploadFieldProps["value"]>;
	heightClassName: string;
	readonly: boolean;
	disabled: boolean;
	onReplace: (event?: React.MouseEvent) => void;
	onRemove: (event?: React.MouseEvent) => void;
};

const FileUploadPreviewCard = React.memo(
	({
		value,
		heightClassName,
		readonly,
		disabled,
		onReplace,
		onRemove,
	}: PreviewCardProps) => {
		const showImagePreview = isImageUpload(value);
		const showPdfPreview = isPdfUpload(value);

		const handleView = React.useCallback(
			(event?: React.MouseEvent) => {
				event?.preventDefault();
				event?.stopPropagation();

				if (!value.url) {
					return;
				}

				window.open(value.url, "_blank", "noopener,noreferrer");
			},
			[value.url],
		);

		return (
			<div
				className={joinClassNames(
					"file-upload-preview",
					showImagePreview && "file-upload-preview-image",
					heightClassName,
				)}
				onClick={(event) => event.stopPropagation()}
			>
				<div className="file-upload-preview-body">
					<div className="file-upload-preview-thumbnail">
						{showImagePreview ? (
							<img
								src={value.url}
								alt={value.caption?.trim() || value.name}
								className="file-upload-preview-image-content"
								loading="lazy"
							/>
						) : (
							<div className="file-upload-document-icon">
								{showPdfPreview ? (
									<FileText aria-hidden="true" />
								) : (
									<ImageIcon aria-hidden="true" />
								)}
							</div>
						)}
					</div>

					<div className="file-upload-document-copy">
						<p className="file-upload-file-name" title={value.name}>
							{value.name}
						</p>

						<p className="file-upload-file-meta">
							{showImagePreview
								? "Image"
								: showPdfPreview
									? "PDF document"
									: value.type || "Uploaded file"}

							{value.sizeLabel ? ` · ${value.sizeLabel}` : ""}
						</p>
					</div>

					<div className="file-upload-preview-actions">
						{!readonly && !disabled ? (
							<Button
								type="button"
								appearance="icon"
								variant="secondary"
								size="sm"
								Icon={RefreshCw}
								aria-label="Replace file"
								onClick={onReplace}
							/>
						) : null}

						<Button
							type="button"
							appearance="icon"
							variant="secondary"
							size="sm"
							Icon={Eye}
							aria-label={`View ${value.name}`}
							onClick={handleView}
							disabled={!value.url}
						/>

						{!readonly && !disabled ? (
							<Button
								type="button"
								appearance="icon"
								variant="secondary"
								size="sm"
								Icon={Trash2}
								aria-label="Remove file"
								onClick={onRemove}
							/>
						) : null}
					</div>
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
