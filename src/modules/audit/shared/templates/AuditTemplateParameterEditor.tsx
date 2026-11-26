// modules/audit/shared/templates/AuditTemplateParameterEditor.tsx
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../../components/common/Button";
import FormInput from "../../../../components/forms/FormInput";
import Radio, { type RadioOption } from "../../../../components/forms/Radio";
import TextareaInput from "../../../../components/forms/TextareaInput";
import { FileUploadField } from "../../../../components/ui/FileUpload/FileUploadField";
import {
	createRemoteFileUploadValue,
	revokeFilePreview,
} from "../../../../components/ui/FileUpload/fileUpload.helpers";
import type { FileUploadValue } from "../../../../components/ui/FileUpload/fileUpload.types";
import { getAuditActionErrorMessage } from "../audit-error.utils";
import AuditTemplateConfiguredField from "./AuditTemplateConfiguredField";
import AuditTemplateScoringMatrix from "./AuditTemplateScoringMatrix";
import {
	PARAMETER_GUIDANCE_MAX_LENGTH,
	PARAMETER_TITLE_MAX_LENGTH,
	TEMPLATE_EVIDENCE_MAX_LIMIT,
} from "./audit-template.constants";
import type {
	AuditTemplateLayout,
	AuditTemplatePhotoUploader,
	AuditTemplateReferencePhoto,
} from "./audit-template.schemas";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";

type Props = {
	sectionIndex: number;
	parameterIndex: number;
	parameterCount: number;
	parameterFields: readonly AuditTemplateFieldConfig[];
	/**
	 * "flat" (Dealer): Function / Category come first and the guidance box is
	 * labelled "Check point / criteria".
	 * "sections" (Factory): original order and 1.1 / 1.2 numbering.
	 */
	layout?: AuditTemplateLayout;
	/**
	 * Render only the form body. The Dealer builder puts each parameter in a
	 * Card section, and the Card supplies the header, numbering and the
	 * move / duplicate / delete actions.
	 */
	bare?: boolean;
	disabled?: boolean;
	/**
	 * Uploads a reference image and resolves with its storage key + URL.
	 * Passing it turns on the optional "Reference image" field; modules that
	 * have no reference images (Factory) simply do not pass it.
	 */
	onUploadReferencePhoto?: AuditTemplatePhotoUploader;
	onMove: (fromIndex: number, toIndex: number) => void;
	onRemove: (index: number) => void;
	onDuplicate?: (index: number) => void;
};

const EVIDENCE_OPTIONS: RadioOption[] = [
	{ label: "Yes", value: "yes" },
	{ label: "No", value: "no" },
];

// ── Reference image (optional) ────────────────────────────────────────

type ReferencePhotoFieldProps = {
	value: AuditTemplateReferencePhoto | null;
	upload: AuditTemplatePhotoUploader;
	disabled: boolean;
	error?: string;
	onChange: (value: AuditTemplateReferencePhoto | null) => void;
};

/**
 * Wraps the common FileUploadField. The file is uploaded as soon as it is
 * picked, and only the returned key / URL goes into the form — so nothing
 * breaks when the user moves between builder steps, and a failed upload
 * never blocks saving the checklist (the image is optional).
 */
function ReferencePhotoField({
	value,
	upload,
	disabled,
	error,
	onChange,
}: ReferencePhotoFieldProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	const fileValue = useMemo<FileUploadValue | null>(
		() =>
			value
				? createRemoteFileUploadValue({
						id: value.key,
						url: value.url,
						name: value.name,
					})
				: null,
		[value],
	);

	const handleChange = async (next: FileUploadValue | null) => {
		setUploadError(null);

		// Removed.
		if (!next) {
			onChange(null);
			return;
		}

		// Only a freshly picked file needs uploading.
		const file = next.file;
		if (!file) return;

		setIsUploading(true);
		try {
			const uploaded = await upload(file);
			onChange({ key: uploaded.key, url: uploaded.url, name: file.name });
		} catch (uploadFailure) {
			setUploadError(getAuditActionErrorMessage(uploadFailure, "template"));
		} finally {
			// The local preview is no longer needed once uploaded (or failed).
			revokeFilePreview(next);
			setIsUploading(false);
		}
	};

	return (
		<div className="rounded-lg border border-(--color-border-default) bg-(--color-bg-surface) p-3">
			<FileUploadField
				kind="image"
				label="Reference image (optional)"
				tooltip="An example photo for this parameter. JPG or PNG, up to 5 MB."
				value={fileValue}
				previewVariant="card"
				disabled={disabled || isUploading}
				error={uploadError ?? error}
				onChange={(next) => void handleChange(next)}
			/>
			{isUploading ? (
				<p
					className="mt-1.5 text-xs text-(--color-text-secondary)"
					role="status"
					aria-live="polite"
				>
					Uploading image…
				</p>
			) : null}
		</div>
	);
}

// ── Parameter editor ──────────────────────────────────────────────────

