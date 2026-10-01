// modules/audit/shared/templates/AuditTemplateDetailsStep.tsx
import type { FormEventHandler } from "react";
import { FormProvider, type UseFormReturn } from "react-hook-form";

import Card from "../../../../components/common/Card";
import FormInput from "../../../../components/forms/FormInput";
import TextareaInput from "../../../../components/forms/TextareaInput";
import AuditTemplateConfiguredField from "./AuditTemplateConfiguredField";
import {
	TEMPLATE_DESCRIPTION_MAX_LENGTH,
	TEMPLATE_NAME_MAX_LENGTH,
} from "./audit-template.constants";
import type {
	AuditTemplateDetailsFormValues,
	AuditTemplateFieldConfig,
} from "./audit.template.types";

type Props = {
	form: UseFormReturn<AuditTemplateDetailsFormValues>;
	/** Module-specific fields (facility type, category, plant …). */
	detailFields: readonly AuditTemplateFieldConfig[];
	namePlaceholder?: string;
	onSubmit: FormEventHandler<HTMLFormElement>;
	disabled?: boolean;
};

export default function AuditTemplateDetailsStep({
	form,
	detailFields,
	namePlaceholder = "e.g. Dealer Facility Audit — FY 2026-27",
	onSubmit,
	disabled = false,
}: Props) {
	const {
		register,
		formState: { errors },
	} = form;

	return (
		<FormProvider {...form}>
			<form noValidate onSubmit={onSubmit} aria-labelledby="template-details-title">
				<Card variant="outlined" padding="default">
					<h2
						id="template-details-title"
						className="text-base font-semibold text-(--color-text-primary)"
					>
						Audit template details
					</h2>
					<p className="mt-1 text-body-sm text-(--color-text-secondary)">
						Give reviewers enough context to choose the right template.
					</p>

					<div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<FormInput
								id="template-name"
								label="Template name"
								required
								placeholder={namePlaceholder}
								maxLength={TEMPLATE_NAME_MAX_LENGTH}
								disabled={disabled}
								error={errors.name?.message}
								{...register("name")}
							/>
						</div>

						{detailFields.map((config) => (
							<div
								key={config.key}
								className={config.span === 2 ? "sm:col-span-2" : undefined}
							>
								<AuditTemplateConfiguredField
									config={config}
									name={`fields.${config.key}`}
									disabled={disabled}
									error={errors.fields?.[config.key]?.message}
								/>
							</div>
						))}

						<div className="sm:col-span-2">
							<TextareaInput
								id="template-description"
								label="Description"
								placeholder="What this template evaluates and where it applies."
								rows={3}
								maxLength={TEMPLATE_DESCRIPTION_MAX_LENGTH}
								disabled={disabled}
								error={errors.description?.message}
								{...register("description")}
							/>
						</div>
					</div>
				</Card>
			</form>
		</FormProvider>
	);
}
