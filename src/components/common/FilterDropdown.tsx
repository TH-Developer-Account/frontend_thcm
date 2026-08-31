import { ChevronDown, Filter, X } from "lucide-react";
import {
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
} from "react";

import Button from "./Button";
import Checkbox from "../forms/Checkbox";

export type FilterOption = {
	label: string;
	value: string;
};

type StringArrayKey<T extends object> = {
	[K in keyof T]-?: T[K] extends string[] ? K : never;
}[keyof T] &
	string;

type StringKey<T extends object> = {
	[K in keyof T]-?: T[K] extends string ? K : never;
}[keyof T] &
	string;

export type CheckboxFilterSection<TFilters extends object> = {
	type: "checkbox";
	key: StringArrayKey<TFilters>;
	label: string;
	options: readonly FilterOption[];
	columns?: 1 | 2;
};

export type DateFilterSection<TFilters extends object> = {
	type: "date";
	key: StringKey<TFilters>;
	label: string;
	inputLabel: string;
};

export type DateRangeFilterSection<TFilters extends object> = {
	type: "dateRange";
	label: string;
	fromKey: StringKey<TFilters>;
	toKey: StringKey<TFilters>;
	fromLabel?: string;
	toLabel?: string;
};

export type FilterSection<TFilters extends object> =
	| CheckboxFilterSection<TFilters>
	| DateFilterSection<TFilters>
	| DateRangeFilterSection<TFilters>;

type FilterDropdownProps<TFilters extends object> = {
	filters: TFilters;
	sections: readonly FilterSection<TFilters>[];
	onChange: (updated: Partial<TFilters>) => void;
	onClearAll: () => void;
	activeFilterCount?: number;
	title?: string;
	ariaLabel?: string;
	className?: string;
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const SectionLabel = ({ label }: { label: string }) => (
	<div className="filter-dropdown-section-label">
		<span>{label}</span>
	</div>
);

const DateInput = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) => {
	const inputId = useId();

	return (
		<div className="filter-dropdown-date-field">
			<label htmlFor={inputId} className="filter-dropdown-date-label">
				{label}
			</label>

			<input
				id={inputId}
				type="date"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="filter-dropdown-date-input"
			/>
		</div>
	);
};

const CheckboxList = ({
	options,
	selected,
	onToggle,
	columns = 2,
}: {
	options: readonly FilterOption[];
	selected: string[];
	onToggle: (value: string) => void;
	columns?: 1 | 2;
}) => (
	<div
		className={joinClassNames(
			"filter-dropdown-options",
			columns === 1
				? "filter-dropdown-options-single"
				: "filter-dropdown-options-double",
		)}
	>
		{options.map((option) => {
			const isSelected = selected.includes(option.value);

			return (
				<button
					key={option.value}
					type="button"
					role="checkbox"
					aria-checked={isSelected}
					className={joinClassNames(
						"filter-dropdown-option",
						isSelected && "filter-dropdown-option-selected",
					)}
					onClick={() => onToggle(option.value)}
				>
					<span className="filter-dropdown-option-checkbox" aria-hidden="true">
						<Checkbox
							label=""
							checked={isSelected}
							onChange={() => undefined}
							size={14}
						/>
					</span>

					<span className="filter-dropdown-option-label">{option.label}</span>
				</button>
			);
		})}
	</div>
);

const calculateActiveFilterCount = <TFilters extends object>(
	filters: TFilters,
	sections: readonly FilterSection<TFilters>[],
): number => {
	const countedKeys = new Set<string>();

	return sections.reduce((count, section) => {
		if (section.type === "checkbox") {
			if (countedKeys.has(section.key)) {
				return count;
			}

			countedKeys.add(section.key);

			const value = filters[section.key];

			return count + (Array.isArray(value) ? value.length : 0);
		}

		if (section.type === "date") {
			if (countedKeys.has(section.key)) {
				return count;
			}

			countedKeys.add(section.key);

			return count + (filters[section.key] ? 1 : 0);
		}

		let updatedCount = count;

		if (!countedKeys.has(section.fromKey)) {
			countedKeys.add(section.fromKey);
			updatedCount += filters[section.fromKey] ? 1 : 0;
		}

		if (!countedKeys.has(section.toKey)) {
			countedKeys.add(section.toKey);
			updatedCount += filters[section.toKey] ? 1 : 0;
		}

		return updatedCount;
	}, 0);
};

