import React from "react";
import {
	Eye,
	FileText,
	ImageIcon,
	Plus,
	RefreshCw,
	Trash2,
	Upload,
} from "lucide-react";

import Button from "../../common/Button";
import { Modal } from "../../common/Modal";

import type {
	FileUploadFieldProps,
	FileUploadPreviewVariant,
	FileUploadValue,
	MultipleFileUploadFieldProps,
	SingleFileUploadFieldProps,
} from "./fileUpload.types";

import {
	createFileUploadValue,
	getAcceptByKind,
	isImageUpload,
	isPdfUpload,
	revokeFilePreview,
	validateUploadFile,
} from "./fileUpload.helpers";
import FormInput from "../../forms/FormInput";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const getValueId = (value: FileUploadValue): string =>
	value.id ?? `${value.name}-${value.size}-${value.url}`;

export const FileUploadField = React.memo((props: FileUploadFieldProps) => {
	const {
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
		showActions = true,
		previewVariant = "card",
		enableCaption = false,
		captionRequired = false,
		captionLabel = "Photo caption",
		captionPlaceholder = "Describe what is shown in this photo",
		captionError,
		maxFiles,
	} = props;

	const isMultiple = props.multiple === true;
	const values = React.useMemo<FileUploadValue[]>(
		() => (isMultiple ? props.value : props.value ? [props.value] : []),
		[isMultiple, props.value],
	);

	const inputRef = React.useRef<HTMLInputElement>(null);
	const latestValuesRef = React.useRef<FileUploadValue[]>(values);
	const [replacingId, setReplacingId] = React.useState<string | null>(null);
	const [selectionError, setSelectionError] = React.useState<string | null>(
		null,
	);
	const [previewValue, setPreviewValue] =
		React.useState<FileUploadValue | null>(null);

	const inputId = React.useId();
	const errorId = `${inputId}-error`;

	React.useEffect(() => {
		latestValuesRef.current = values;
	}, [values]);

	React.useEffect(() => {
		return () => {
			latestValuesRef.current.forEach((item) => revokeFilePreview(item));
		};
	}, []);

	const openFilePicker = React.useCallback(
		(event?: React.MouseEvent, replaceValue?: FileUploadValue) => {
			event?.preventDefault();
			event?.stopPropagation();

			if (disabled || readonly) {
				return;
			}

			setReplacingId(replaceValue ? getValueId(replaceValue) : null);
			inputRef.current?.click();
		},
		[disabled, readonly],
	);

	const emitSingleChange = React.useCallback(
		(
			nextValue: FileUploadValue | null,
			previousValue: FileUploadValue | null,
		) => {
			const singleProps = props as SingleFileUploadFieldProps;
			singleProps.onChange(nextValue, {
				action: previousValue ? (nextValue ? "replace" : "remove") : "add",
				previousValue,
				affectedValue: nextValue ?? previousValue,
			});
		},
		[props],
	);

	const emitMultipleChange = React.useCallback(
		(
			nextValues: FileUploadValue[],
			action: "add" | "replace" | "remove" | "update",
			affectedValue?: FileUploadValue | null,
		) => {
			const multipleProps = props as MultipleFileUploadFieldProps;
			multipleProps.onChange(nextValues, {
				action,
				previousValue: multipleProps.value,
				affectedValue,
			});
		},
		[props],
	);

	const handleFileChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFiles = Array.from(event.target.files ?? []);
			event.target.value = "";

			if (selectedFiles.length === 0) {
				setReplacingId(null);
				return;
			}

			const invalidMessage = selectedFiles
				.map((file) => validateUploadFile(file, kind))
				.find(Boolean);

			if (invalidMessage) {
				setSelectionError(invalidMessage);
				setReplacingId(null);
				return;
			}

			setSelectionError(null);
			const createdValues = selectedFiles.map(createFileUploadValue);

			if (!isMultiple) {
				const previousValue = props.value;
				const nextValue = createdValues[0];

				if (previousValue?.isLocal) {
					revokeFilePreview(previousValue);
				}

				emitSingleChange(nextValue, previousValue);
				setReplacingId(null);
				return;
			}

			const currentValues = props.value;
			if (replacingId) {
				const replacement = createdValues[0];
				const replacedValue = currentValues.find(
					(item) => getValueId(item) === replacingId,
				);

				if (!replacedValue) {
					createdValues.forEach(revokeFilePreview);
					setReplacingId(null);
					return;
				}

				if (replacedValue.isLocal) {
					revokeFilePreview(replacedValue);
				}

				const nextValues = currentValues.map((item) =>
					getValueId(item) === replacingId ? replacement : item,
				);

				emitMultipleChange(nextValues, "replace", replacement);
				setReplacingId(null);
				return;
			}

			const remainingSlots = maxFiles
				? Math.max(maxFiles - currentValues.length, 0)
				: createdValues.length;
			const acceptedValues = createdValues.slice(0, remainingSlots);
			const rejectedValues = createdValues.slice(remainingSlots);
			rejectedValues.forEach(revokeFilePreview);

			if (acceptedValues.length === 0) {
				setSelectionError(`You can upload a maximum of ${maxFiles} files.`);
				return;
			}

			if (rejectedValues.length > 0) {
				setSelectionError(
					`Only ${remainingSlots} more file(s) can be uploaded.`,
				);
			}

			emitMultipleChange(
				[...currentValues, ...acceptedValues],
				"add",
				acceptedValues[acceptedValues.length - 1],
			);
		},
		[
			emitMultipleChange,
			emitSingleChange,
			isMultiple,
			kind,
			maxFiles,
			props,
			replacingId,
		],
	);

	const handleRemove = React.useCallback(
		(valueToRemove: FileUploadValue, event?: React.MouseEvent) => {
			event?.preventDefault();
			event?.stopPropagation();

			if (disabled || readonly) {
				return;
			}

			if (valueToRemove.isLocal) {
				revokeFilePreview(valueToRemove);
			}

			if (isMultiple) {
				const nextValues = props.value.filter(
					(item) => getValueId(item) !== getValueId(valueToRemove),
				);
				emitMultipleChange(nextValues, "remove", valueToRemove);
				return;
			}

			emitSingleChange(null, props.value);
		},
		[
			disabled,
			emitMultipleChange,
			emitSingleChange,
			isMultiple,
			props,
			readonly,
		],
	);

	const handleCaptionChange = React.useCallback(
		(valueToUpdate: FileUploadValue, caption: string) => {
			if (disabled || readonly) {
				return;
			}

			const nextValue = { ...valueToUpdate, caption };

			if (isMultiple) {
				const nextValues = props.value.map((item) =>
					getValueId(item) === getValueId(valueToUpdate) ? nextValue : item,
				);
				emitMultipleChange(nextValues, "update", nextValue);
				return;
			}

			const singleProps = props as SingleFileUploadFieldProps;
			singleProps.onChange(nextValue, {
				action: "update",
				previousValue: valueToUpdate,
				affectedValue: nextValue,
			});
		},
		[disabled, emitMultipleChange, isMultiple, props, readonly],
	);

	const accept = React.useMemo(() => getAcceptByKind(kind), [kind]);
	const canAddMore = !maxFiles || values.length < maxFiles;
	const renderedError = selectionError ?? error;

	return (
		<div
			className={joinClassNames(
				"form-field",
				"file-upload-field",
				isMultiple && "file-upload-field--multiple",
				className,
			)}
		>
			{label ? (
				<div className="form-label-row">
					<label htmlFor={inputId} className="form-label">
						{label}
						{required ? <span className="form-required"> *</span> : null}
					</label>

					{isMultiple && maxFiles ? (
						<span className="file-upload-count">
							{values.length}/{maxFiles}
						</span>
					) : null}
				</div>
			) : null}

			<input
				id={inputId}
				ref={inputRef}
				name={inputName}
				type="file"
				accept={accept}
				multiple={isMultiple && replacingId === null}
				className="file-upload-native-input"
				disabled={disabled || readonly}
				aria-invalid={Boolean(renderedError)}
				aria-describedby={renderedError ? errorId : undefined}
				onChange={handleFileChange}
			/>

			{values.length > 0 ? (
				<div
					className={joinClassNames(
						"file-upload-list",
						previewVariant === "line"
							? "flex flex-col gap-1.5"
							: isMultiple
								? "file-upload-list--grid"
								: "flex flex-col gap-2",
					)}
				>
					{values.map((item, index) => (
						<FileUploadPreviewCard
							key={getValueId(item)}
							value={item}
							index={index}
							variant={previewVariant}
							heightClassName={heightClassName}
							readonly={readonly}
							disabled={disabled}
							showActions={showActions}
							enableCaption={enableCaption}
							captionRequired={captionRequired}
							captionLabel={captionLabel}
							captionPlaceholder={captionPlaceholder}
							captionError={captionError}
							onCaptionChange={handleCaptionChange}
							onPreview={() => setPreviewValue(item)}
							onReplace={(event) => openFilePicker(event, item)}
							onRemove={(event) => handleRemove(item, event)}
						/>
					))}

					{isMultiple && canAddMore && !readonly ? (
						<button
							type="button"
							className="file-upload-add-more flex min-h-10 w-full items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 text-xs font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
							disabled={disabled}
							onClick={(event) => openFilePicker(event)}
						>
							<span>Add another file</span>
							<Plus aria-hidden="true" />
						</button>
					) : null}
				</div>
			) : (
				<FileUploadEmptyState
					label={label}
					required={required}
					description={description}
					heightClassName={heightClassName}
					disabled={disabled || readonly}
					multiple={isMultiple}
					onClick={(event) => openFilePicker(event)}
				/>
			)}

			{renderedError ? (
				<p id={errorId} className="form-error-text" role="alert">
					{renderedError}
				</p>
			) : null}

			<FileUploadPreviewModal
				value={previewValue}
				onClose={() => setPreviewValue(null)}
			/>
		</div>
	);
});

