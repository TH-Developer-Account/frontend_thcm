// components/CppFields.tsx — thin react-hook-form wrappers over the shared
// form components, so each tab stays a short, declarative file.
//
// View mode: tab content rendered inside <CppReadOnlyProvider value> shows every
// field read-only. The wrappers switch the shared components into their own
// view mode (ReadOnlyField), so tabs never need a second, view-only layout.
// Every control in a CPP tab must go through these wrappers (or honour
// useCppReadOnly), so a raw input never stays editable for a viewer.
//
// Every wrapper renders inside a <FieldAnchor name>, a `display: contents` div
// carrying data-cpp-field. utils/cpp.steps.ts → focusField() uses it to scroll
// to and focus the first invalid field after "Next" or "Submit".
import {
	createContext,
	useContext,
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";

import Button from "../../../components/common/Button";
import Checkbox from "../../../components/forms/Checkbox";
import FormInput from "../../../components/forms/FormInput";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import Radio from "../../../components/forms/Radio";
import ReadOnlyField from "../../../components/forms/ReadOnlyField";
import SelectInput from "../../../components/forms/SelectInput";
import {
	amountInWords,
	cleanAmountInput,
	formatAmountText,
} from "../utils/cpp.amount";

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

/** Marks where a field is drawn, so a failed check can scroll to and focus it. */
export const FieldAnchor = ({
	name,
	children,
}: {
	name: string;
	children: ReactNode;
}) => (
	<div data-cpp-field={name} className="contents">
		{children}
	</div>
);

type RhfInputProps = Omit<
	ComponentProps<typeof FormInput>,
	"name" | "error"
> & {
	name: string;
	/** Table-cell mode: compact, the message sits right under the cell. */
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
		<FieldAnchor name={name}>
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
				error={readOnly ? undefined : message}
				className={[props.className, cell ? "cpp-cell-input" : ""]
					.filter(Boolean)
					.join(" ")}
			/>
		</FieldAnchor>
	);
};

type RhfAmountInputProps = Omit<
	RhfInputProps,
	"type" | "inputMode" | "value" | "onChange"
> & {
	/**
	 * Where the amount in words goes: "below" the field (default), as a
	 * "tooltip" (default for table cells), or "none" — use "none" for values that
	 * are not plain rupees (e.g. ₹ lakhs), where words would read wrong.
	 */
	words?: "below" | "tooltip" | "none";
};

/**
 * Money input. The form value is the raw number ("1250000.5") — that is what the
 * API gets. While typing the raw text is shown; on blur it shows Indian commas
 * ("12,50,000.5"). The amount in words sits under the field.
 */
export const RhfAmountInput = ({
	name,
	cell,
	words = cell ? "tooltip" : "below",
	...props
}: RhfAmountInputProps) => {
	const { control } = useFormContext();
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();
	const [focused, setFocused] = useState(false);

	return (
		<FieldAnchor name={name}>
			<Controller
				name={name}
				control={control}
				render={({ field }) => {
					const raw =
						field.value === null || field.value === undefined
							? ""
							: String(field.value);
					const inWords = words === "none" ? "" : amountInWords(raw);
					const helper = words === "below" && inWords ? inWords : undefined;
					const className = [
						props.className,
						cell ? "cpp-cell-input" : "",
						"tabular-nums",
					]
						.filter(Boolean)
						.join(" ");

					if (readOnly)
						return (
							<FormInput
								{...props}
								name={name}
								mode="view"
								value={formatAmountText(raw)}
								helperText={helper}
								isTooltip={false}
								className={className}
							/>
						);

					return (
						<FormInput
							{...props}
							ref={field.ref}
							name={name}
							inputMode="decimal"
							autoComplete="off"
							value={focused ? raw : formatAmountText(raw)}
							onFocus={() => setFocused(true)}
							onChange={(event) =>
								field.onChange(cleanAmountInput(event.target.value))
							}
							onBlur={() => {
								setFocused(false);
								field.onBlur();
							}}
							title={inWords || undefined}
							error={message}
							helperText={helper}
							isTooltip={false}
							className={className}
						/>
					);
				}}
			/>
		</FieldAnchor>
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
		<FieldAnchor name={name}>
			<Controller
				name={name}
				control={control}
				render={({ field }) => (
					<SelectInput
						{...props}
						name={name}
						inputId={name}
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
		</FieldAnchor>
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
		<FieldAnchor name={name}>
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
		</FieldAnchor>
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
		<FieldAnchor name={name}>
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
		</FieldAnchor>
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
		<FieldAnchor name={name}>
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
		</FieldAnchor>
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
	const message = useFieldError(name);
	const readOnly = useCppReadOnly();

	return (
		<FieldAnchor name={name}>
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
							{message ? (
								<p className="form-error-text" role="alert">
									{message}
								</p>
							) : null}
						</div>
					);
				}}
			/>
		</FieldAnchor>
	);
};
