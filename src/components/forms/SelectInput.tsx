import { useId, type ReactNode } from "react";
import Select from "react-select";
import type { GroupBase, Props, SingleValue } from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import HelperTooltip from "../common/HelperTooltip";
import ReadOnlyField from "./ReadOnlyField";
import type { FormFieldMode } from "./FormInput";

export interface BaseOption {
	label: string;
	value: string;
}

interface SelectInputProps<T extends BaseOption> extends Props<
	T,
	false,
	GroupBase<T>
> {
	label?: string;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;
	required?: boolean;
	mode?: FormFieldMode;

	/**
	 * Overrides the automatically resolved option label in view mode.
	 */
	readOnlyValue?: ReactNode;

	/**
	 * Value displayed when no option is selected in view mode.
	 */
	emptyReadOnlyValue?: ReactNode;
}

const joinClassNames = (
	...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");

const isBaseOption = <T extends BaseOption>(value: unknown): value is T => {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<BaseOption>;

	return (
		typeof candidate.label === "string" && typeof candidate.value === "string"
	);
};

export default function SelectInput<T extends BaseOption>({
	label,
	error,
	helperText,
	isTooltip = true,
	required = false,
	mode = "edit",
	readOnlyValue,
	emptyReadOnlyValue = "--",

	id,
	inputId,
	name,
	className = "",
	isDisabled = false,

	menuPortalTarget,
	menuPosition = "fixed",
	menuPlacement = "auto",

	value,
	defaultValue,
	getOptionLabel,

	...selectProps
}: SelectInputProps<T>) {
	const generatedId = useId();

	const resolvedInputId =
		inputId ?? id ?? name ?? `select-input-${generatedId}`;

	const errorId = `${resolvedInputId}-error`;
	const helperId = `${resolvedInputId}-helper`;

	const describedBy = [
		error ? errorId : undefined,
		helperText && !isTooltip ? helperId : undefined,
	]
		.filter(Boolean)
		.join(" ");

	const resolvedPortalTarget =
		menuPortalTarget !== undefined
			? menuPortalTarget
			: typeof document !== "undefined"
				? document.body
				: undefined;

	if (mode === "view") {
		const selectedOption = (value ?? defaultValue) as SingleValue<T>;

		const resolvedReadOnlyValue =
			readOnlyValue ??
			(isBaseOption<T>(selectedOption)
				? getOptionLabel
					? getOptionLabel(selectedOption)
					: selectedOption.label
				: undefined);

		return (
			<ReadOnlyField
				label={label}
				value={resolvedReadOnlyValue}
				required={required}
				helperText={helperText}
				isTooltip={isTooltip}
				emptyValue={emptyReadOnlyValue}
				className={className}
			/>
		);
	}

	return (
		<div
			className={joinClassNames(
				"form-field",
				"select-field",
				error && "has-error",
				isDisabled && "is-disabled",
			)}
		>
			{label ? (
				<div className="form-label-row">
					<label htmlFor={resolvedInputId} className="form-label">
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
				<Select<T, false, GroupBase<T>>
					{...selectProps}
					id={id}
					inputId={resolvedInputId}
					name={name}
					value={value}
					defaultValue={defaultValue}
					getOptionLabel={getOptionLabel}
					required={required}
					isDisabled={isDisabled}
					unstyled
					classNamePrefix="react-select"
					className={joinClassNames(
						"react-select-container",
						error && "react-select-container-error",
						isDisabled && "react-select-container-disabled",
						className,
					)}
					menuPortalTarget={resolvedPortalTarget}
					menuPosition={menuPosition}
					menuPlacement={menuPlacement}
					aria-invalid={error ? "true" : undefined}
					aria-required={required || undefined}
					aria-describedby={describedBy || undefined}
					aria-errormessage={error ? errorId : undefined}
				/>

				{error ? (
					<ExclamationCircleIcon
						aria-hidden="true"
						className="form-error-icon select-error-icon"
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
}
