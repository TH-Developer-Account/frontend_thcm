// modules/audit/shared/templates/AuditTemplateConfiguredField.tsx
//
// Renders one module-declared field (select / text) bound to the
// surrounding react-hook-form. Used by the details step (template-level
// fields) and the parameter editor (parameter-level fields), so adding a
// "category" or "severity" dropdown is a config change, not a code change.

import { Controller, useFormContext } from "react-hook-form";

import FormInput from "../../../../components/forms/FormInput";
import SelectInput from "../../../../components/forms/SelectInput";
import type {
	AuditTemplateFieldConfig,
	AuditTemplateFieldOption,
} from "./audit.template.types";

type Props = {
	config: AuditTemplateFieldConfig;
	/** Full RHF path, e.g. `fields.facilityType` or `sections.0.parameters.2.attributes.category`. */
	name: string;
	error?: string;
	disabled?: boolean;
	/** Makes ids unique when the same config renders in many parameters. */
	idPrefix?: string;
};

export default function AuditTemplateConfiguredField({
	config,
	name,
	error,
	disabled = false,
	idPrefix = "",
}: Props) {
	const { control, register } = useFormContext();
	const inputId = `${idPrefix}${name}`.replace(/\./g, "-");

	if (config.type === "text") {
		return (
			<FormInput
				id={inputId}
				label={config.label}
				required={config.required}
				placeholder={config.placeholder}
				helperText={config.helperText}
				maxLength={config.maxLength}
				disabled={disabled}
				error={error}
				{...register(name)}
			/>
		);
	}

	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => {
				const selected =
					config.options.find((option) => option.value === field.value) ??
					null;

				return (
					<SelectInput<AuditTemplateFieldOption>
						inputId={inputId}
						name={field.name}
						label={config.label}
						required={config.required}
						helperText={config.helperText}
						placeholder={config.placeholder ?? `Select ${config.label.toLowerCase()}`}
						options={config.options}
						value={selected}
						isClearable={!config.required}
						isDisabled={disabled}
						error={error}
						onBlur={field.onBlur}
						onChange={(option) => field.onChange(option?.value ?? "")}
					/>
				);
			}}
		/>
	);
}
