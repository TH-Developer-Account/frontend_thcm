import React, {
	useId,
	type ForwardRefRenderFunction,
	type ReactNode,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import ReadOnlyField from "./ReadOnlyField";
import { FieldLabel, FieldMessage, getFieldA11y } from "./FieldParts";
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
		optional,
		warning,
		isTooltip = true,
		mode = "edit",
		readOnlyValue,
		success,
		emptyReadOnlyValue,
		emptyReadOnlyReason,
		...otherProps
	},
	ref,
) => {
	const generatedId = useId();

	const textareaId = id ?? name ?? `textarea-${generatedId}`;
	const a11y = getFieldA11y({
		fieldId: textareaId,
		error,
		warning,
		helperText,
		isTooltip,
	});
	const hasWarning = Boolean(a11y.visibleWarning);

	const resolvedSuccess = success && !error;

	if (mode === "view") {
		return (
			<ReadOnlyField
				label={label}
				value={resolveReadOnlyValue(readOnlyValue, value)}
				required={required}
				helperText={helperText}
				isTooltip={isTooltip}
				emptyValue={emptyReadOnlyValue}
				emptyReason={emptyReadOnlyReason}
				valueType="multiline"
				className={className}
			/>
		);
	}

	return (
		<div
			className={joinClassNames(
				"form-field",
				disabled && "is-disabled",
				error && "has-error",
				hasWarning && "has-warning",
			)}
		>
			<FieldLabel
				htmlFor={textareaId}
				label={label}
				required={required}
				optional={optional}
				helperText={helperText}
				isTooltip={isTooltip}
				hasError={Boolean(error)}
				tooltipId={a11y.tooltipId}
			/>

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
					aria-describedby={a11y.describedBy}
					aria-errormessage={error ? a11y.errorId : undefined}
					className={joinClassNames(
						"form-textarea",
						error && "form-input-error",
						hasWarning && "form-input-warning",
						disabled && "form-input-disabled",
						className,
						resolvedSuccess && "form-input-success",
					)}
				/>

				{/*
				 * Render exactly one status icon here. This used to also be
				 * rendered again below (error icon duplicated for every
				 * errored textarea) — keep the single source of truth in the
				 * input wrapper, matching FormInput's pattern.
				 */}
				{error ? (
					<ExclamationCircleIcon
						aria-hidden="true"
						className="form-error-icon"
					/>
				) : resolvedSuccess ? (
					<CircleCheck aria-hidden="true" className="form-success-icon" />
				) : null}
			</div>

			<FieldMessage
				a11y={a11y}
				error={error}
				helperText={helperText}
				isTooltip={isTooltip}
			/>
		</div>
	);
};

const TextareaInput = React.forwardRef(Textarea);

TextareaInput.displayName = "TextareaInput";

export default TextareaInput;
