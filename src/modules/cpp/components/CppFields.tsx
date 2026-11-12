// components/CppFields.tsx — thin react-hook-form wrappers over the shared
// form components, so each tab stays a short, declarative file.
import type { ComponentProps } from "react";
import { Controller, get, useFormContext } from "react-hook-form";

import Button from "../../../components/common/Button";
import FormInput from "../../../components/forms/FormInput";
import SelectInput from "../../../components/forms/SelectInput";

export const useFieldError = (name: string): string | undefined => {
	const {
		formState: { errors },
	} = useFormContext();
	const error = get(errors, name) as { message?: string } | undefined;
	return error?.message;
};

type RhfInputProps = Omit<ComponentProps<typeof FormInput>, "name" | "error"> & {
	name: string;
	/** Table-cell mode: red border only, no message line under the input. */
	cell?: boolean;
};

export const RhfInput = ({ name, cell, ...props }: RhfInputProps) => {
	const { register } = useFormContext();
	const message = useFieldError(name);

	return (
		<FormInput
			{...props}
			// type="date" defaults min to today in FormInput; CPP needs past dates too.
			{...(props.type === "date" ? { min: props.min ?? "" } : {})}
			{...register(name)}
			error={cell ? undefined : message}
			className={[props.className, cell && message ? "form-input-error" : ""]
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

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => (
				<SelectInput
					{...props}
					name={name}
					options={options}
					value={options.find((option) => option.value === field.value) ?? null}
					onChange={(option: Option | null) => field.onChange(option?.value ?? "")}
					error={message}
				/>
			)}
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
export const RhfChips = ({ name, options, disabled, label, required }: RhfChipsProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);

	return (
		<Controller
			name={name}
			control={control}
			render={({ field }) => {
				const selected: string[] = field.value ?? [];
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
