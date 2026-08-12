import React, {
	useId,
	type ForwardRefRenderFunction,
	type ReactNode,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import HelperTooltip from "../common/HelperTooltip";
import ReadOnlyField from "./ReadOnlyField";
import type { TextareaProps } from "./input.types";
import { CircleCheck } from "lucide-react";

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

const resolveReadOnlyValue = (
	readOnlyValue: ReactNode,
	value: TextareaProps["value"],
): ReactNode => {
	if (readOnlyValue !== undefined && readOnlyValue !== null) {
		return readOnlyValue;
	}

	if (value === undefined || value === null) {
		return undefined;
	}

	if (Array.isArray(value)) {
		return value.join(", ");
	}

	return String(value);
};

const Textarea: ForwardRefRenderFunction<HTMLTextAreaElement, TextareaProps> = (
	{
		id,
		name,
		label,
		placeholder,
		value,
		error,
		className = "",
		required = false,
		disabled = false,
		helperText,
		isTooltip = true,
		mode = "edit",
		readOnlyValue,
		success,
		emptyReadOnlyValue = "--",
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

	if (mode === "view") {
		return (
			<ReadOnlyField
				label={label}
				value={resolveReadOnlyValue(readOnlyValue, value)}
				required={required}
				helperText={helperText}
				isTooltip={isTooltip}
				emptyValue={emptyReadOnlyValue}
				className={className}
				valueClassName="form-readonly-value-multiline"
			/>
		);
	}

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
					aria-errormessage={error ? errorId : undefined}
					className={joinClassNames(
						"form-textarea",
						error && "form-input-error",
						disabled && "form-input-disabled",
						className,
						success && !error && "form-input-success",
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
				<ExclamationCircleIcon aria-hidden="true" className="form-error-icon" />
			) : success ? (
				<CircleCheck aria-hidden="true" className="form-success-icon" />
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
