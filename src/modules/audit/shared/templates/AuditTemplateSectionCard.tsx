// modules/audit/shared/templates/AuditTemplateSectionCard.tsx
import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import AuditTemplateParameterEditor from "./AuditTemplateParameterEditor";
import { SECTION_NAME_MAX_LENGTH } from "./audit-template.constants";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";
import {
	createEmptyParameter,
	getArrayErrorMessage,
	getParameterMaxScore,
} from "./audit-template.utils";

type Props = {
	sectionIndex: number;
	sectionCount: number;
	parameterFields: readonly AuditTemplateFieldConfig[];
	disabled?: boolean;
	onRemove: (index: number) => void;
	onMove: (fromIndex: number, toIndex: number) => void;
};

export default function AuditTemplateSectionCard({
	sectionIndex,
	sectionCount,
	parameterFields,
	disabled = false,
	onRemove,
	onMove,
}: Props) {
	const [isExpanded, setIsExpanded] = useState(true);
	const {
		control,
		register,
		formState: { errors },
	} = useFormContext<AuditTemplateBuildFormValues>();

	const { fields, append, remove, move } = useFieldArray({
		control,
		name: `sections.${sectionIndex}.parameters`,
		keyName: "fieldKey",
	});

	const sectionName = useWatch({ control, name: `sections.${sectionIndex}.name` });
	const parameters = useWatch({
		control,
		name: `sections.${sectionIndex}.parameters`,
	});

	const sectionErrors = errors.sections?.[sectionIndex];
	const parametersError = getArrayErrorMessage(sectionErrors?.parameters);
	const hasErrors = Boolean(sectionErrors);
	const points = (parameters ?? []).reduce(
		(sum, parameter) => sum + getParameterMaxScore(parameter),
		0,
	);

	const sectionNumber = String(sectionIndex + 1).padStart(2, "0");
	const bodyId = `template-section-${sectionIndex}-body`;

	return (
		<Card
			variant="outlined"
			padding="compact"
			aria-label={`Section ${sectionIndex + 1}`}
			className={hasErrors ? "border-(--color-error)" : undefined}
		>
			<div className="flex items-start gap-2.5">
				<span
					className="mt-7 grid size-7 shrink-0 place-items-center rounded-md bg-(--color-text-primary) text-xs font-bold text-(--color-bg-surface)"
					aria-hidden="true"
				>
					{sectionNumber}
				</span>

				<div className="min-w-0 flex-1">
					<FormInput
						id={`section-${sectionIndex}-name`}
						label="Section name"
						required
						placeholder="e.g. Facility & Brand Standards"
						maxLength={SECTION_NAME_MAX_LENGTH}
						disabled={disabled}
						error={sectionErrors?.name?.message}
						{...register(`sections.${sectionIndex}.name`)}
					/>
					<p className="mt-1 text-xs text-(--color-text-secondary)">
						{fields.length} parameter{fields.length === 1 ? "" : "s"} · {points} pts
						{hasErrors && !isExpanded ? (
							<span className="ml-2 font-semibold text-(--color-error)">
								· Needs attention
							</span>
						) : null}
					</p>
				</div>

				<div className="mt-6 flex shrink-0 items-center gap-1">
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={ChevronUp}
						aria-label={`Move section ${sectionIndex + 1} up`}
						disabled={disabled || sectionIndex === 0}
						onClick={() => onMove(sectionIndex, sectionIndex - 1)}
					/>
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={ChevronDown}
						aria-label={`Move section ${sectionIndex + 1} down`}
						disabled={disabled || sectionIndex === sectionCount - 1}
						onClick={() => onMove(sectionIndex, sectionIndex + 1)}
					/>
					<Button
						appearance="icon"
						variant="transparent"
						size="sm"
						Icon={Trash2}
						aria-label={`Delete section ${sectionName?.trim() || sectionIndex + 1}`}
						disabled={disabled || sectionCount === 1}
						onClick={() => onRemove(sectionIndex)}
					/>
					<Button
						appearance="icon"
						variant="outline"
						size="sm"
						Icon={isExpanded ? ChevronUp : ChevronDown}
						aria-label={isExpanded ? "Collapse section" : "Expand section"}
						aria-expanded={isExpanded}
						aria-controls={bodyId}
						onClick={() => setIsExpanded((current) => !current)}
					/>
				</div>
			</div>

			<div id={bodyId} hidden={!isExpanded}>
				<div className="mt-3 space-y-2.5">
					{fields.map((field, parameterIndex) => (
						<AuditTemplateParameterEditor
							key={field.fieldKey}
							sectionIndex={sectionIndex}
							parameterIndex={parameterIndex}
							parameterCount={fields.length}
							parameterFields={parameterFields}
							disabled={disabled}
							onMove={move}
							onRemove={remove}
						/>
					))}
				</div>

				{parametersError ? (
					<p className="form-error-text mt-2" role="alert">
						{parametersError}
					</p>
				) : null}

				<Button
					text="Add parameter"
					variant="outline"
					size="sm"
					Icon={Plus}
					className="mt-3 w-full border-dashed"
					disabled={disabled}
					onClick={() => append(createEmptyParameter(parameterFields))}
				/>
			</div>
		</Card>
	);
}
