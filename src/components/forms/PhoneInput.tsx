import {
	forwardRef,
	useId,
	type ChangeEvent,
	type FocusEvent,
	type InputHTMLAttributes,
	type ReactNode,
	type Ref,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { ChevronDown, CircleCheck } from "lucide-react";

import HelperTooltip from "../common/HelperTooltip";
import ReadOnlyField from "./ReadOnlyField";

export type PhoneCountryOption = {
	/** Value stored in the form, e.g. "+91". */
	code: string;
	/** Text shown in the dropdown list, e.g. "India (+91)". */
	label: string;
	/** Text shown in the attached segment. Defaults to `code`. */
	shortLabel?: string;
};

/**
 * Props for the country-code <select>. Structurally matches the object
 * returned by react-hook-form's register(), so
 * countryCodeProps={register("countryCode")} works, and so does a plain
 * controlled { value, onChange } pair.
 */
export type PhoneCountryControlProps = {
	name?: string;
	value?: string;
	ref?: Ref<HTMLSelectElement>;
	onChange?: (event: ChangeEvent<HTMLSelectElement>) => unknown;
	onBlur?: (event: FocusEvent<HTMLSelectElement>) => unknown;
};

export type PhoneInputProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "value"
> & {
	label?: string;
	mode?: "edit" | "view";
	/** National number only, without the country code. */
	value?: string | null;
	error?: string;
	success?: boolean;
	helperText?: string;
	/** true: helper text shows in a tooltip. false: it shows under the field. */
	isTooltip?: boolean;
	/** View mode: overrides the default "<code> <number>" text. */
	readOnlyValue?: ReactNode;
	emptyReadOnlyValue?: ReactNode;

	countryCodes: readonly PhoneCountryOption[];
	/** Selected code, used to render the attached segment. */
	countryCodeValue?: string;
	countryCodeProps?: PhoneCountryControlProps;
	countryCodeLabel?: string;
	countryCodeDisabled?: boolean;
};

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
	(
		{
			id,
			name,
			label,
			mode = "edit",
			value,
			error,
			success,
			helperText,
			isTooltip = true,
			required = false,
			disabled = false,
			readOnly,
			placeholder,
			/* Applied to the outer wrapper (layout), not to the <input>. */
			className = "",
			readOnlyValue,
			emptyReadOnlyValue = "--",
			countryCodes,
			countryCodeValue,
			countryCodeProps,
			countryCodeLabel = "Country code",
			countryCodeDisabled = false,
			...nativeInputProps
		},
		ref,
	) => {
		const generatedId = useId();

		const inputId = id ?? name ?? `phone-input-${generatedId}`;
		const errorId = `${inputId}-error`;
		const helperId = `${inputId}-helper`;

		const isViewMode = mode === "view";
		const resolvedSuccess = Boolean(success) && !error;

		const selectedCode =
			countryCodeValue ??
			countryCodeProps?.value ??
			countryCodes[0]?.code ??
			"";
		const selectedOption = countryCodes.find(
			(option) => option.code === selectedCode,
		);
		const prefixText =
			selectedOption?.shortLabel ?? selectedOption?.code ?? selectedCode;

		// With a single country there is nothing to choose.
		const isCountryFixed = countryCodes.length < 2;

		const describedBy = [
			error ? errorId : undefined,
			helperText && !isTooltip ? helperId : undefined,
		]
			.filter(Boolean)
			.join(" ");

		if (isViewMode) {
			return (
				<ReadOnlyField
					label={label}
					value={
						readOnlyValue ?? (value ? `${prefixText} ${value}` : undefined)
					}
					required={required}
					helperText={helperText}
					isTooltip={isTooltip}
					emptyValue={emptyReadOnlyValue}
					className={className}
				/>
			);
		}

		return (
			<div
				className={joinClassNames(
					"form-field",
					"phone-input",
					disabled && "is-disabled",
					className,
				)}
			>
				{label ? (
					<div className="form-label-row">
						<label htmlFor={inputId} className="form-label">
							{label}

							{required ? (
								<span className="form-required" aria-hidden="true">
									*
								</span>
							) : null}
						</label>

						{helperText && isTooltip && !error ? (
							<HelperTooltip label={label} text={helperText} />
						) : null}
					</div>
				) : null}

				<div
					className={joinClassNames(
						"phone-input-group",
						error && "has-error",
						resolvedSuccess && "is-valid",
						disabled && "is-disabled",
					)}
				>
					{/* Attached country-code segment */}
					<div
						className={joinClassNames(
							"phone-input-prefix",
							isCountryFixed && "is-fixed",
						)}
					>
						<span className="phone-input-prefix-text" aria-hidden="true">
							{prefixText}
						</span>

						{!isCountryFixed ? (
							<ChevronDown
								aria-hidden="true"
								className="phone-input-prefix-chevron"
							/>
						) : null}

						{/* The real control: invisible, laid over the segment. */}
						<select
							aria-label={countryCodeLabel}
							className="phone-input-select"
							{...countryCodeProps}
							disabled={disabled || countryCodeDisabled}
						>
							{countryCodes.map((option) => (
								<option key={option.code} value={option.code}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<input
						inputMode="tel"
						autoComplete="tel-national"
						{...nativeInputProps}
						ref={ref}
						id={inputId}
						name={name}
						type="tel"
						// Same rule as FormInput: stay uncontrolled when no `value`
						// is passed (react-hook-form manages it through `ref`).
						value={value === undefined ? undefined : (value ?? "")}
						required={required}
						disabled={disabled}
						readOnly={readOnly}
						placeholder={placeholder}
						aria-invalid={error ? "true" : undefined}
						aria-describedby={describedBy || undefined}
						className="phone-input-field"
					/>

					{resolvedSuccess ? (
						<CircleCheck aria-hidden="true" className="form-success-icon" />
					) : null}
				</div>

				{error ? (
					<p
						id={errorId}
						className="form-error-text phone-input-error-text"
						role="alert"
					>
						<ExclamationCircleIcon
							aria-hidden="true"
							className="phone-input-error-icon"
						/>
						<span>{error}</span>
					</p>
				) : helperText && !isTooltip ? (
					<p id={helperId} className="form-helper-text">
						{helperText}
					</p>
				) : null}
			</div>
		);
	},
);

PhoneInput.displayName = "PhoneInput";

export default PhoneInput;
