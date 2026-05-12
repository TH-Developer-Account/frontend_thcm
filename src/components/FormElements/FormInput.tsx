import React, {
	forwardRef,
	useState,
	useMemo,
	type InputHTMLAttributes,
} from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { PasswordPolicy } from "../../containers/Login/constant";
import HelperTooltip from "../common/HelperToolTip";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	placeholder?: string;
	isTooltip?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			label,
			name,
			type = "text",
			error,
			value,
			required,
			className = "",
			disabled,
			helperText,
			placeholder,
			isTooltip = true,
			...props
		},
		ref,
	) => {
		const [showPassword, setShowPassword] = useState(false);

		const isPassword = type === "password";
		const isRadio = type === "radio";

		const inputType = isPassword && showPassword ? "text" : type;

		const isValid = useMemo(() => {
			if (!isPassword || typeof value !== "string") return false;
			return PasswordPolicy.every((rule) => rule.test(value));
		}, [value, isPassword]);

		const errorId = name ? `${name}-error` : undefined;

		if (isRadio) {
			return (
				<label className={`form-radio-field ${disabled ? "opacity-70" : ""}`}>
					<input
						ref={ref}
						id={name}
						name={name}
						type="radio"
						disabled={disabled}
						required={required}
						className={`form-radio-input ${className}`}
						aria-invalid={!!error}
						aria-describedby={error ? errorId : undefined}
						{...props}
					/>

					{label && (
						<span className="form-radio-label">
							{label}
							{required && <span className="form-required"> *</span>}
						</span>
					)}
				</label>
			);
		}

		return (
			<div className="form-field">
				{label && (
					<div className="form-label-row">
						<label htmlFor={name} className="form-label">
							{label}
							{required && <span className="form-required"> *</span>}
						</label>

						{helperText && isTooltip && !error && (
							<HelperTooltip label={label} text={helperText} />
						)}
					</div>
				)}

				<div className="form-input-wrapper">
					<input
						ref={ref}
						id={name}
						name={name}
						type={inputType}
						value={value}
						required={required}
						disabled={disabled}
						aria-invalid={!!error}
						aria-describedby={error ? errorId : undefined}
						{...(type === "date" && {
							min: new Date().toISOString().split("T")[0],
						})}
						className={`
							form-input
							${error ? "form-input-error" : ""}
							${disabled ? "form-input-disabled" : ""}
							${isValid && !error ? "form-input-valid" : ""}
							${className}
						`}
						placeholder={placeholder}
						{...props}
					/>

					{error && <ExclamationCircleIcon className="form-error-icon" />}

					{isPassword && !error && (
						<button
							type="button"
							onClick={() => setShowPassword((prev) => !prev)}
							className="form-icon-right"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? (
								<AiOutlineEyeInvisible size={16} />
							) : (
								<AiOutlineEye size={16} />
							)}
						</button>
					)}
				</div>

				{error && (
					<p id={errorId} className="form-error-text">
						{error}
					</p>
				)}
			</div>
		);
	},
);

FormInput.displayName = "FormInput";

export default FormInput;