export default function AuditTemplateParameterEditor({
	sectionIndex,
	parameterIndex,
	parameterCount,
	parameterFields,
	layout = "sections",
	bare = false,
	disabled = false,
	onUploadReferencePhoto,
	onMove,
	onRemove,
	onDuplicate,
}: Props) {
	const {
		control,
		register,
		formState: { errors },
	} = useFormContext<AuditTemplateBuildFormValues>();

	const isFlat = layout === "flat";
	const basePath =
		`sections.${sectionIndex}.parameters.${parameterIndex}` as const;
	const parameterErrors =
		errors.sections?.[sectionIndex]?.parameters?.[parameterIndex];

	const evidenceRequired = useWatch({
		control,
		name: `${basePath}.evidenceRequired`,
	});

	const idPrefix = `s${sectionIndex}-p${parameterIndex}`;
	const displayNumber = isFlat
		? `${parameterIndex + 1}`
		: `${sectionIndex + 1}.${parameterIndex + 1}`;

	const configuredFields =
		parameterFields.length > 0 ? (
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{parameterFields.map((config) => (
					<AuditTemplateConfiguredField
						key={config.key}
						config={config}
						name={`${basePath}.attributes.${config.key}`}
						idPrefix={`${idPrefix}-`}
						disabled={disabled}
						error={parameterErrors?.attributes?.[config.key]?.message}
					/>
				))}
			</div>
		) : null;

	const body = (
		<div className="min-w-0 flex-1 space-y-3">
			{/* Dealer: Function / Category lead the form. */}
			{isFlat ? configuredFields : null}

			<FormInput
				id={`${idPrefix}-title`}
				label="Parameter"
				required
				placeholder="e.g. Reception counter"
				maxLength={PARAMETER_TITLE_MAX_LENGTH}
				disabled={disabled}
				error={parameterErrors?.title?.message}
				{...register(`${basePath}.title`)}
			/>

			<TextareaInput
				id={`${idPrefix}-guidance`}
				label={isFlat ? "Check point / criteria" : "How to inspect"}
				placeholder="e.g. Reception table & Tata Hitachi backdrop"
				rows={2}
				maxLength={PARAMETER_GUIDANCE_MAX_LENGTH}
				disabled={disabled}
				error={parameterErrors?.guidance?.message}
				{...register(`${basePath}.guidance`)}
			/>

			{!isFlat ? configuredFields : null}

			<AuditTemplateScoringMatrix
				sectionIndex={sectionIndex}
				parameterIndex={parameterIndex}
				disabled={disabled}
			/>

			<div className="rounded-lg border border-(--color-border-default) bg-(--color-bg-surface) p-3">
				<Controller
					control={control}
					name={`${basePath}.evidenceRequired`}
					render={({ field }) => (
						<Radio
							name={`${idPrefix}-evidence-required`}
							groupLabel="Photo evidence required"
							helperText="When Yes, the auditor must attach photos for this parameter."
							options={EVIDENCE_OPTIONS}
							selectedValue={field.value ? "yes" : "no"}
							onChange={(next) => field.onChange(next === "yes")}
							disabled={disabled}
						/>
					)}
				/>

				{evidenceRequired ? (
					<div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-sm">
						<FormInput
							id={`${idPrefix}-min-evidence`}
							type="number"
							inputMode="numeric"
							label="Min photos"
							required
							min={1}
							max={TEMPLATE_EVIDENCE_MAX_LIMIT}
							disabled={disabled}
							error={parameterErrors?.minEvidenceCount?.message}
							{...register(`${basePath}.minEvidenceCount`, {
								valueAsNumber: true,
							})}
						/>
						<FormInput
							id={`${idPrefix}-max-evidence`}
							type="number"
							inputMode="numeric"
							label="Max photos"
							required
							min={1}
							max={TEMPLATE_EVIDENCE_MAX_LIMIT}
							disabled={disabled}
							error={parameterErrors?.maxEvidenceCount?.message}
							{...register(`${basePath}.maxEvidenceCount`, {
								valueAsNumber: true,
							})}
						/>
					</div>
				) : null}
			</div>

			{onUploadReferencePhoto ? (
				<Controller
					control={control}
					name={`${basePath}.referencePhoto`}
					render={({ field }) => (
						<ReferencePhotoField
							value={field.value ?? null}
							upload={onUploadReferencePhoto}
							disabled={disabled}
							error={parameterErrors?.referencePhoto?.message}
							onChange={field.onChange}
						/>
					)}
				/>
			) : null}

			<p className="text-xs text-(--color-text-secondary)">
				Remarks are always available to the auditor and are optional.
			</p>
		</div>
	);

	if (bare) return body;

	return (
		<article
			className="rounded-xl border border-(--color-border-default) bg-(--color-bg-muted) p-3"
			aria-label={`Parameter ${displayNumber}`}
		>
			<div className="flex items-start gap-2.5">
				<span
					className="mt-2 shrink-0 text-xs font-bold text-(--color-text-secondary)"
					aria-hidden="true"
				>
					{displayNumber}
				</span>

				{body}

				<div className="flex shrink-0 flex-col items-center gap-1">
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={ChevronUp}
						aria-label={`Move parameter ${displayNumber} up`}
						disabled={disabled || parameterIndex === 0}
						onClick={() => onMove(parameterIndex, parameterIndex - 1)}
					/>
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={ChevronDown}
						aria-label={`Move parameter ${displayNumber} down`}
						disabled={disabled || parameterIndex === parameterCount - 1}
						onClick={() => onMove(parameterIndex, parameterIndex + 1)}
					/>
					{onDuplicate ? (
						<Button
							appearance="icon"
							variant="transparent"
							size="sm"
							Icon={Copy}
							aria-label={`Duplicate parameter ${displayNumber}`}
							disabled={disabled}
							onClick={() => onDuplicate(parameterIndex)}
						/>
					) : null}
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={Trash2}
						aria-label={`Delete parameter ${displayNumber}`}
						disabled={disabled}
						onClick={() => onRemove(parameterIndex)}
					/>
				</div>
			</div>
		</article>
	);
}
