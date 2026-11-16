// modules/audit/shared/templates/AuditTemplateParameterEditor.tsx
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../../components/common/Button";
import Toggle from "../../../../components/common/Toggle";
import FormInput from "../../../../components/forms/FormInput";
import TextareaInput from "../../../../components/forms/TextareaInput";
import AuditTemplateConfiguredField from "./AuditTemplateConfiguredField";
import AuditTemplateScoringMatrix from "./AuditTemplateScoringMatrix";
import {
	PARAMETER_GUIDANCE_MAX_LENGTH,
	PARAMETER_TITLE_MAX_LENGTH,
	TEMPLATE_EVIDENCE_MAX_LIMIT,
} from "./audit-template.constants";
import type { AuditTemplateLayout } from "./audit-template.schemas";
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
	onMove: (fromIndex: number, toIndex: number) => void;
	onRemove: (index: number) => void;
	onDuplicate?: (index: number) => void;
};

export default function AuditTemplateParameterEditor({
	sectionIndex,
	parameterIndex,
	parameterCount,
	parameterFields,
	layout = "sections",
	bare = false,
	disabled = false,
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
						<Toggle
							checked={field.value}
							onChange={field.onChange}
							disabled={disabled}
							size="sm"
							label="Photo evidence required"
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
