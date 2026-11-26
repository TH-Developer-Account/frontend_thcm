// modules/audit/shared/templates/AuditTemplateSectionCard.tsx
//
// "sections" layout: a numbered, collapsible card with a required name.
// "flat" layout (Dealer): ONE Card whose collapsible sections are the
// parameters (Card's `sections` prop), with a search box in the header and
// "Add parameter" in the footer. No custom styles.
import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../../components/common/Button";
import Card, { type CardSection } from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import { SearchInput } from "../../../../components/forms/SearchInput";
import AuditTemplateParameterEditor from "./AuditTemplateParameterEditor";
import { SECTION_NAME_MAX_LENGTH } from "./audit-template.constants";
import type {
	AuditTemplateLayout,
	AuditTemplatePhotoUploader,
} from "./audit-template.schemas";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateFieldConfig,
	AuditTemplateParameterFormValues,
} from "./audit.template.types";
import {
	createClientId,
	createEmptyParameter,
	getArrayErrorMessage,
	getFieldOptionLabel,
	getParameterMaxScore,
} from "./audit-template.utils";

type Props = {
	sectionIndex: number;
	sectionCount: number;
	parameterFields: readonly AuditTemplateFieldConfig[];
	layout?: AuditTemplateLayout;
	disabled?: boolean;
	/** Turns on the optional "Reference image" field for each parameter. */
	onUploadReferencePhoto?: AuditTemplatePhotoUploader;
	onRemove: (index: number) => void;
	onMove: (fromIndex: number, toIndex: number) => void;
};

/** Search box appears once the list is long enough to need it. */
const SEARCH_MIN_PARAMETERS = 4;

/** Copy of a parameter that the server will treat as new. */
const cloneParameter = (
	parameter: AuditTemplateParameterFormValues,
): AuditTemplateParameterFormValues => ({
	...parameter,
	id: createClientId(),
	serverId: null,
	title: parameter.title.trim() ? `${parameter.title.trim()} (copy)` : "",
	attributes: { ...parameter.attributes },
	scoreLevels: parameter.scoreLevels.map((level) => ({
		...level,
		id: createClientId(),
	})),
});

