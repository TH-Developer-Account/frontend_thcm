import {
	forwardRef,
	useId,
	useState,
	type FocusEvent,
	type InputHTMLAttributes,
	type ReactNode,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { CircleCheck } from "lucide-react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import HelperTooltip from "../common/HelperTooltip";
import type { InputProps } from "./input.types";
import ReadOnlyField from "./ReadOnlyField";
import { validateFormValue } from "../../utils/form.validation";

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

const getTodayDate = (): string => {
	const now = new Date();
	const timezoneOffset = now.getTimezoneOffset() * 60_000;

	return new Date(now.getTime() - timezoneOffset).toISOString().split("T")[0];
};

const getDefaultReadOnlyValue = ({
	type,
	value,
}: {
	type: InputHTMLAttributes<HTMLInputElement>["type"];
	value: InputHTMLAttributes<HTMLInputElement>["value"];
}): ReactNode => {
	if (
		value === undefined ||
		value === null ||
		value === "" ||
		(Array.isArray(value) && value.length === 0)
	) {
		return undefined;
	}

	if (type === "password") {
		return "••••••••";
	}

	if (Array.isArray(value)) {
		return value.join(", ");
	}

	return String(value);
};

const FormInput = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			id,
			label,
			name,
			type = "text",
			error,
			value,
			required = false,
			className = "",
			disabled = false,
			helperText,
			placeholder,
			isTooltip = true,
			min,
			mode = "edit",
			success,
			invalidRadio,
			readOnlyValue,
			emptyReadOnlyValue = "--",
			validation,
			inputPrefix,
			onBlur,
			onChange,
			...nativeInputProps
		},
		ref,
	) => {
		const generatedId = useId();

		const [showPassword, setShowPassword] = useState(false);
		const [validationError, setValidationError] = useState("");

		const inputId = id ?? name ?? `form-input-${generatedId}`;
		const errorId = `${inputId}-error`;
		const helperId = `${inputId}-helper`;

		const isViewMode = mode === "view";
		const isPassword = type === "password";
		const isRadio = type === "radio";

		const resolvedInputType = isPassword && showPassword ? "text" : type;

		/*
		 * External form/controller errors take priority.
		 * Otherwise use FormInput's common validation error.
		 */
		const resolvedError = error || validationError;

		const resolvedSuccess = success && !resolvedError;

		const describedBy = [
			resolvedError ? errorId : undefined,
			helperText && !isTooltip ? helperId : undefined,
		]
			.filter(Boolean)
			.join(" ");

		const resolvedMin = type === "date" ? (min ?? getTodayDate()) : min;

		const togglePasswordVisibility = () => {
			setShowPassword((previous) => !previous);
		};

		const runValidation = (nextValue: unknown): string => {
			if (!validation?.length) {
				setValidationError("");
				return "";
			}

			const nextError = validateFormValue(nextValue, validation);

			setValidationError(nextError);

			return nextError;
		};

		const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
			/*
			 * If this field has already produced a local validation
			 * error, revalidate while the user corrects it.
			 *
			 * Otherwise validation waits until blur so we don't show
			 * "invalid email" immediately after the first character.
			 */
			if (validationError) {
				runValidation(event.target.value);
			}

			onChange?.(event);
		};

		const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
			runValidation(event.target.value);
			onBlur?.(event);
		};

		if (isViewMode) {
			return (
				<ReadOnlyField
					label={label}
					value={
						readOnlyValue ??
						getDefaultReadOnlyValue({
							type,
							value,
						})
					}
					required={required}
					helperText={helperText}
					isTooltip={isTooltip}
					emptyValue={emptyReadOnlyValue}
					className={className}
				/>
			);
		}

		if (isRadio) {
			return (
				<div
					className={joinClassNames(
						"form-radio-group-item",
						disabled && "is-disabled",
					)}
				>
					<label htmlFor={inputId} className="form-radio-field">
						<input
							{...nativeInputProps}
							ref={ref}
							id={inputId}
							name={name}
							type="radio"
							value={value}
							disabled={disabled}
							required={required}
							onChange={handleChange}
							onBlur={handleBlur}
							aria-invalid={resolvedError ? "true" : undefined}
							aria-describedby={resolvedError ? errorId : undefined}
							className={joinClassNames(
								"form-radio-input",
								invalidRadio && "form-radio-input-error",
							)}
						/>

						{label ? (
							<span className="form-radio-label">
								{label}

								{required ? (
									<span className="form-required" aria-hidden="true">
										*
									</span>
								) : null}
							</span>
						) : null}
					</label>

					{resolvedError ? (
						<p id={errorId} className="form-error-text" role="alert">
							{resolvedError}
						</p>
					) : null}
				</div>
			);
		}

		return (
			<div
				className={joinClassNames(
					"form-field",
					disabled && "is-disabled",
					resolvedError && "has-error",
					resolvedSuccess && "is-valid",
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

						{helperText && isTooltip && !resolvedError ? (
							<HelperTooltip label={label} text={helperText} />
						) : null}
					</div>
				) : null}

				<div
					className={joinClassNames(
						"form-input-wrapper",
						isPassword && "has-password-toggle",
						(resolvedError || resolvedSuccess) && "has-status-icon",
						inputPrefix ? "has-prefix" : null,
					)}
				>
					{inputPrefix ? (
						<span className="form-input-prefix" aria-hidden="true">
							{inputPrefix}
						</span>
					) : null}

					<input
						{...nativeInputProps}
						ref={ref}
						id={inputId}
						name={name}
						type={resolvedInputType}
						// Password managers (Chrome/Edge/LastPass/1Password/Bitwarden)
						// draw their own icon inside recognised password fields;
						// these attributes ask them to skip it so it doesn't stack
						// on top of our own show/hide toggle. Harmless no-ops on
						// non-password fields and on managers that ignore them.
						{...(isPassword
							? {
									"data-lpignore": "true",
									"data-1p-ignore": "true",
									"data-bwignore": "true",
									"data-form-type": "other",
								}
							: null)}
						// Only force a controlled "" fallback when the caller actually
						// passed a `value` (the manual-state pattern used elsewhere in
						// this app, e.g. VendorCreationFormOne). When no `value` prop is
						// given at all — as with `{...register("field")}` from React
						// Hook Form, which manages the DOM value via `ref` instead —
						// stay uncontrolled. Forcing value={value ?? ""} here pins
						// every RHF-registered input to a permanent controlled "",
						// so typed characters get reset on every render and the
						// field appears to reject all input. (This exact regression
						// has now reappeared twice — if this file is regenerated
						// from an older copy again, check this line first.)
						value={value === undefined ? undefined : (value ?? "")}
						required={required}
						disabled={disabled}
						min={resolvedMin}
						placeholder={placeholder}
						onChange={handleChange}
						onBlur={handleBlur}
						aria-invalid={resolvedError ? "true" : undefined}
						aria-describedby={describedBy || undefined}
						className={joinClassNames(
							"form-input",
							(resolvedError || resolvedSuccess || isPassword) &&
								"form-input-with-icon",
							isPassword &&
								(resolvedError || resolvedSuccess) &&
								"form-input-with-status-and-toggle",
							resolvedError && "form-input-error",
							resolvedSuccess && "form-input-success",
							disabled && "form-input-disabled",
							className,
						)}
					/>

					{resolvedError ? (
						<ExclamationCircleIcon
							aria-hidden="true"
							className="form-error-icon"
						/>
					) : resolvedSuccess ? (
						<CircleCheck aria-hidden="true" className="form-success-icon" />
					) : null}

					{isPassword ? (
						<button
							type="button"
							className="form-icon-right"
							onClick={togglePasswordVisibility}
							disabled={disabled}
							aria-label={showPassword ? "Hide password" : "Show password"}
							aria-controls={inputId}
							aria-pressed={showPassword}
						>
							{showPassword ? (
								<AiOutlineEyeInvisible aria-hidden="true" size={16} />
							) : (
								<AiOutlineEye aria-hidden="true" size={16} />
							)}
						</button>
					) : null}
				</div>

				{resolvedError ? (
					<p id={errorId} className="form-error-text" role="alert">
						{resolvedError}
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

FormInput.displayName = "FormInput";

export default FormInput;
