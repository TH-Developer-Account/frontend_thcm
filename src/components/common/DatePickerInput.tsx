import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import "react-day-picker/dist/style.css";

import Button from "./Button";
import HelperTooltip from "./HelperToolTip";

type PickerMode = "single" | "range";

type DatePickerInputProps = {
	label?: string;
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

const calendarClassNames = {
	months: "flex flex-col gap-2 sm:flex-row",
	month: "space-y-1",

	caption: "relative flex items-center justify-center px-8 py-1.5",
	caption_label: "mx-auto  text-[11px] font-bold text-orange-700 items-center",

	nav: "absolute inset-x-0 top-1.5 flex items-center justify-between px-1",
	nav_button:
		"flex h-4 w-4 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700",
	nav_button_previous: "absolute left-0",
	nav_button_next: "absolute right-0",

	table: "w-full border-collapse",
	head_row: "flex",
	head_cell: "w-6 text-center text-[9px] font-semibold text-gray-400",

	row: "mt-0.5 flex w-full",
	cell: "h-6 w-6 p-0 text-center text-xs",

	day: "h-6 w-6 rounded-md text-[10px] font-medium text-gray-700 transition hover:bg-orange-50 hover:text-orange-600",

	day_today:
		"relative border border-orange-500 bg-orange-100 text-orange-700 font-extrabold shadow-[0_0_0_3px_rgba(243,90,0,0.16)] after:absolute after:bottom-[2px] after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-orange-600",

	day_selected: "bg-orange-500 text-white hover:bg-orange-500 hover:text-white",

	day_outside: "text-gray-300 opacity-60",
	day_disabled: "text-gray-300 opacity-40 cursor-not-allowed",
};

export default function DatePickerInput({
	label,
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
	fromDate,
	toDate,
}: DatePickerInputProps) {
	const [open, setOpen] = useState(false);

	const [internalValue, setInternalValue] = useState<
		Date | DateRange | undefined
	>(value);

	const [draftValue, setDraftValue] = useState<Date | DateRange | undefined>(
		value,
	);

	const wrapperRef = useRef<HTMLDivElement>(null);

	const finalNumberOfMonths = numberOfMonths ?? (mode === "range" ? 1 : 1);

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

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(event.target as Node)
			) {
				setOpen(false);
				setDraftValue(selectedValue);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [selectedValue]);

	const handleOpen = () => {
		if (disabled) return;

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

	return (
		<div ref={wrapperRef} className={`relative form-field ${className}`}>
			{label ? (
				<div className="form-label-row">
					<label className="form-label">{label}</label>

					{helperText && isTooltip && !error ? (
						<HelperTooltip label={label} text={helperText} />
					) : null}
				</div>
			) : null}

			<div className="form-input-wrapper relative">
				<button
					type="button"
					disabled={disabled}
					onClick={() => (open ? handleCancel() : handleOpen())}
					aria-invalid={!!error}
					aria-describedby={error ? errorId : undefined}
					className={`
						form-input flex w-full items-center justify-between text-left
						${error ? "form-input-error" : ""}
						${disabled ? "form-input-disabled" : ""}
					`}
				>
					<span className={displayValue ? "text-gray-900" : "text-gray-400"}>
						{displayValue || finalPlaceholder}
					</span>

					<CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-500" />
				</button>
			</div>

			{open && !disabled ? (
				<div className="absolute left-0 z-50 mt-1.5 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
					{mode === "single" ? (
						<DayPicker
							mode="single"
							selected={draftValue instanceof Date ? draftValue : undefined}
							onSelect={(date) => handleSelect(date)}
							numberOfMonths={finalNumberOfMonths}
							showOutsideDays
							fromDate={fromDate}
							toDate={toDate}
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
							fromDate={fromDate}
							toDate={toDate}
							classNames={{
								...calendarClassNames,

								day_range_start:
									"bg-orange-500 text-white rounded-l-md rounded-r-none hover:bg-orange-500 hover:text-white",

								day_range_end:
									"bg-orange-500 text-white rounded-r-md rounded-l-none hover:bg-orange-500 hover:text-white",

								day_range_middle:
									"bg-orange-100 text-orange-700 rounded-none hover:bg-orange-100 hover:text-orange-700",
							}}
						/>
					)}

					<div className="mt-1.5 flex items-center justify-end gap-1.5 border-t border-gray-100 pt-1.5">
						<Button
							type="button"
							onClick={handleCancel}
							text="Cancel"
							className="px-2 py-1 text-[10px]"
						/>

						<Button
							type="button"
							onClick={handleApply}
							disabled={!canApply}
							text="Apply"
							status="brand"
							className="px-2 py-1 text-[10px]"
						/>
					</div>
				</div>
			) : null}

			{error ? (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			) : null}
		</div>
	);
}