export const FilterDropdown = <TFilters extends object>({
	filters,
	sections,
	onChange,
	onClearAll,
	activeFilterCount: activeFilterCountOverride,
	title = "Filters",
	ariaLabel = "Filters",
	className = "",
}: FilterDropdownProps<TFilters>) => {
	const [open, setOpen] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const panelId = useId();

	const activeFilterCount = useMemo(
		() =>
			activeFilterCountOverride ??
			calculateActiveFilterCount(filters, sections),
		[activeFilterCountOverride, filters, sections],
	);

	useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, []);

	useEffect(() => {
		if (!open) return;

		const handleEscape = (event: globalThis.KeyboardEvent) => {
			if (event.key === "Escape") {
				setOpen(false);
			}
		};

		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [open]);

	const toggleArrayFilter = (key: StringArrayKey<TFilters>, value: string) => {
		const currentValues = filters[key] as string[];

		const updatedValues = currentValues.includes(value)
			? currentValues.filter((currentValue) => currentValue !== value)
			: [...currentValues, value];

		onChange({
			[key]: updatedValues,
		} as Partial<TFilters>);
	};

	const updateStringFilter = (key: StringKey<TFilters>, value: string) => {
		onChange({
			[key]: value,
		} as Partial<TFilters>);
	};

	const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setOpen(true);
		}
	};

	return (
		<div
			ref={containerRef}
			className={joinClassNames(
				"filter-dropdown",
				open && "filter-dropdown-open",
				className,
			)}
		>
			<Button
				type="button"
				appearance="standard"
				variant="outline"
				size="sm"
				Icon={Filter}
				iconPosition="left"
				iconSize={15}
				className="filter-dropdown-trigger"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((current) => !current)}
				onKeyDown={handleTriggerKeyDown}
			>
				{activeFilterCount > 0 ? (
					<span
						className="filter-dropdown-count"
						aria-label={`${activeFilterCount} active filters`}
					>
						{activeFilterCount}
					</span>
				) : null}

				<ChevronDown
					size={14}
					className={joinClassNames(
						"filter-dropdown-trigger-chevron",
						open && "filter-dropdown-trigger-chevron-open",
					)}
					aria-hidden="true"
				/>
			</Button>

			{open ? (
				<div
					id={panelId}
					role="dialog"
					aria-label={ariaLabel}
					className="filter-dropdown-panel"
				>
					<div className="filter-dropdown-panel-header">
						<div className="filter-dropdown-panel-heading">
							<Filter size={15} aria-hidden="true" />
							<span>{title}</span>
						</div>

						<div className="filter-dropdown-panel-header-actions">
							{activeFilterCount > 0 ? (
								<button
									type="button"
									className="filter-dropdown-clear"
									onClick={onClearAll}
								>
									<X size={13} aria-hidden="true" />
									<span>Clear all</span>
								</button>
							) : null}

							<button
								type="button"
								className="filter-dropdown-close"
								aria-label="Close filters"
								onClick={() => setOpen(false)}
							>
								<X size={16} aria-hidden="true" />
							</button>
						</div>
					</div>

					<div className="filter-dropdown-panel-content scrollbar-sleek">
						{sections.map((section, index) => (
							<section
								key={`${section.label}-${index}`}
								className="filter-dropdown-section"
							>
								<SectionLabel label={section.label} />

								{section.type === "checkbox" ? (
									<CheckboxList
										columns={section.columns}
										options={section.options}
										selected={filters[section.key] as string[]}
										onToggle={(value) => toggleArrayFilter(section.key, value)}
									/>
								) : null}

								{section.type === "date" ? (
									<DateInput
										label={section.inputLabel}
										value={filters[section.key] as string}
										onChange={(value) => updateStringFilter(section.key, value)}
									/>
								) : null}

								{section.type === "dateRange" ? (
									<div className="filter-dropdown-date-grid">
										<DateInput
											label={section.fromLabel ?? "From"}
											value={filters[section.fromKey] as string}
											onChange={(value) =>
												updateStringFilter(section.fromKey, value)
											}
										/>

										<DateInput
											label={section.toLabel ?? "To"}
											value={filters[section.toKey] as string}
											onChange={(value) =>
												updateStringFilter(section.toKey, value)
											}
										/>
									</div>
								) : null}
							</section>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
};

export default FilterDropdown;
