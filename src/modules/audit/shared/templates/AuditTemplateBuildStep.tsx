// modules/audit/shared/templates/AuditTemplateBuildStep.tsx
import type { FormEventHandler } from "react";
import { Plus } from "lucide-react";
import {
	FormProvider,
	useFieldArray,
	type UseFormReturn,
} from "react-hook-form";

import Button from "../../../../components/common/Button";
import AuditTemplateSectionCard from "./AuditTemplateSectionCard";
import type {
	AuditTemplateLayout,
	AuditTemplatePhotoUploader,
} from "./audit-template.schemas";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";
import {
	createEmptySection,
	getArrayErrorMessage,
} from "./audit-template.utils";

type Props = {
	form: UseFormReturn<AuditTemplateBuildFormValues>;
	parameterFields: readonly AuditTemplateFieldConfig[];
	layout?: AuditTemplateLayout;
	onSubmit: FormEventHandler<HTMLFormElement>;
	disabled?: boolean;
	/** Turns on the optional "Reference image" field for each parameter. */
	onUploadReferencePhoto?: AuditTemplatePhotoUploader;
};

export default function AuditTemplateBuildStep({
	form,
	parameterFields,
	layout = "sections",
	onSubmit,
	disabled = false,
	onUploadReferencePhoto,
}: Props) {
	const { control, formState } = form;
	const isFlat = layout === "flat";

	const { fields, append, remove, move } = useFieldArray({
		control,
		name: "sections",
		keyName: "fieldKey",
	});

	const sectionsError = getArrayErrorMessage(formState.errors.sections);

	// Flat layout shows one continuous parameter list. The form model still
	// holds a single implicit section, so the mappers and payloads are
	// unchanged; any extra legacy sections are merged by the module mapper.
	const visibleFields = isFlat ? fields.slice(0, 1) : fields;

	return (
		<FormProvider {...form}>
			<form noValidate onSubmit={onSubmit} aria-label="Build checklist">
				<div className="space-y-4">
					{visibleFields.map((field, sectionIndex) => (
						<AuditTemplateSectionCard
							key={field.fieldKey}
							sectionIndex={sectionIndex}
							sectionCount={fields.length}
							parameterFields={parameterFields}
							layout={layout}
							disabled={disabled}
							onUploadReferencePhoto={onUploadReferencePhoto}
							onRemove={remove}
							onMove={move}
						/>
					))}

					{sectionsError ? (
						<p className="form-error-text" role="alert">
							{sectionsError}
						</p>
					) : null}

					{!isFlat ? (
						<Button
							text="Add another section"
							variant="outline"
							Icon={Plus}
							className="w-full border-dashed"
							disabled={disabled}
							onClick={() => append(createEmptySection(parameterFields))}
						/>
					) : null}
				</div>
			</form>
		</FormProvider>
	);
}
