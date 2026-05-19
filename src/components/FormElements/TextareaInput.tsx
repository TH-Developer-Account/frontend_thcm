import React, { type ForwardRefRenderFunction } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import HelperTooltip from "../common/HelperToolTip";
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
		helperText,
		isTooltip = true,
		...otherProps
	},
	ref,
) => {
	const errorId = name ? `${name}-error` : undefined;

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
					aria-describedby={error ? errorId : undefined}
					className={`
						form-textarea
						${error ? "form-input-error" : ""}
						${disabled ? "form-input-disabled" : ""}
						${className}
					`}
					{...otherProps}
				/>

				{error && <ExclamationCircleIcon className="form-error-icon" />}
			</div>

			{error && (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			)}
		</div>
	);
};

const TextareaInput = React.forwardRef(Textarea);

TextareaInput.displayName = "TextareaInput";

export default TextareaInput;
