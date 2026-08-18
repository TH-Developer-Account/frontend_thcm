import { ChevronDown, Filter, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import Button from "../../../../../components/common/Button";
import Checkbox from "../../../../../components/forms/Checkbox";
import type { EpcFilters } from "../../types/epc.types";

type OptionItem = {
	label: string;
	value: string;
};

type EpcFilterDropdownProps = {
	filters: EpcFilters;
	onChange: (updated: Partial<EpcFilters>) => void;
	onClearAll: () => void;
	activeFilterCount: number;
	zoneOptions: readonly OptionItem[];
	eventTypeOptions: readonly OptionItem[];
	statusOptions: readonly OptionItem[];
	className?: string;
};

type FilterArrayKey = "status" | "zone" | "eventType";

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
) => classNames.filter(Boolean).join(" ");

const SectionLabel = ({ label }: { label: string }) => (
	<div className="epc-filter-section-label">
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
		<div className="epc-filter-date-field">
			<label htmlFor={inputId} className="epc-filter-date-label">
				{label}
			</label>

			<input
				id={inputId}
				type="date"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="epc-filter-date-input"
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
	options: readonly OptionItem[];
	selected: string[];
	onToggle: (value: string) => void;
	columns?: 1 | 2;
}) => (
	<div
		className={joinClassNames(
			"epc-filter-options",
			columns === 1 ? "epc-filter-options-single" : "epc-filter-options-double",
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
						"epc-filter-option",
						isSelected && "epc-filter-option-selected",
					)}
					onClick={() => onToggle(option.value)}
				>
					<span className="epc-filter-option-checkbox" aria-hidden="true">
						<Checkbox
							label=""
							checked={isSelected}
							onChange={() => undefined}
							size={14}
						/>
					</span>

					<span className="epc-filter-option-label">{option.label}</span>
				</button>
			);
		})}
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
	className = "",
}: EpcFilterDropdownProps) => {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const panelId = useId();

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
		if (!open) {
			return;
		}

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

	const toggleArrayFilter = (key: FilterArrayKey, value: string) => {
		const currentValues = filters[key];

		onChange({
			[key]: currentValues.includes(value)
				? currentValues.filter((currentValue) => currentValue !== value)
				: [...currentValues, value],
		});
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
				"epc-filter-dropdown",
				open && "epc-filter-dropdown-open",
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
				className="epc-filter-trigger"
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={panelId}
				onClick={() => setOpen((current) => !current)}
				onKeyDown={handleTriggerKeyDown}
			>
				{activeFilterCount > 0 ? (
					<span
						className="epc-filter-count"
						aria-label={`${activeFilterCount} active filters`}
					>
						{activeFilterCount}
					</span>
				) : null}

				<ChevronDown
					size={14}
					className={joinClassNames(
						"epc-filter-trigger-chevron",
						open && "epc-filter-trigger-chevron-open",
					)}
					aria-hidden="true"
				/>
			</Button>

			{open ? (
				<div
					id={panelId}
					role="dialog"
					aria-label="EPC filters"
					className="epc-filter-panel"
				>
					<div className="epc-filter-panel-header">
						<div className="epc-filter-panel-heading">
							<Filter size={15} aria-hidden="true" />

							<span>Filters</span>
						</div>

						<div className="epc-filter-panel-header-actions">
							{activeFilterCount > 0 ? (
								<button
									type="button"
									className="epc-filter-clear"
									onClick={onClearAll}
								>
									<X size={13} aria-hidden="true" />

									<span>Clear all</span>
								</button>
							) : null}

							<button
								type="button"
								className="epc-filter-close"
								aria-label="Close filters"
								onClick={() => setOpen(false)}
							>
								<X size={16} aria-hidden="true" />
							</button>
						</div>
					</div>

					<div className="epc-filter-panel-content scrollbar-sleek">
						<section className="epc-filter-section">
							<SectionLabel label="Status" />

							<CheckboxList
								options={statusOptions}
								selected={filters.status}
								onToggle={(value) => toggleArrayFilter("status", value)}
							/>
						</section>

						<section className="epc-filter-section">
							<SectionLabel label="Zone" />

							<CheckboxList
								options={zoneOptions}
								selected={filters.zone}
								onToggle={(value) => toggleArrayFilter("zone", value)}
							/>
						</section>

						<section className="epc-filter-section">
							<SectionLabel label="Event type" />

							<CheckboxList
								columns={1}
								options={eventTypeOptions}
								selected={filters.eventType}
								onToggle={(value) => toggleArrayFilter("eventType", value)}
							/>
						</section>

						<section className="epc-filter-section">
							<SectionLabel label="Event date" />

							<div className="epc-filter-date-grid">
								<DateInput
									label="From"
									value={filters.eventDateFrom}
									onChange={(value) =>
										onChange({
											eventDateFrom: value,
										})
									}
								/>

								<DateInput
									label="To"
									value={filters.eventDateTo}
									onChange={(value) =>
										onChange({
											eventDateTo: value,
										})
									}
								/>
							</div>
						</section>

						<section className="epc-filter-section">
							<SectionLabel label="Created date" />

							<DateInput
								label="Created on"
								value={filters.createdDate}
								onChange={(value) =>
									onChange({
										createdDate: value,
									})
								}
							/>
						</section>
					</div>
				</div>
			) : null}
		</div>
	);
};
