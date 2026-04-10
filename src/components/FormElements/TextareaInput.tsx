import React, { type ForwardRefRenderFunction } from "react";
import type { TextareaProps } from "./input.types";

const Textarea: ForwardRefRenderFunction<HTMLTextAreaElement, TextareaProps> = (
	{
		name,
		label,
		placeholder,
		value,
		error,
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
			<div className="form-input-wrapper relative">
				<textarea
					id={name}
					ref={ref}
					name={name}
					placeholder={placeholder}
					value={value}
					disabled={disabled}
					maxLength={500}
					aria-invalid={!!error}
					aria-describedby={error ? `${name}-error` : undefined}
					className={`form-input
						${error ? "form-input-error" : ""}
						${disabled ? "form-input-disabled" : ""}
						${className}
          `}
					{...otherProps}
				/>
			</div>

			{error && (
				<p id={`${name}-error`} className="form-error-text">
					{error}
				</p>
			)}
		</div>
	);
};

const TextareaInput = React.forwardRef(Textarea);

export default TextareaInput;
