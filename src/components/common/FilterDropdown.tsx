import { useRef, useState, useEffect } from "react";
import { Filter, ChevronDown, X } from "lucide-react";

import Button from "./Button";
import Checkbox from "../FormElements/Checkbox";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterOption<T extends string = string> = {
	label: string;
	value: T;
	icon?: React.ReactNode;
};

type CheckboxSection = {
	type: "checkbox";
	label: string;
	options: FilterOption[];
	selected: string[];
	onToggle: (value: string) => void;
};

type DateRangeSection = {
	type: "daterange";
	label: string;
	from: string;
	to: string;
	onFromChange: (value: string) => void;
	onToChange: (value: string) => void;
};

export type FilterSection = CheckboxSection | DateRangeSection;

// Flat mode (original API) — kept for backwards compatibility
type FlatProps = {
	sections?: never;
	options: FilterOption[];
	value: string[];
	onChange: (value: string[]) => void;
};

// Sectioned mode (new API)
type SectionedProps = {
	sections: FilterSection[];
	options?: never;
	value?: never;
	onChange?: never;
};

type FilterDropdownProps = {
	label?: string;
	groupLabel?: string;
	className?: string;
	activeCount?: number; // for sectioned mode — pass in computed count
} & (FlatProps | SectionedProps);

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
	<p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 px-3 pt-3 pb-1">
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
	<div className="flex flex-col gap-1 px-3 py-1.5">
		<label className="text-[11px] text-gray-500">{label}</label>
		<input
			type="date"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="h-8 rounded-md border border-gray-200 px-2 text-sm text-gray-700 focus:outline-none focus:border-brand-primary"
		/>
	</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export function FilterDropdown({
	options,
	value = [],
	onChange,
	sections,
	label = "",
	groupLabel = "Filter by",
	className,
	activeCount,
}: FilterDropdownProps) {
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

	// flat mode toggle
	const toggle = (v: string) => {
		onChange?.(
			value.includes(v) ? value.filter((x) => x !== v) : [...value, v],
		);
	};

	// active count — flat mode uses value.length, sectioned mode uses passed activeCount
	const badgeCount = sections ? (activeCount ?? 0) : value.length;
	const isActive = badgeCount > 0;

	return (
		<div ref={ref} className={`relative ${className ?? ""}`}>
			<Button
				text={label}
				Icon={Filter}
				iconPosition="left"
				iconSize={"15"}
				size="sm"
				status={isActive ? "brand" : undefined}
				variant={isActive ? undefined : "outline"}
				onClick={() => setOpen((o) => !o)}
			>
				{isActive && (
					<span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-brand-primary text-[11px] font-semibold">
						{badgeCount}
					</span>
				)}
				<ChevronDown
					size={13}
					className={`transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</Button>

			{open && (
				<div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
						<span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
							{groupLabel}
						</span>
						{/* Clear all — flat mode */}
						{!sections && value.length > 0 && (
							<button
								type="button"
								onClick={() => onChange?.([])}
								className="flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:underline"
							>
								<X size={11} /> Clear all
							</button>
						)}
					</div>

					<div className="max-h-[420px] overflow-y-auto">
						{/* ── Flat mode (original) ── */}
						{!sections &&
							options.map((opt) => {
								const isSelected = value.includes(opt.value);
								return (
									<button
										key={opt.value}
										type="button"
										onClick={() => toggle(opt.value)}
										className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
									>
										<Checkbox
											checked={isSelected}
											onChange={() => toggle(opt.value)}
											size={16}
										/>
										{opt.icon && (
											<span className="text-current opacity-70">
												{opt.icon}
											</span>
										)}
										{opt.label}
									</button>
								);
							})}

						{/* ── Sectioned mode (new) ── */}
						{sections?.map((section) => (
							<div key={section.label}>
								<SectionLabel label={section.label} />

								{section.type === "checkbox" &&
									(section.options.length === 0 ? (
										<p className="px-3 py-2 text-sm text-gray-400 italic">
											Loading...
										</p>
									) : (
										section.options.map((opt) => (
											<button
												key={opt.value}
												type="button"
												onClick={() => section.onToggle(opt.value)}
												className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
											>
												<Checkbox
													checked={section.selected.includes(opt.value)}
													onChange={() => section.onToggle(opt.value)}
													size={16}
												/>
												{opt.icon && (
													<span className="text-current opacity-70">
														{opt.icon}
													</span>
												)}
												{opt.label}
											</button>
										))
									))}

								{section.type === "daterange" && (
									<div className="pb-1">
										<DateInput
											label="From"
											value={section.from}
											onChange={section.onFromChange}
										/>
										<DateInput
											label="To"
											value={section.to}
											onChange={section.onToChange}
										/>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
