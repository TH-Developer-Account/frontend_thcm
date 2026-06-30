import React, { useId, type ForwardRefRenderFunction } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import HelperTooltip from "../common/HelperTooltip";
import type { TextareaProps } from "./input.types";

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
	classes.filter(Boolean).join(" ");

const Textarea: ForwardRefRenderFunction<HTMLTextAreaElement, TextareaProps> = (
	{
		id,
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
	const generatedId = useId();
	const textareaId = id ?? name ?? `textarea-${generatedId}`;
	const errorId = `${textareaId}-error`;
	const helperId = `${textareaId}-helper`;
	const describedBy = [
		error ? errorId : undefined,
		helperText && !isTooltip ? helperId : undefined,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={joinClassNames(
				"form-field",
				disabled && "is-disabled",
				error && "has-error",
			)}
		>
			{label ? (
				<div className="form-label-row">
					<label htmlFor={textareaId} className="form-label">
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
				<textarea
					{...otherProps}
					id={textareaId}
					ref={ref}
					name={name}
					placeholder={placeholder}
					value={value}
					disabled={disabled}
					required={required}
					maxLength={otherProps.maxLength ?? 500}
					aria-invalid={error ? "true" : undefined}
					aria-describedby={describedBy || undefined}
					className={joinClassNames(
						"form-textarea",
						error && "form-input-error",
						disabled && "form-input-disabled",
						className,
					)}
				/>
				{error ? (
					<ExclamationCircleIcon
						aria-hidden="true"
						className="form-error-icon"
					/>
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
};

const TextareaInput = React.forwardRef(Textarea);
TextareaInput.displayName = "TextareaInput";
export default TextareaInput;
