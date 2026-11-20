// components/CppFields.tsx — thin react-hook-form wrappers over the shared
// form components, so each tab stays a short, declarative file.
//
// View mode: tab content rendered inside <CppReadOnlyProvider value> shows every
// field read-only. The wrappers switch the shared components into their own
// view mode (ReadOnlyField), so tabs never need a second, view-only layout.
import { createContext, useContext, type ComponentProps } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
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

/** "2026-11-20" -> "20 Nov 2026" for view mode. Anything else returns undefined. */
const formatViewDate = (value: unknown): string | undefined => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return undefined;
	return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

export const RhfInput = ({ name, cell, ...props }: RhfInputProps) => {
	const { register, control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();
	// View mode has no registered DOM input to read from, so watch the saved value.
	const current = useWatch({ control, name });

	return (
		<FormInput
			{...props}
			mode={readOnly ? "view" : props.mode}
			value={readOnly ? current : undefined}
			readOnlyValue={
				readOnly && props.type === "date"
					? formatViewDate(current)
					: props.readOnlyValue
			}
			// type="date" defaults min to today in FormInput; CPP needs past dates too.
			{...(props.type === "date" ? { min: props.min ?? "" } : {})}
			{...register(name)}
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
	/** Applied to the wrapper, so the field can span grid columns. */
	className?: string;
	/** Small text under the field: what the choice affects. Hidden in view mode and while an error shows. */
	helperText?: string;
};

export const RhfSelect = ({
	name,
	options,
	helperText,
	className,
	...props
}: RhfSelectProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<div className={className}>
			<Controller
				name={name}
				control={control}
				render={({ field }) => (
					<SelectInput
						{...props}
						name={name}
						mode={readOnly ? "view" : "edit"}
						options={options}
						value={
							options.find((option) => option.value === field.value) ?? null
						}
						onChange={(option: Option | null) =>
							field.onChange(option?.value ?? "")
						}
						error={readOnly ? undefined : message}
					/>
				)}
			/>
			{helperText && !readOnly && !message ? (
				<p className="form-helper-text">{helperText}</p>
			) : null}
		</div>
	);
};

type RhfMultiSelectProps = {
	name: string;
	label?: string;
	options: Option[];
	required?: boolean;
	placeholder?: string;
	isDisabled?: boolean;
	/** Applied to the wrapper, so the field can span grid columns. */
	className?: string;
	/** Small text under the field. Hidden in view mode and while an error shows. */
	helperText?: string;
};

/** Multi-select dropdown. Form value is string[] (the option values). */
export const RhfMultiSelect = ({
	name,
	options,
	helperText,
	className,
	...props
}: RhfMultiSelectProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<div className={className}>
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
							value={options.filter((option) =>
								selected.includes(option.value),
							)}
							onValueChange={({ value }) =>
								field.onChange(value.map((option) => String(option.value)))
							}
							error={message}
						/>
					);
				}}
			/>
			{helperText && !readOnly && !message ? (
				<p className="form-helper-text">{helperText}</p>
			) : null}
		</div>
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
