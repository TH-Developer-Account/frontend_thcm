import { useMemo, useRef, useState, useEffect } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import "react-day-picker/dist/style.css";
import Button from "./Button";

type PickerMode = "single" | "range";

type DatePickerInputProps = {
	label?: string;
	mode?: PickerMode;
	value?: Date | DateRange | undefined;
	onChange?: (value: Date | DateRange | undefined) => void;
	placeholder?: string;
	error?: string;
	helperText?: string;
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

export default function DatePickerInput({
	label,
	mode = "single",
	value,
	onChange,
	placeholder = mode === "range" ? "Select range" : "Select date",
	error,
	helperText,
	className = "",
	disabled = false,
	numberOfMonths = mode === "range" ? 2 : 1,
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

	const selectedValue = value !== undefined ? value : internalValue;

	const displayValue = useMemo(
		() => getDisplayValue(selectedValue, mode),
		[selectedValue, mode],
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
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [selectedValue]);

	const handleOpen = () => {
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

	return (
		<div ref={wrapperRef} className={`relative form-field  ${className}`}>
			{label ? <label className=" form-label">{label}</label> : null}
			<div className="form-input-wrapper relative">
				<button
					type="button"
					disabled={disabled}
					onClick={() => (open ? handleCancel() : handleOpen())}
					className={` form-input flex w-full items-center justify-between rounded-sm border px-3 text-left text-sm transition ${
						error
							? "border-red-500 focus:ring-red-200"
							: "border-gray-300 hover:border-gray-400"
					} ${
						disabled
							? "cursor-not-allowed bg-gray-100 text-gray-400"
							: "bg-[#fafaf8]"
					}`}
				>
					<span className={displayValue ? "text-gray-900" : "text-gray-400"}>
						{displayValue || placeholder}
					</span>

					<CalendarDaysIcon className="h-4 w-4 shrink-0 text-gray-500" />
				</button>
			</div>
			{open && !disabled ? (
				<div className="absolute left-0 z-50 mt-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl">
					{mode === "single" ? (
						<DayPicker
							mode="single"
							selected={draftValue instanceof Date ? draftValue : undefined}
							onSelect={(date) => handleSelect(date)}
							numberOfMonths={numberOfMonths}
							showOutsideDays
							fromDate={fromDate}
							toDate={toDate}
							classNames={{
								months: "flex flex-col gap-2 sm:flex-row",
								month: "space-y-1.5",
								caption: "flex justify-center items-center relative mb-1",
								caption_label: "text-[11px] font-semibold text-gray-900",
								nav: "flex items-center gap-1",
								nav_button:
									"h-6 w-6 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
								table: "w-full border-collapse",
								head_row: "flex",
								head_cell:
									"w-7 text-[10px] font-medium text-gray-500 text-center",
								row: "mt-1 flex w-full",
								cell: "h-7 w-7 p-0 text-center text-xs",
								day: "h-7 w-7 rounded-md text-[11px] font-normal hover:bg-orange-50 hover:text-orange-600",
								day_selected:
									"bg-orange-500 text-white hover:bg-orange-500 hover:text-white",
								day_today: "border border-orange-300 text-orange-600",
								day_outside: "text-gray-300",
								day_disabled: "text-gray-300 opacity-50",
							}}
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
							numberOfMonths={numberOfMonths}
							showOutsideDays
							fromDate={fromDate}
							toDate={toDate}
							classNames={{
								months: "flex flex-col gap-2 sm:flex-row",
								month: "space-y-1.5",
								caption: "flex justify-center items-center relative mb-1",
								caption_label: "text-[11px] font-semibold text-gray-900",
								nav: "flex items-center gap-1",
								nav_button:
									"h-6 w-6 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
								table: "w-full border-collapse",
								head_row: "flex",
								head_cell:
									"w-7 text-[10px] font-medium text-gray-500 text-center",
								row: "mt-1 flex w-full",
								cell: "h-7 w-7 p-0 text-center text-xs",
								day: "h-7 w-7 rounded-md text-[11px] font-normal hover:bg-orange-50 hover:text-orange-600",
								day_selected:
									"bg-orange-500 text-white hover:bg-orange-500 hover:text-white text-xs",
								day_today: "border border-orange-300 text-orange-600",
								day_outside: "text-gray-300",
								day_disabled: "text-gray-300 opacity-50",
								day_range_start:
									"bg-orange-500 text-white rounded-l-md rounded-r-none",
								day_range_end:
									"bg-orange-500 text-white rounded-r-md rounded-l-none",
								day_range_middle: "bg-orange-100 text-orange-700 rounded-none",
							}}
						/>
					)}

					<div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
						<Button
							type="button"
							onClick={handleCancel}
							text="Cancel"
							className="text-xs  px-2.5 py-1.5"
						/>
						<Button
							type="button"
							onClick={handleApply}
							disabled={!canApply}
							text="Apply"
							status="brand"
							className="text-xs  px-2.5 py-1.5"
						/>
					</div>
				</div>
			) : null}

			{error ? (
				<p className="mt-1 text-xs text-red-600">{error}</p>
			) : helperText ? (
				<p className="form-helper-text">{helperText}</p>
			) : null}
		</div>
	);
}
