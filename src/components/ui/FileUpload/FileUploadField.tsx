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

import type {
	FileUploadFieldProps,
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
			className={joinClassNames("form-field", "file-upload-field", className)}
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
				<div className="file-upload-list">
					{values.map((item, index) => (
						<FileUploadPreviewCard
							key={getValueId(item)}
							value={item}
							index={index}
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
							onReplace={(event) => openFilePicker(event, item)}
							onRemove={(event) => handleRemove(item, event)}
						/>
					))}

					{isMultiple && canAddMore && !readonly ? (
						<button
							type="button"
							className="file-upload-add-more"
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
		</div>
	);
});

FileUploadField.displayName = "FileUploadField";

type PreviewCardProps = {
	value: FileUploadValue;
	index: number;
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
	onReplace: (event?: React.MouseEvent) => void;
	onRemove: (event?: React.MouseEvent) => void;
};

const FileUploadPreviewCard = React.memo(
	({
		value,
		index,
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
		onReplace,
		onRemove,
	}: PreviewCardProps) => {
		const showImagePreview = isImageUpload(value);
		const showPdfPreview = isPdfUpload(value);
		const captionId = React.useId();

		const handleView = React.useCallback(
			(event?: React.MouseEvent) => {
				event?.preventDefault();
				event?.stopPropagation();

				if (value.url) {
					window.open(value.url, "_blank", "noopener,noreferrer");
				}
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

					{showActions ? (
						<div className="file-upload-preview-actions">
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
									aria-label={`Remove ${value.name}`}
									onClick={onRemove}
								/>
							) : null}
						</div>
					) : null}
				</div>

				{enableCaption && showImagePreview ? (
					<div className="file-upload-caption-field">
						<label htmlFor={captionId} className="form-label">
							{captionLabel}
							{captionRequired ? (
								<span className="form-required"> *</span>
							) : null}
						</label>
						<textarea
							id={captionId}
							name={`file-caption-${index}`}
							rows={2}
							value={value.caption ?? ""}
							placeholder={captionPlaceholder}
							disabled={disabled}
							readOnly={readonly}
							required={captionRequired}
							maxLength={500}
							className="file-upload-caption-input"
							aria-invalid={Boolean(captionError)}
							onChange={(event) => onCaptionChange(value, event.target.value)}
						/>
						<div className="file-upload-caption-meta">
							<span>
								Use a short description suitable for the final report.
							</span>
							<span>{value.caption?.length ?? 0}/500</span>
						</div>
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

type EmptyStateProps = {
	label: string;
	description?: string;
	heightClassName: string;
	disabled: boolean;
	multiple: boolean;
	onClick: (event?: React.MouseEvent) => void;
};

const FileUploadEmptyState = React.memo(
	({
		label,
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
			className={joinClassNames("file-upload-empty", heightClassName)}
		>
			<span className="file-upload-empty-copy">
				<span className="file-upload-empty-title">{label}</span>
				<span className="file-upload-empty-description">
					{description ??
						(multiple ? "Select one or more files" : "Select a file to upload")}
				</span>
			</span>

			<span className="file-upload-empty-icon">
				<Upload aria-hidden="true" />
			</span>
		</button>
	),
);

FileUploadEmptyState.displayName = "FileUploadEmptyState";
