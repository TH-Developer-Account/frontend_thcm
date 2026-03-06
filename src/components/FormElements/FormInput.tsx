import React, {
	type ForwardRefRenderFunction,
	type InputHTMLAttributes,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	name: string;
	label: string;
	placeholder?: string;
	value?: string | number;
	type?: string;
	error?: string;
	helperText?: string;
	className?: string;
}

const Input: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
	{
		name,
		label,
		placeholder,
		value,
		error,
		type,
		className = "",
		required,
		disabled,
		...otherProps
	},
	ref,
) => {
	return (
		<div className="form-field">
			<label htmlFor={name} className="form-label">
				{label}
				{required && <span className="form-required"> *</span>}
			</label>

			<div className="mt-2 relative">
				<input
					id={name}
					type={type}
					{...(type === "date" && {
						min: new Date().toISOString().split("T")[0],
					})}
					ref={ref}
					name={name}
					placeholder={placeholder}
					required={required}
					value={value}
					disabled={disabled}
					aria-invalid={!!error}
					aria-describedby={error ? `${name}-error` : undefined}
					className={`
						form-input
						${error ? "form-input-error" : "form-input-focus"}
						${disabled ? "form-input-disabled" : ""}
						${className}
					`}
					{...otherProps}
				/>
				{error && <ExclamationCircleIcon className="form-error-icon" />}
			</div>

			{error && (
				<p id={`${name}-error`} className="form-error-text">
					{error}
				</p>
			)}
		</div>
	);
};

const FormInput = React.forwardRef(Input);

export default FormInput;