export default function AuditTemplateSectionCard({
	sectionIndex,
	sectionCount,
	parameterFields,
	layout = "sections",
	disabled = false,
	onUploadReferencePhoto,
	onRemove,
	onMove,
}: Props) {
	const isFlat = layout === "flat";
	const [isExpanded, setIsExpanded] = useState(true);
	const [query, setQuery] = useState("");
	const {
		control,
		register,
		getValues,
		formState: { errors },
	} = useFormContext<AuditTemplateBuildFormValues>();

	const { fields, append, insert, remove, move } = useFieldArray({
		control,
		name: `sections.${sectionIndex}.parameters`,
		keyName: "fieldKey",
	});

	const sectionName = useWatch({
		control,
		name: `sections.${sectionIndex}.name`,
	});
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

	// ── Search (flat layout) ──
	// Rows stay mounted and are only hidden, so unsaved edits are never lost.
	const normalizedQuery = query.trim().toLowerCase();
	const matchesQuery = (index: number): boolean => {
		if (!normalizedQuery) return true;
		const parameter = parameters?.[index];
		if (!parameter) return true;
		const haystack = [
			parameter.title,
			parameter.guidance,
			...parameterFields.map((config) =>
				getFieldOptionLabel(config, parameter.attributes?.[config.key]),
			),
		]
			.join(" ")
			.toLowerCase();
		return haystack.includes(normalizedQuery);
	};
	const visibleCount = normalizedQuery
		? fields.filter((_, index) => matchesQuery(index)).length
		: fields.length;

	const handleDuplicate = (index: number) => {
		const source = getValues(`sections.${sectionIndex}.parameters.${index}`);
		if (!source) return;
		insert(index + 1, cloneParameter(source));
	};

	const parameterList = (
		<>
			<div className="mt-3 space-y-2.5">
				{fields.map((field, parameterIndex) => (
					<AuditTemplateParameterEditor
						key={field.fieldKey}
						sectionIndex={sectionIndex}
						parameterIndex={parameterIndex}
						parameterCount={fields.length}
						parameterFields={parameterFields}
						layout={layout}
						disabled={disabled}
						onUploadReferencePhoto={onUploadReferencePhoto}
						onMove={move}
						onRemove={remove}
						onDuplicate={handleDuplicate}
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
				onClick={() => {
					// Clear the search so the new row is visible straight away.
					setQuery("");
					append(createEmptyParameter(parameterFields));
				}}
			/>
		</>
	);

	// ── Flat layout ──
	if (isFlat) {
		const cardSections: CardSection[] = fields.flatMap((field, index) => {
			if (!matchesQuery(index)) return [];

			const parameter = parameters?.[index];
			const title = parameter?.title?.trim();
			const meta = parameterFields
				.map((config) =>
					getFieldOptionLabel(config, parameter?.attributes?.[config.key]),
				)
				.filter(Boolean);
			const parameterPoints = parameter ? getParameterMaxScore(parameter) : 0;
			const label = `Parameter ${index + 1}`;

			return [
				{
					// fieldKey is stable per row, so open/closed state survives reorders.
					id: field.fieldKey,
					title: `${index + 1}. ${title || "Untitled parameter"}`,
					subtitle: (
						<>
							{[...meta, `${parameterPoints} pts`].join(" · ")}
							{sectionErrors?.parameters?.[index] ? (
								<span className="ml-2 font-semibold text-(--color-error)">
									· Needs attention
								</span>
							) : null}
						</>
					),
					actions: (
						<div className="flex items-center gap-1">
							{/* <Button
								appearance="icon"
								variant="transparent"
								size="sm"
								Icon={ChevronUp}
								aria-label={`Move ${label} up`}
								disabled={disabled || index === 0}
								onClick={() => move(index, index - 1)}
							/>
							<Button
								appearance="icon"
								variant="transparent"
								size="sm"
								Icon={ChevronDown}
								aria-label={`Move ${label} down`}
								disabled={disabled || index === fields.length - 1}
								onClick={() => move(index, index + 1)}
							/> */}
							<Button
								appearance="icon"
								variant="transparent"
								size="sm"
								Icon={Copy}
								aria-label={`Duplicate ${label}`}
								disabled={disabled}
								onClick={() => handleDuplicate(index)}
							/>
							<Button
								appearance="icon"
								variant="transparent"
								size="sm"
								Icon={Trash2}
								aria-label={`Delete ${label}`}
								disabled={disabled}
								onClick={() => remove(index)}
							/>
						</div>
					),
					children: (
						<AuditTemplateParameterEditor
							sectionIndex={sectionIndex}
							parameterIndex={index}
							parameterCount={fields.length}
							parameterFields={parameterFields}
							layout={layout}
							bare
							disabled={disabled}
							onUploadReferencePhoto={onUploadReferencePhoto}
							onMove={move}
							onRemove={remove}
							onDuplicate={handleDuplicate}
						/>
					),
				},
			];
		});

		return (
			// The builder step already sits inside a card, so this one is "flat"
			// (no border or shadow of its own); only the parameter sections show.
			<Card
				variant="flat"
				padding="none"
				aria-label="Checklist parameters"
				title={`${fields.length} parameter${fields.length === 1 ? "" : "s"} · ${points} pts`}
				subtitle={
					normalizedQuery
						? `Showing ${visibleCount} of ${fields.length}`
						: undefined
				}
				actions={
					fields.length >= SEARCH_MIN_PARAMETERS ? (
						<SearchInput
							value={query}
							onChange={setQuery}
							placeholder="Search parameters, function or category"
							containerClassName="min-w-0 w-full sm:w-80"
						/>
					) : null
				}
				sections={cardSections}
				footer={
					<>
						{parametersError ? (
							<p className="form-error-text mb-2" role="alert">
								{parametersError}
							</p>
						) : null}
						<Button
							text="Add parameter"
							variant="outline"
							size="sm"
							Icon={Plus}
							className="w-full border-dashed"
							disabled={disabled}
							onClick={() => {
								// Clear the search so the new row is visible straight away.
								setQuery("");
								append(createEmptyParameter(parameterFields));
							}}
						/>
					</>
				}
			>
				{/* Shown only when there are no sections to render. */}
				<p className="text-body-sm text-(--color-text-secondary)">
					{normalizedQuery
						? `No parameters match “${query.trim()}”.`
						: "No parameters yet. Add the first one below."}
				</p>
			</Card>
		);
	}

	// ── Sections layout ──
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
						{fields.length} parameter{fields.length === 1 ? "" : "s"} · {points}{" "}
						pts
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
				{parameterList}
			</div>
		</Card>
	);
}
