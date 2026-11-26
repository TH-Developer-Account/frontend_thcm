import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
// react-day-picker/dist/style.css is intentionally not imported: it is
// unlayered, so it overrode every design-system rule (today, outside days,
// weights). All calendar styling lives in components.css → DATE PICKER.

import Button from "./Button";
import HelperTooltip from "./HelperTooltip";

type PickerMode = "single" | "range";

type DropdownPosition = {
	top: number;
	left: number;
	visibility: "hidden" | "visible";
};

const VIEWPORT_GAP = 8;

type DatePickerInputProps = {
	label?: string;
	/** Shows the same red asterisk the other form fields use. */
	required?: boolean;
	mode?: PickerMode;
	value?: Date | DateRange | undefined;
	onChange?: (value: Date | DateRange | undefined) => void;
	placeholder?: string;
	error?: string;
	helperText?: string;
	isTooltip?: boolean;
	className?: string;
	disabled?: boolean;
	numberOfMonths?: number;
	fromDate?: Date;
	toDate?: Date;
	disablePast?: boolean;
};

function formatDate(date: Date) {
	return date.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function getDisplayValue(
	value: Date | DateRange | undefined,
	mode: PickerMode,
) {
	if (!value) return "";

	if (mode === "single" && value instanceof Date) {
		return formatDate(value);
	}

	if (mode === "range" && typeof value === "object" && "from" in value) {
		const from = value.from ? formatDate(value.from) : "";
		const to = value.to ? formatDate(value.to) : "";

		if (from && to) return `${from} - ${to}`;
		if (from) return `${from} -`;
	}

	return "";
}

// react-day-picker v9 class keys → semantic classes (styles/components.css
// → DATE PICKER). v9 puts state classes (today, selected, outside, range_*)
// on the day CELL (<td>); the clickable element is day_button.
// (The keys used before — caption, head_row, day_today … — are v8 names that
// v9 ignores; the calendar only looked right while the library stylesheet
// was imported, and that stylesheet is unlayered, so it overrode the design
// system.)
const calendarClassNames = {
	root: "date-picker-root",
	months: "date-picker-months",
	month: "date-picker-month",
	month_caption: "date-picker-caption",
	caption_label: "date-picker-caption-label",
	nav: "date-picker-nav",
	button_previous: "date-picker-nav-button",
	button_next: "date-picker-nav-button",
	chevron: "date-picker-chevron",
	month_grid: "date-picker-table",
	weekdays: "date-picker-head-row",
	weekday: "date-picker-head-cell",
	weeks: "date-picker-weeks",
	week: "date-picker-row",
	day: "date-picker-cell",
	day_button: "date-picker-day",
	today: "is-today",
	selected: "is-selected",
	outside: "is-outside",
	disabled: "is-disabled",
	hidden: "is-hidden",
	focused: "is-focused",
	range_start: "is-range-start",
	range_middle: "is-range-middle",
	range_end: "is-range-end",
};

export default function DatePickerInput({
	label,
	required = false,
	mode = "range",
	value,
	onChange,
	placeholder,
	error,
	helperText,
	isTooltip = true,
	className = "",
	disabled = false,
	numberOfMonths,
	disablePast = false,
	fromDate,
	toDate,
}: DatePickerInputProps) {
	const [open, setOpen] = useState(false);
	const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({
		top: 0,
		left: 0,
		visibility: "hidden",
	});

	const [internalValue, setInternalValue] = useState<
		Date | DateRange | undefined
	>(value);

	const [draftValue, setDraftValue] = useState<Date | DateRange | undefined>(
		value,
	);

	const wrapperRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const effectiveFromDate = disablePast ? (fromDate ?? new Date()) : fromDate;

	const finalNumberOfMonths = numberOfMonths ?? 1;

	const finalPlaceholder =
		placeholder ?? (mode === "range" ? "Select date range" : "Select date");

	const selectedValue = value !== undefined ? value : internalValue;

	const displayValue = useMemo(
		() => getDisplayValue(selectedValue, mode),
		[selectedValue, mode],
	);

	const errorId = label
		? `${label.replace(/\s+/g, "-").toLowerCase()}-error`
		: undefined;
	const fieldId = useId();
	const labelId = `${fieldId}-label`;
	const valueId = `${fieldId}-value`;

	const canApply =
		mode === "single"
			? draftValue instanceof Date
			: !!(
					draftValue &&
					typeof draftValue === "object" &&
					"from" in draftValue &&
					draftValue.from &&
					draftValue.to
				);

	useEffect(() => {
		if (value !== undefined) {
			setDraftValue(value);
		}
	}, [value]);

	// Close on outside click — checks both wrapper and portal
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node;

			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(target) &&
				!dropdownRef.current?.contains(target)
			) {
				setOpen(false);
				setDraftValue(selectedValue);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [selectedValue]);

	// Keep the fixed portal inside the viewport and flip it above the input
	// when there is not enough room below.
	useEffect(() => {
		if (!open) return;

		const updatePos = () => {
			const button = buttonRef.current;
			const dropdown = dropdownRef.current;
			if (!button || !dropdown) return;

			const buttonRect = button.getBoundingClientRect();
			const dropdownRect = dropdown.getBoundingClientRect();
			const maxLeft = Math.max(
				VIEWPORT_GAP,
				window.innerWidth - dropdownRect.width - VIEWPORT_GAP,
			);
			const left = Math.min(Math.max(buttonRect.left, VIEWPORT_GAP), maxLeft);
			const fitsBelow =
				buttonRect.bottom + VIEWPORT_GAP + dropdownRect.height <=
				window.innerHeight;
			const top = fitsBelow
				? buttonRect.bottom + VIEWPORT_GAP
				: Math.max(
						VIEWPORT_GAP,
						buttonRect.top - dropdownRect.height - VIEWPORT_GAP,
					);

			setDropdownPos({ top, left, visibility: "visible" });
		};

		const animationFrame = window.requestAnimationFrame(updatePos);

		window.addEventListener("scroll", updatePos, true);
		window.addEventListener("resize", updatePos);
		return () => {
			window.cancelAnimationFrame(animationFrame);
			window.removeEventListener("scroll", updatePos, true);
			window.removeEventListener("resize", updatePos);
		};
	}, [finalNumberOfMonths, mode, open]);

	// Esc closes the calendar without applying and returns focus to the field.
	useEffect(() => {
		if (!open) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			setDraftValue(selectedValue);
			setOpen(false);
			buttonRef.current?.focus();
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [open, selectedValue]);

	const handleOpen = () => {
		if (disabled) return;

		setDropdownPos((current) => ({ ...current, visibility: "hidden" }));

		setDraftValue(selectedValue);
		setOpen(true);
	};

	const handleSelect = (nextValue: Date | DateRange | undefined) => {
		setDraftValue(nextValue);
	};

	const handleApply = () => {
		if (value === undefined) {
			setInternalValue(draftValue);
		}
		onChange?.(draftValue);
		setOpen(false);
	};

	const handleCancel = () => {
		setDraftValue(selectedValue);
		setOpen(false);
	};

	const disabledDays = [
		...(effectiveFromDate ? [{ before: effectiveFromDate }] : []),
		...(toDate ? [{ after: toDate }] : []),
	];

	const dropdown =
		open && !disabled
			? createPortal(
					<div
						ref={dropdownRef}
						id="date-picker-portal"
						style={{
							top: dropdownPos.top,
							left: dropdownPos.left,
							visibility: dropdownPos.visibility,
							maxWidth: `calc(100vw - ${VIEWPORT_GAP * 2}px)`,
							maxHeight: `calc(100dvh - ${VIEWPORT_GAP * 2}px)`,
						}}
						className="date-picker-popover"
						role="dialog"
						aria-label={
							label ? `Choose ${label.toLowerCase()}` : "Choose a date"
						}
					>
						{mode === "single" ? (
							<DayPicker
								mode="single"
								selected={draftValue instanceof Date ? draftValue : undefined}
								onSelect={(date) => handleSelect(date)}
								numberOfMonths={finalNumberOfMonths}
								showOutsideDays
								disabled={disabledDays}
								classNames={calendarClassNames}
							/>
						) : (
							<DayPicker
								mode="range"
								selected={
									draftValue &&
									typeof draftValue === "object" &&
									"from" in draftValue
										? draftValue
										: undefined
								}
								onSelect={(range) => handleSelect(range)}
								numberOfMonths={finalNumberOfMonths}
								showOutsideDays
								disabled={disabledDays}
								classNames={calendarClassNames}
							/>
						)}

						<div className="date-picker-footer">
							<Button
								type="button"
								size="sm"
								onClick={handleCancel}
								text="Cancel"
							/>

							<Button
								type="button"
								size="sm"
								onClick={handleApply}
								disabled={!canApply}
								text="Apply"
								variant="brand"
							/>
						</div>
					</div>,
					document.body,
				)
			: null;

	return (
		<div ref={wrapperRef} className={`form-field ${className}`}>
			{label ? (
				<div className="form-label-row">
					<span className="form-label" id={labelId}>
						{label}
					</span>

					{helperText && isTooltip && !error ? (
						<HelperTooltip label={label} text={helperText} />
					) : null}
				</div>
			) : null}

			<div className="form-input-wrapper">
				<button
					ref={buttonRef}
					type="button"
					disabled={disabled}
					onClick={() => (open ? handleCancel() : handleOpen())}
					aria-invalid={!!error}
					aria-required={required || undefined}
					aria-describedby={error ? errorId : undefined}
					aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
					aria-haspopup="dialog"
					aria-expanded={open}
					className={`
						form-input flex  w-full items-center justify-between
						${error ? "form-input-error" : ""}
						${disabled ? "form-input-disabled" : ""}
					`}
				>
					<span
						id={valueId}
						className={
							displayValue ? "date-picker-value" : "date-picker-placeholder"
						}
					>
						{displayValue || finalPlaceholder}
					</span>

					<CalendarDaysIcon
						className="date-picker-trigger-icon"
						aria-hidden="true"
					/>
				</button>
			</div>

			{/* Renders into document.body — zero layout impact on the form */}
			{dropdown}

			{error ? (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			) : null}
		</div>
	);
}
