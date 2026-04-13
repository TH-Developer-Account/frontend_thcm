import React, { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"onChange"
> {
	groupLabel?: string;
	label1?: string;
	label2?: string;
	value1?: string;
	value2?: string;
	selectedValue?: string;
	error?: string;
	helperText?: string;
	onChange?: (value: string) => void;
}

const Radio = forwardRef<HTMLInputElement, InputProps>(
	(
		{
			groupLabel,
			label1,
			label2,
			value1 = "option1",
			value2 = "option2",
			selectedValue,
			name,
			required,
			className = "",
			disabled,
			helperText,
			error,
			onChange,
			...props
		},
		ref,
	) => {
		return (
			<div className="radio-group">
				{groupLabel && (
					<div className="radio-group-label">
						<label className="form-label">
							{groupLabel}
							{required && <span className="form-required"> *</span>}
						</label>
					</div>
				)}

				<div className="radio-group-options">
					<label className={`form-radio-field ${disabled ? "opacity-70" : ""}`}>
						<input
							ref={ref}
							id={`${name}-${value1}`}
							name={name}
							type="radio"
							disabled={disabled}
							required={required}
							checked={selectedValue === value1}
							value={value1}
							onChange={() => onChange?.(value1)}
							className={`form-radio-input ${className}`}
							{...props}
						/>
						{label1 && <span className="form-radio-label">{label1}</span>}
					</label>

					<label className={`form-radio-field ${disabled ? "opacity-70" : ""}`}>
						<input
							id={`${name}-${value2}`}
							name={name}
							type="radio"
							disabled={disabled}
							required={required}
							checked={selectedValue === value2}
							value={value2}
							onChange={() => onChange?.(value2)}
							className={`form-radio-input ${className}`}
							{...props}
						/>
						{label2 && <span className="form-radio-label">{label2}</span>}
					</label>
				</div>

				{error && <p className="form-error-text">{error}</p>}
				{!error && helperText && (
					<p className="form-helper-text">{helperText}</p>
				)}
			</div>
		);
	},
);

export default Radio;
