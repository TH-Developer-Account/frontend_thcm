import { useRef, useState, useEffect } from "react";
import { Filter, ChevronDown, X } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Checkbox from "../../../../../components/FormElements/Checkbox";
import type { EpcFilters } from "../../types/epc.types";

type OptionItem = { label: string; value: string };

type EpcFilterDropdownProps = {
	filters: EpcFilters;
	onChange: (updated: Partial<EpcFilters>) => void;
	onClearAll: () => void;
	activeFilterCount: number;
	zoneOptions: OptionItem[];
	eventTypeOptions: OptionItem[];
	statusOptions: OptionItem[];
};

const SectionLabel = ({ label }: { label: string }) => (
	<p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 px-3 pt-3 pb-1 border-b-zinc-200 border-b">
		{label}
	</p>
);

const DateInput = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) => (
	<div className="flex flex-col gap-1 px-3 py-1">
		<label className="text-[11px] text-gray-500">{label}</label>
		<input
			type="date"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="h-6 rounded-md border border-gray-200 px-2 text-sm text-gray-700 focus:outline-none focus:border-brand-primary"
		/>
	</div>
);

const CheckboxList = ({
	options,
	selected,
	onToggle,
	cols = 2,
}: {
	options: OptionItem[];
	selected: string[];
	onToggle: (value: string) => void;
	cols?: 1 | 2;
}) => (
	<div className={`grid ${cols === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1`}>
		{options.map((opt) => (
			<Button
				key={opt.value}
				type="button"
				onClick={() => onToggle(opt.value)}
				className="w-full flex items-center gap-1 px-3 py-1.5 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
			>
				<Checkbox
					label={opt.label}
					checked={selected.includes(opt.value)}
					onChange={() => onToggle(opt.value)}
					size={14}
				/>
			</Button>
		))}
	</div>
);

export const EpcFilterDropdown = ({
	filters,
	onChange,
	onClearAll,
	activeFilterCount,
	zoneOptions,
	eventTypeOptions,
	statusOptions,
}: EpcFilterDropdownProps) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node))
				setOpen(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const toggleArrayFilter = (
		key: "status" | "zone" | "eventType",
		value: string,
	) => {
		const current = filters[key];
		onChange({
			[key]: current.includes(value)
				? current.filter((x) => x !== value)
				: [...current, value],
		});
	};

	return (
		<div ref={ref} className="relative">
			<Button
				Icon={Filter}
				iconPosition="left"
				iconSize={"15"}
				size="sm"
				status={"outline"}
				onClick={() => setOpen((o) => !o)}
			>
				{activeFilterCount > 0 && (
					<span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-brand-primary text-[11px] font-semibold">
						{activeFilterCount}
					</span>
				)}
				<ChevronDown
					size={13}
					className={`transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</Button>

			{open && (
				<div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-sm border border-gray-100 bg-white shadow-lg overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
						<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
							Filters
						</span>
						{activeFilterCount > 0 && (
							<Button
								type="button"
								status="outline"
								size="sm"
								onClick={onClearAll}
								className="flex items-center p-0.5 gap-1 text-[10px] font-medium text-brand-primary "
							>
								<X size={10} />
								Clear all
							</Button>
						)}
					</div>

					<div className="max-h-[300px] overflow-y-auto scrollbar-sleek pb-4">
						{/* Status */}
						<SectionLabel label="Status" />
						<CheckboxList
							options={statusOptions}
							selected={filters.status}
							onToggle={(v) => toggleArrayFilter("status", v)}
						/>

						{/* Zone */}
						<SectionLabel label="Zone" />
						<CheckboxList
							options={zoneOptions}
							selected={filters.zone}
							onToggle={(v) => toggleArrayFilter("zone", v)}
						/>

						{/* Event Type */}
						<SectionLabel label="Event Type" />
						<CheckboxList
							cols={1}
							options={eventTypeOptions}
							selected={filters.eventType}
							onToggle={(v) => toggleArrayFilter("eventType", v)}
						/>

						{/* Event Date Range */}
						<SectionLabel label="Event Date" />
						<DateInput
							label="From"
							value={filters.eventDateFrom}
							onChange={(v) => onChange({ eventDateFrom: v })}
						/>
						<DateInput
							label="To"
							value={filters.eventDateTo}
							onChange={(v) => onChange({ eventDateTo: v })}
						/>

						<DateInput
							label="Created Date"
							value={filters.createdDate}
							onChange={(v) => onChange({ createdDate: v })}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