FileUploadField.displayName = "FileUploadField";

type PreviewCardProps = {
	value: FileUploadValue;
	index: number;
	variant: FileUploadPreviewVariant;
	heightClassName: string;
	readonly: boolean;
	disabled: boolean;
	showActions: boolean;
	enableCaption: boolean;
	captionRequired: boolean;
	captionLabel: string;
	captionPlaceholder: string;
	captionError?: string;
	onCaptionChange: (value: FileUploadValue, caption: string) => void;
	onPreview: () => void;
	onReplace: (event?: React.MouseEvent) => void;
	onRemove: (event?: React.MouseEvent) => void;
};

const FileUploadPreviewCard = React.memo(
	({
		value,
		index,
		variant,
		heightClassName,
		readonly,
		disabled,
		showActions,
		enableCaption,
		captionRequired,
		captionLabel,
		captionPlaceholder,
		captionError,
		onCaptionChange,
		onPreview,
		onReplace,
		onRemove,
	}: PreviewCardProps) => {
		const showImagePreview = isImageUpload(value);
		const showPdfPreview = isPdfUpload(value);
		const captionId = React.useId();

		if (variant === "line") {
			return (
				<div className="file-upload-preview-line flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
					<button
						type="button"
						className="file-upload-line-name min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-900 hover:text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-60"
						title={value.name}
						disabled={!value.url}
						onClick={(event) => {
							event.preventDefault();
							event.stopPropagation();
							onPreview();
						}}
					>
						{value.name}
					</button>

					{showActions ? (
						<div className="file-upload-preview-actions ml-auto flex shrink-0 items-center gap-1">
							{!readonly && !disabled ? (
								<Button
									type="button"
									appearance="icon"
									variant="secondary"
									size="sm"
									Icon={RefreshCw}
									aria-label={`Replace ${value.name}`}
									onClick={onReplace}
								/>
							) : null}

							<button
								type="button"
								className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
								aria-label={`Preview ${value.name}`}
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									onPreview();
								}}
								disabled={!value.url}
							>
								<Eye className="size-3.5" aria-hidden="true" />
							</button>

							{!readonly && !disabled ? (
								<Button
									type="button"
									appearance="icon"
									variant="secondary"
									size="sm"
									Icon={Trash2}
									aria-label={`Remove ${value.name}`}
									onClick={onRemove}
								/>
							) : null}
						</div>
					) : null}
				</div>
			);
		}

		return (
			<div
				className={joinClassNames(
					"file-upload-preview",
					"overflow-hidden rounded-lg border border-slate-200 bg-white",
					showImagePreview && "file-upload-preview-image",
					heightClassName,
					// readonly && "flex",
				)}
			>
				<div className="file-upload-preview-body flex min-h-2 items-center gap-2 px-2.5 py-1.5">
					<div className="file-upload-preview-thumbnail flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 text-slate-600">
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

					<div className="file-upload-document-copy min-w-0 flex-1">
						<p className="file-upload-file-name" title={value.name}>
							{value.name}
						</p>
						<p className="file-upload-file-meta">
							{showImagePreview
								? "Image"
								: showPdfPreview
									? "PDF document"
									: "Uploaded file"}
							{value.sizeLabel ? ` · ${value.sizeLabel}` : ""}
						</p>
					</div>
				</div>
				{showActions ? (
					<div className="file-upload-preview-actions ml-auto flex shrink-0 items-center gap-1">
						{!readonly && !disabled ? (
							<Button
								type="button"
								appearance="icon"
								variant="secondary"
								size="sm"
								Icon={RefreshCw}
								aria-label={`Replace ${value.name}`}
								onClick={onReplace}
							/>
						) : null}

						<button
							type="button"
							className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-700 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
							aria-label={`Preview ${value.name}`}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								onPreview();
							}}
							disabled={!value.url}
						>
							<Eye className="size-3.5" aria-hidden="true" />
						</button>

						{!readonly && !disabled ? (
							<Button
								type="button"
								appearance="icon"
								variant="secondary"
								size="sm"
								Icon={Trash2}
								aria-label={`Remove ${value.name}`}
								onClick={onRemove}
							/>
						) : null}
					</div>
				) : null}

				{enableCaption && showImagePreview ? (
					<div className="file-upload-caption-field">
						<label htmlFor={captionId} className="form-label">
							{captionLabel}
							{captionRequired ? (
								<span className="form-required"> *</span>
							) : null}
						</label>
						<FormInput
							id={captionId}
							name={`file-caption-${index}`}
							value={value.caption ?? ""}
							placeholder={captionPlaceholder}
							disabled={disabled}
							readOnly={readonly}
							required={captionRequired}
							className="file-upload-caption-input"
							aria-invalid={Boolean(captionError)}
							onChange={(event) => onCaptionChange(value, event.target.value)}
						/>
						{captionError ? (
							<p className="form-error-text" role="alert">
								{captionError}
							</p>
						) : null}
					</div>
				) : null}
			</div>
		);
	},
);

