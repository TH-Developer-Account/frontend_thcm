// modules/audit/shared/templates/AuditTemplateBuildStep.tsx
import type { FormEventHandler } from "react";
import { Plus } from "lucide-react";
import {
	FormProvider,
	useFieldArray,
	useWatch,
	type UseFormReturn,
} from "react-hook-form";

import Button from "../../../../components/common/Button";
import AuditTemplateSectionCard from "./AuditTemplateSectionCard";
import AuditTemplateSummaryPanel from "./AuditTemplateSummaryPanel";
import type {
	AuditTemplateBuildFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";
import {
	createEmptySection,
	deriveTemplateSummary,
	getArrayErrorMessage,
} from "./audit-template.utils";

type Props = {
	form: UseFormReturn<AuditTemplateBuildFormValues>;
	parameterFields: readonly AuditTemplateFieldConfig[];
	onSubmit: FormEventHandler<HTMLFormElement>;
	disabled?: boolean;
};

export default function AuditTemplateBuildStep({
	form,
	parameterFields,
	onSubmit,
	disabled = false,
}: Props) {
	const { control, formState } = form;

	const { fields, append, remove, move } = useFieldArray({
		control,
		name: "sections",
		keyName: "fieldKey",
	});

	// Watched (not copied into state) so the outline stays derived.
	const sections = useWatch({ control, name: "sections" }) ?? [];
	const summary = deriveTemplateSummary(sections);
	const sectionsError = getArrayErrorMessage(formState.errors.sections);

	return (
		<FormProvider {...form}>
			<form noValidate onSubmit={onSubmit} aria-label="Build checklist">
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
					<div className="space-y-4">
						{fields.map((field, sectionIndex) => (
							<AuditTemplateSectionCard
								key={field.fieldKey}
								sectionIndex={sectionIndex}
								sectionCount={fields.length}
								parameterFields={parameterFields}
								disabled={disabled}
								onRemove={remove}
								onMove={move}
							/>
						))}

						{sectionsError ? (
							<p className="form-error-text" role="alert">
								{sectionsError}
							</p>
						) : null}

						<Button
							text="Add another section"
							variant="outline"
							Icon={Plus}
							className="w-full border-dashed"
							disabled={disabled}
							onClick={() => append(createEmptySection(parameterFields))}
						/>
					</div>

					<div className="hidden lg:block">
						<AuditTemplateSummaryPanel summary={summary} sticky />
					</div>
				</div>
			</form>
		</FormProvider>
	);
}
