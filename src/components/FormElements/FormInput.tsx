import React, {
	forwardRef,
	useState,
	useMemo,
	type InputHTMLAttributes,
} from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { PasswordPolicy } from "../../containers/Login/constant";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helperText?: string;
	placeholder?: string;
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

		if (isRadio) {
			return (
				<label className={`form-radio-field ${disabled ? "opacity-70" : ""}`}>
					<input
						ref={ref}
						id={name}
						name={name}
						type="radio"
						disabled={disabled}
						className={`form-radio-input ${className}`}
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
					<label htmlFor={name} className="form-label">
						{label}
						{required && <span className="form-required"> *</span>}
					</label>
				)}

				<div className="form-input-wrapper relative">
					<input
						ref={ref}
						id={name}
						name={name}
						type={inputType}
						value={value}
						required={required}
						disabled={disabled}
						aria-invalid={!!error}
						aria-describedby={error ? `${name}-error` : undefined}
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
						>
							{showPassword ? (
								<AiOutlineEyeInvisible size={20} />
							) : (
								<AiOutlineEye size={20} />
							)}
						</button>
					)}
				</div>

				{error && (
					<p id={`${name}-error`} className="form-error-text">
						{error}
					</p>
				)}

				{!error && helperText && (
					<p className="form-helper-text">{helperText}</p>
				)}
			</div>
		);
	},
);

export default FormInput;
