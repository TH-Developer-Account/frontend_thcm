import { useId, useRef, useState, type ReactNode } from "react";
import Select from "react-select";
import type {
	ActionMeta,
	GroupBase,
	InputActionMeta,
	OptionsOrGroups,
	Props,
	SelectInstance,
	SingleValue,
} from "react-select";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import HelperTooltip from "../common/HelperTooltip";
import ReadOnlyField from "./ReadOnlyField";
import type { FormFieldMode } from "./input.types";
import { CircleCheck } from "lucide-react";

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
	success?: boolean;

	/**
	 * Overrides the automatically resolved option label in view mode.
	 */
	readOnlyValue?: ReactNode;

	/**
	 * Value displayed when no option is selected in view mode.
	 */
	emptyReadOnlyValue?: ReactNode;

	/**
	 * Browser autofill (and paste) writes a whole value into react-select's
	 * search box in one go — e.g. Chrome filling "Karnataka" into a field
	 * labelled "State". Left alone that only filters the menu; nothing is
	 * selected and the form value stays empty.
	 *
	 * When true (default), a multi-character insert whose text exactly
	 * matches an option's label or value (case/whitespace-insensitive) is
	 * turned into a real selection and the menu is closed.
	 *
	 * Normal typing is never affected: it arrives one character at a time,
	 * so typing "Goa" doesn't lock in "Goa" mid-word.
	 */
	selectOnAutofill?: boolean;
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

const normalizeText = (value: string): string =>
	value.trim().replace(/\s+/g, " ").toLowerCase();

// Grouped options ({ label, options: [...] }) are flattened so a match can
// be found inside any group.
const flattenOptions = <T extends BaseOption>(
	options: OptionsOrGroups<T, GroupBase<T>> | undefined,
): T[] =>
	(options ?? []).flatMap((item) =>
		"options" in item && Array.isArray(item.options)
			? [...(item as GroupBase<T>).options]
			: [item as T],
	);

const findExactOption = <T extends BaseOption>(
	options: OptionsOrGroups<T, GroupBase<T>> | undefined,
	text: string,
	getOptionLabel?: (option: T) => string,
): T | undefined => {
	const needle = normalizeText(text);
	if (!needle) return undefined;

	return flattenOptions(options).find((option) => {
		const label = getOptionLabel ? getOptionLabel(option) : option.label;

		return (
			normalizeText(label) === needle || normalizeText(option.value) === needle
		);
	});
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
	selectOnAutofill = true,

	id,
	inputId,
	name,
	success,
	className = "",
	isDisabled = false,

	menuPortalTarget,
	menuPosition = "fixed",
	menuPlacement = "auto",

	value,
	defaultValue,
	getOptionLabel,

	options,
	onChange,
	inputValue: inputValueProp,
	onInputChange,

	...selectProps
}: SelectInputProps<T>) {
	const generatedId = useId();
	const selectRef = useRef<SelectInstance<T, false, GroupBase<T>>>(null);

	// react-select only lets us clear the search text after an autofill
	// match if the input value is controlled. If the caller controls it,
	// theirs wins; otherwise it's tracked here.
	const [internalInputValue, setInternalInputValue] = useState("");
	const isInputControlled = inputValueProp !== undefined;
	const resolvedInputValue = isInputControlled
		? inputValueProp
		: internalInputValue;
	const previousInputRef = useRef("");

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

	const handleInputChange = (nextValue: string, meta: InputActionMeta) => {
		const previousValue = previousInputRef.current;
		previousInputRef.current = nextValue;

		onInputChange?.(nextValue, meta);

		// Autofill/paste inserts several characters in one event; typing
		// inserts one. Only the former is treated as a selection attempt.
		const isBulkInsert =
			meta.action === "input-change" &&
			nextValue.length - previousValue.length > 1;

		if (selectOnAutofill && isBulkInsert && !isDisabled) {
			const match = findExactOption(options, nextValue, getOptionLabel);

			if (match) {
				onChange?.(match, {
					action: "select-option",
					option: match,
					name,
				} as ActionMeta<T>);

				previousInputRef.current = "";
				if (!isInputControlled) setInternalInputValue("");

				// Close the menu that the inserted text opened. Deferred so
				// react-select finishes processing this input event first.
				requestAnimationFrame(() => selectRef.current?.blur());
				return;
			}
		}

		if (!isInputControlled) setInternalInputValue(nextValue);
	};

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
					ref={selectRef}
					id={id}
					inputId={resolvedInputId}
					name={name}
					options={options}
					value={value}
					defaultValue={defaultValue}
					onChange={onChange}
					inputValue={resolvedInputValue}
					onInputChange={handleInputChange}
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
						success && !error && "react-select-container-success",
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
				) : success ? (
					<CircleCheck
						aria-hidden="true"
						className="form-success-icon select-success-icon"
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
