import {
	forwardRef,
	useId,
	useState,
	type InputHTMLAttributes,
	type ReactNode,
} from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import HelperTooltip from "../common/HelperTooltip";
import ReadOnlyField from "./ReadOnlyField";
import type { InputProps } from "./input.types";
import { CircleCheck } from "lucide-react";

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
							className={[
								"form-radio-input",
								invalidRadio && "form-radio-input-error",
							]
								.filter(Boolean)
								.join(" ")}
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
				</div>
			);
		}

		return (
			<div
				className={joinClassNames(
					"form-field",
					disabled && "is-disabled",
					error && "has-error",
					success && !error && "is-valid",
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
						"form-input-wrapper",
						isPassword && "has-password-toggle",
						(error || success) && "has-status-icon",
					)}
				>
					<input
						{...nativeInputProps}
						ref={ref}
						id={inputId}
						name={name}
						type={resolvedInputType}
						value={value ?? ""}
						required={required}
						disabled={disabled}
						min={resolvedMin}
						placeholder={placeholder}
						aria-invalid={error ? "true" : undefined}
						aria-describedby={describedBy || undefined}
						className={joinClassNames(
							"form-input",
							(error || success || isPassword) && "form-input-with-icon",
							isPassword &&
								(error || success) &&
								"form-input-with-status-and-toggle",
							error && "form-input-error",
							success && !error && "form-input-success",
							disabled && "form-input-disabled",
							className,
						)}
					/>

					{error ? (
						<ExclamationCircleIcon
							aria-hidden="true"
							className="form-error-icon"
						/>
					) : success ? (
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
