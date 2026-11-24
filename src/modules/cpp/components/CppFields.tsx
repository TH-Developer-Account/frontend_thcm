// components/CppFields.tsx — thin react-hook-form wrappers over the shared
// form components, so each tab stays a short, declarative file.
//
// View mode: tab content rendered inside <CppReadOnlyProvider value> shows every
// field read-only. The wrappers switch the shared components into their own
// view mode (ReadOnlyField), so tabs never need a second, view-only layout.
// Every control in a CPP tab must go through these wrappers (or honour
// useCppReadOnly), so a raw input never stays editable for a viewer.
import { createContext, useContext, type ComponentProps } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import Radio from "../../../components/forms/Radio";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import SelectInput from "../../../components/forms/SelectInput";

const CppReadOnlyContext = createContext(false);

/** Wrap tab content in this to show every CPP field read-only. */
export const CppReadOnlyProvider = CppReadOnlyContext.Provider;

/** True inside a <CppReadOnlyProvider value> (view mode). */
export const useCppReadOnly = (): boolean => useContext(CppReadOnlyContext);

export const useFieldError = (name: string): string | undefined => {
	const {
		formState: { errors },
	} = useFormContext();
	const error = get(errors, name) as { message?: string } | undefined;
	return error?.message;
};

type RhfInputProps = Omit<
	ComponentProps<typeof FormInput>,
	"name" | "error"
> & {
	name: string;
	/** Table-cell mode: red border only, no message line under the input. */
	cell?: boolean;
};

export const RhfInput = ({ name, cell, ...props }: RhfInputProps) => {
	const { register, control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();
	// View mode renders no real <input>, so register()'s ref never receives the
	// value. Read it here and pass it explicitly (same pattern as the vendor
	// onboarding form). Edit mode keeps register() so typing stays uncontrolled.
	const current = useWatch({ control, name });

	return (
		<FormInput
			{...props}
			mode={readOnly ? "view" : props.mode}
			// type="date" defaults min to today in FormInput; CPP needs past dates too.
			{...(props.type === "date" ? { min: props.min ?? "" } : {})}
			{...(readOnly
				? {
						value:
							current === null || current === undefined ? "" : String(current),
					}
				: register(name))}
			error={readOnly || cell ? undefined : message}
			className={[
				props.className,
				cell && message && !readOnly ? "form-input-error" : "",
			]
				.filter(Boolean)
				.join(" ")}
		/>
	);
};

type Option = { label: string; value: string };

export const toOptions = (values: string[]): Option[] =>
	values.map((value) => ({ label: value, value }));

type RhfSelectProps = {
	name: string;
	label?: string;
	options: Option[];
	required?: boolean;
	placeholder?: string;
	isDisabled?: boolean;
	className?: string;
};

export const RhfSelect = ({ name, options, ...props }: RhfSelectProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => (
				<SelectInput
					{...props}
					name={name}
					mode={readOnly ? "view" : "edit"}
					options={options}
					value={options.find((option) => option.value === field.value) ?? null}
					onChange={(option: Option | null) =>
						field.onChange(option?.value ?? "")
					}
					error={readOnly ? undefined : message}
				/>
			)}
		/>
	);
};

type RhfMultiSelectProps = {
	name: string;
	label?: string;
	options: Option[];
	required?: boolean;
	placeholder?: string;
	isDisabled?: boolean;
	className?: string;
};

/** Multi-select dropdown. Form value is string[] (the option values). */
export const RhfMultiSelect = ({
	name,
	options,
	...props
}: RhfMultiSelectProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const selected: string[] = field.value ?? [];

				if (readOnly) {
					return (
						<ReadOnlyField
							label={props.label}
							required={props.required}
							className={props.className}
							value={options
								.filter((option) => selected.includes(option.value))
								.map((option) => option.label)
								.join(", ")}
						/>
					);
				}

				return (
					<MultiSelectInput
						{...props}
						name={name}
						options={options}
						value={options.filter((option) => selected.includes(option.value))}
						onValueChange={({ value }) =>
							field.onChange(value.map((option) => String(option.value)))
						}
						error={message}
					/>
				);
			}}
		/>
	);
};

type RhfChipsProps = {
	name: string;
	options: string[];
	disabled?: boolean;
	label?: string;
	required?: boolean;
};

/** Multi-pick toggle buttons (models, plants, effects). Value is string[]. */
export const RhfChips = ({
	name,
	options,
	disabled,
	label,
	required,
}: RhfChipsProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const selected: string[] = field.value ?? [];

				if (readOnly) {
					return (
						<ReadOnlyField
							label={label}
							required={required}
							value={selected.join(", ")}
						/>
					);
				}

				return (
					<div className="form-field">
						{label ? (
							<div className="form-label-row">
								<span className="form-label">
									{label}
									{required ? <span className="form-required"> *</span> : null}
								</span>
							</div>
						) : null}
						<div className="flex flex-wrap gap-2">
							{options.map((option) => {
								const active = selected.includes(option);
								return (
									<Button
										key={option}
										type="button"
										text={option}
										size="sm"
										appearance="toggle"
										active={active}
										disabled={disabled}
										onClick={() =>
											field.onChange(
												active
													? selected.filter((item) => item !== option)
													: [...selected, option],
											)
										}
									/>
								);
							})}
						</div>
						{message ? (
							<p className="form-error-text" role="alert">
								{message}
							</p>
						) : null}
					</div>
				);
			}}
		/>
	);
};

type RhfRadioProps = {
	name: string;
	groupLabel?: string;
	options: Option[];
	required?: boolean;
};

/** Single-pick radio group. Shows the chosen label only in view mode. */
export const RhfRadio = ({
	name,
	groupLabel,
	options,
	required,
}: RhfRadioProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) =>
				readOnly ? (
					<ReadOnlyField
						label={groupLabel}
						required={required}
						value={
							options.find((option) => option.value === field.value)?.label
						}
					/>
				) : (
					<Radio
						name={name}
						groupLabel={groupLabel}
						required={required}
						options={options}
						selectedValue={field.value}
						onChange={field.onChange}
						error={message}
					/>
				)
			}
		/>
	);
};

type RhfCheckGroupProps = {
	name: string;
	label?: string;
	options: readonly string[];
	disabled?: boolean;
};

/** Multi-pick checkboxes. Shows the picked values only in view mode. */
export const RhfCheckGroup = ({
	name,
	label,
	options,
	disabled,
}: RhfCheckGroupProps) => {
	const { control } = useFormContext();
	const readOnly = useCppReadOnly();

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const selected: string[] = field.value ?? [];

				if (readOnly) {
					return <ReadOnlyField label={label} value={selected.join(", ")} />;
				}

				return (
					<div className="flex flex-col gap-2">
						{label ? <span className="form-label">{label}</span> : null}
						<div className="flex flex-row flex-wrap items-center gap-x-8 gap-y-2">
							{options.map((option) => (
								<div key={option} className="w-auto shrink-0">
									<Checkbox
										label={option}
										disabled={disabled}
										checked={selected.includes(option)}
										onChange={(checked) =>
											field.onChange(
												checked
													? [...selected, option]
													: selected.filter((item) => item !== option),
											)
										}
									/>
								</div>
							))}
						</div>
					</div>
				);
			}}
		/>
	);
};