FileUploadPreviewCard.displayName = "FileUploadPreviewCard";

type FileUploadPreviewModalProps = {
	value: FileUploadValue | null;
	onClose: () => void;
};

const FileUploadPreviewModal = ({
	value,
	onClose,
}: FileUploadPreviewModalProps) => {
	const canPreviewImage = value ? isImageUpload(value) : false;
	const canPreviewPdf = value ? isPdfUpload(value) : false;

	return (
		<Modal
			open={Boolean(value)}
			title={value?.name ?? "File preview"}
			size="xl"
			className="file-upload-preview-modal"
			onClose={onClose}
			ariaLabel="Uploaded file preview"
		>
			{value ? (
				<div className="file-upload-preview-modal-content">
					{canPreviewImage ? (
						<img
							src={value.url}
							alt={value.caption?.trim() || value.name}
							className="file-upload-preview-modal-image"
						/>
					) : canPreviewPdf ? (
						<iframe
							src={value.url}
							title={value.name}
							className="file-upload-preview-modal-frame"
						/>
					) : (
						<div className="file-upload-preview-modal-fallback">
							<FileText aria-hidden="true" />
							<p>This file type cannot be previewed in the browser.</p>
							<a
								href={value.url}
								target="_blank"
								rel="noopener noreferrer"
								className="file-upload-preview-modal-link"
							>
								Open file
							</a>
						</div>
					)}
				</div>
			) : null}
		</Modal>
	);
};

type EmptyStateProps = {
	label: string;
	required: boolean;
	description?: string;
	heightClassName: string;
	disabled: boolean;
	multiple: boolean;
	onClick: (event?: React.MouseEvent) => void;
};

const FileUploadEmptyState = React.memo(
	({
		// label,
		// required,
		description,
		heightClassName,
		disabled,
		multiple,
		onClick,
	}: EmptyStateProps) => (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={joinClassNames(
				"file-upload-empty flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-left transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-60",
				heightClassName,
			)}
		>
			<span className="file-upload-empty-copy min-w-0">
				<span className="file-upload-empty-title block truncate text-xs font-normal text-slate-900">
					Upload file
				</span>
				<span className="file-upload-empty-description sr-only">
					{description ??
						(multiple ? "Select one or more files" : "Select a file to upload")}
				</span>
			</span>

			<span className="file-upload-empty-icon flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-600">
				<Upload className="size-4" aria-hidden="true" />
			</span>
		</button>
	),
);

FileUploadEmptyState.displayName = "FileUploadEmptyState";
