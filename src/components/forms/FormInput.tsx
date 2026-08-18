import {
	forwardRef,
	useId,
	useMemo,
	useState,
	type InputHTMLAttributes,
	type ReactNode,
} from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import HelperTooltip from "../common/HelperTooltip";
import ReadOnlyField from "./ReadOnlyField";
import { PasswordPolicy } from "../../containers/Login/constant";
import type { InputProps } from "./input.types";

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
			readOnlyValue,
			emptyReadOnlyValue = "--",
			...nativeInputProps
		},
		ref,
	) => {
		const generatedId = useId();
		const [showPassword, setShowPassword] = useState(false);

		const inputId = id ?? name ?? `form-input-${generatedId}`;
		const errorId = `${inputId}-error`;
		const helperId = `${inputId}-helper`;

		const isViewMode = mode === "view";
		const isPassword = type === "password";
		const isRadio = type === "radio";
		const resolvedInputType = isPassword && showPassword ? "text" : type;

		const passwordIsValid = useMemo(() => {
			if (!isPassword || typeof value !== "string" || value.length === 0) {
				return false;
			}

			return PasswordPolicy.every((rule) => rule.test(value));
		}, [isPassword, value]);

		const describedBy = [
			error ? errorId : undefined,
			helperText && !isTooltip ? helperId : undefined,
		]
			.filter(Boolean)
			.join(" ");

		const resolvedMin = type === "date" ? (min ?? getTodayDate()) : min;

		const togglePasswordVisibility = () => {
			setShowPassword((previous) => !previous);
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
							aria-invalid={error ? "true" : undefined}
							aria-describedby={error ? errorId : undefined}
							className={joinClassNames(
								"form-radio-input",
								error && "form-radio-input-error",
								className,
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

					{error ? (
						<p
							id={errorId}
							className="form-error-text form-radio-error-text"
							role="alert"
						>
							{error}
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
					error && "has-error",
					passwordIsValid && !error && "is-valid",
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

				<div className="form-input-wrapper">
					<input
						{...nativeInputProps}
						ref={ref}
						id={inputId}
						name={name}
						type={resolvedInputType}
						value={value}
						required={required}
						disabled={disabled}
						min={resolvedMin}
						placeholder={placeholder}
						aria-invalid={error ? "true" : undefined}
						aria-describedby={describedBy || undefined}
						className={joinClassNames(
							"form-input",
							(error || isPassword) && "form-input-with-icon",
							error && "form-input-error",
							disabled && "form-input-disabled",
							passwordIsValid && !error && "form-input-valid",
							className,
						)}
					/>

					{error ? (
						<ExclamationCircleIcon
							aria-hidden="true"
							className="form-error-icon"
						/>
					) : null}

					{isPassword && !error ? (
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

				{error ? (
					<p id={errorId} className="form-error-text" role="alert">
						{error}
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
