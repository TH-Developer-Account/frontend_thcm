// modules/audit/dealerAudit/cycle/components/CycleWizardSteps.tsx
//
// The four panels of the "Create audit cycle" wizard. Presentational only:
// they get values + errors and emit changes. No API calls, no navigation.
//   Step 2  select dealers   : search + Zone/State/Facility filters, banner,
//                              sortable table, paging.
//   Step 3  assign reviewers : zone filter, auto-assign, bulk assign,
//                              per-row reviewer, workload + fallback panel.

import { Check, Clock, Info, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import Button from "../../../../../components/common/Button";
import DatePickerInput from "../../../../../components/common/DatePickerInput";
import FormInput from "../../../../../components/forms/FormInput";
import SelectInput from "../../../../../components/forms/SelectInput";
import {
	fromDateInputValue,
	toDateInputValue,
} from "../../../shared/execution/audit-execution.format";
import { dealerAuditContent as auditContent } from "../../dealer-audit.content";
import { formatPeriodLabel, getSelectableYears } from "../../dealer-audit.sla";
import type {
	DealerAuditDealerOption,
	DealerAuditPeriodType,
	DealerAuditQuarter,
	DealerAuditReviewerOption,
} from "../../dealer-audit.types";
import {
	dealerCycleContent,
	formatCycleMessage as format,
} from "../dealer-cycle.content";
import { countUnassigned } from "../dealer-cycle.logic";
import type { CycleStepErrors } from "../dealer-cycle.schemas";
import type {
	CreateAuditCycleFormValues,
	DealerEligibility,
	ReviewerAssignSource,
} from "../dealer-cycle.types";

const text = dealerCycleContent.wizard;

const QUARTERS: readonly DealerAuditQuarter[] = [1, 2, 3, 4];
const PERIOD_TYPES: readonly DealerAuditPeriodType[] = ["QUARTERLY", "YEARLY"];

const PAGE_SIZE = 10;
/** Filter value meaning "no filter". */
const ALL = "";
const UNASSIGNED_ONLY = "UNASSIGNED";
/**
 * Zone and State filters are hidden until the dealer list carries zone and
 * state (the business-partner list has neither yet). All the filter code stays
 * in place: set this to true to bring them back.
 */
const SHOW_ZONE_FILTERS = false;

const FACILITY_SHORT: Record<string, string> = text.facility.short;
const FACILITY_LONG: Record<string, string> = text.facility.long;

const CELL_HEAD = "px-3 py-2 text-left text-xs font-semibold text-fg-label";
const CELL = "px-3 py-3 align-middle text-sm text-fg";
const TABLE_WRAP = "overflow-x-auto";
const PANEL = "overflow-hidden rounded-lg border border-line bg-surface";
const PILL =
	"inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium";
const PILL_GREEN = `${PILL} border-positive-line bg-positive-bg text-positive-text`;
const PILL_AMBER = `${PILL} border-caution-line bg-caution-bg text-caution-text`;
const PILL_GREY = `${PILL} border-line-strong bg-surface-muted text-fg-secondary`;

interface Option {
	value: string;
	label: string;
}

const dealerTitle = (dealer: DealerAuditDealerOption): string =>
	[dealer.name, dealer.location].filter(Boolean).join(", ");

const uniqueSorted = (
	values: ReadonlyArray<string | null | undefined>,
): string[] =>
	[...new Set(values.filter((value): value is string => Boolean(value)))].sort(
		(a, b) => a.localeCompare(b),
	);

const allPlus = (
	allLabel: string,
	values: readonly string[],
	template: string,
	labelOf: (value: string) => string = (value) => value,
): Option[] => [
	{ value: ALL, label: allLabel },
	...values.map((value) => ({
		value,
		label: format(template, { value: labelOf(value) }),
	})),
];

function paginate<T>(rows: readonly T[], requestedPage: number) {
	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	const page = Math.min(Math.max(1, requestedPage), totalPages);
	const start = (page - 1) * PAGE_SIZE;
	return {
		page,
		totalPages,
		total: rows.length,
		from: rows.length === 0 ? 0 : start + 1,
		to: Math.min(start + PAGE_SIZE, rows.length),
		rows: rows.slice(start, start + PAGE_SIZE),
	};
}

// ── Shared bits ───────────────────────────────────────────────────────

function SearchBox({
	value,
	placeholder,
	onChange,
}: {
	value: string;
	placeholder: string;
	onChange: (value: string) => void;
}) {
	return (
		<div className="relative min-w-0 flex-1 basis-60">
			<Search
				size={16}
				aria-hidden="true"
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
			/>
			<input
				type="search"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				aria-label={placeholder}
				className="h-11 w-full rounded-md border border-line-interactive bg-surface pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus"
			/>
		</div>
	);
}

function FilterSelect({
	ariaLabel,
	options,
	value,
	disabled,
	onChange,
}: {
	ariaLabel: string;
	options: readonly Option[];
	value: string;
	disabled: boolean;
	onChange: (value: string) => void;
}) {
	return (
		<div className="min-w-40 flex-1 basis-40 sm:flex-none sm:basis-44">
			<SelectInput
				aria-label={ariaLabel}
				options={options}
				value={options.find((option) => option.value === value) ?? null}
				onChange={(option) => onChange(option?.value ?? ALL)}
				isDisabled={disabled}
				isSearchable={false}
			/>
		</div>
	);
}

function Pager({
	page,
	totalPages,
	from,
	to,
	total,
	disabled,
	onPage,
}: {
	page: number;
	totalPages: number;
	from: number;
	to: number;
	total: number;
	disabled: boolean;
	onPage: (page: number) => void;
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
			<p
				role="status"
				aria-live="polite"
				className="text-sm tabular-nums text-fg-secondary"
			>
				{format(text.pagination.showing, { from, to, total })}
			</p>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					text={text.pagination.previous}
					appearance="standard"
					variant="outline"
					size="sm"
					disabled={disabled || page <= 1}
					onClick={() => onPage(page - 1)}
				/>
				<Button
					type="button"
					text={text.pagination.next}
					appearance="standard"
					variant="outline"
					size="sm"
					disabled={disabled || page >= totalPages}
					onClick={() => onPage(page + 1)}
				/>
			</div>
		</div>
	);
}

type SortDirection = "asc" | "desc";

function SortHeader({
	label,
	active,
	direction,
	onClick,
}: {
	label: string;
	active: boolean;
	direction: SortDirection;
	onClick: () => void;
}) {
	return (
		<th
			scope="col"
			className={CELL_HEAD}
			aria-sort={
				active ? (direction === "asc" ? "ascending" : "descending") : "none"
			}
		>
			<button
				type="button"
				onClick={onClick}
				className={`inline-flex items-center gap-1 rounded-sm font-semibold hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
					active ? "text-accent-text" : ""
				}`}
			>
				{label}
				<span aria-hidden="true" className="w-3 text-[10px]">
					{active ? (direction === "asc" ? "▲" : "▼") : ""}
				</span>
			</button>
		</th>
	);
}

// ── Step 1: details ───────────────────────────────────────────────────

interface DetailsStepProps {
	values: CreateAuditCycleFormValues;
	errors: CycleStepErrors;
	templateOptions: readonly Option[];
	isLoadingTemplates: boolean;
	isDisabled: boolean;
	onChange: (patch: Partial<CreateAuditCycleFormValues>) => void;
}

export function CycleDetailsStep({
	values,
	errors,
	templateOptions,
	isLoadingTemplates,
	isDisabled,
	onChange,
}: DetailsStepProps) {
	const yearOptions = useMemo<Option[]>(
		() =>
			getSelectableYears().map((year) => ({
				value: String(year),
				label: formatPeriodLabel({ type: "YEARLY", year, quarter: null }),
			})),
		[],
	);
	const periodTypeOptions = PERIOD_TYPES.map((value) => ({
		value,
		label: auditContent.ui.create.periodTypes[value],
	}));
	const quarterOptions = QUARTERS.map((quarter) => ({
		value: String(quarter),
		label: auditContent.ui.list.quarters[quarter],
	}));

	// The form keeps yyyy-mm-dd; the date picker works with a Date.
	const dueDateValue = useMemo(
		() => fromDateInputValue(values.dueDate),
		[values.dueDate],
	);

	return (
		<div className="space-y-4">
			<FormInput
				type="text"
				label={text.fields.name}
				required
				placeholder={text.fields.namePlaceholder}
				value={values.name}
				disabled={isDisabled}
				error={errors.name}
				onChange={(event) => onChange({ name: event.target.value })}
			/>

			<SelectInput
				label={text.fields.template}
				required
				options={templateOptions}
				value={
					templateOptions.find((o) => o.value === values.templateId) ?? null
				}
				onChange={(option) => onChange({ templateId: option?.value ?? "" })}
				isDisabled={isDisabled || isLoadingTemplates}
				placeholder={text.fields.templatePlaceholder}
				error={errors.templateId}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
				<SelectInput
					label={text.fields.periodType}
					required
					options={periodTypeOptions}
					value={
						periodTypeOptions.find((o) => o.value === values.periodType) ?? null
					}
					onChange={(option) => {
						const next = PERIOD_TYPES.find((type) => type === option?.value);
						if (!next) return;
						onChange({
							periodType: next,
							quarter: next === "YEARLY" ? null : (values.quarter ?? 1),
						});
					}}
					isDisabled={isDisabled}
				/>

				<SelectInput
					label={text.fields.year}
					required
					options={yearOptions}
					value={
						yearOptions.find((o) => o.value === String(values.year)) ?? null
					}
					onChange={(option) =>
						onChange({ year: option ? Number(option.value) : values.year })
					}
					isDisabled={isDisabled}
				/>

				{values.periodType === "QUARTERLY" ? (
					<SelectInput
						label={text.fields.quarter}
						required
						options={quarterOptions}
						value={
							quarterOptions.find((o) => o.value === String(values.quarter)) ??
							null
						}
						onChange={(option) =>
							onChange({
								quarter:
									QUARTERS.find((q) => String(q) === option?.value) ?? null,
							})
						}
						isDisabled={isDisabled}
						error={errors.quarter}
					/>
				) : null}

				<DatePickerInput
					mode="single"
					label={text.fields.dueDate}
					required
					disablePast
					disabled={isDisabled}
					value={dueDateValue}
					onChange={(date) =>
						onChange({
							dueDate: date instanceof Date ? toDateInputValue(date) : "",
						})
					}
					error={errors.dueDate}
				/>
			</div>
		</div>
	);
}

// ── Step 2: select dealers ────────────────────────────────────────────

interface DealersStepProps {
	dealers: readonly DealerAuditDealerOption[];
	eligibility: readonly DealerEligibility[];
	selectedIds: readonly string[];
	error: string | undefined;
	isLoading: boolean;
	isDisabled: boolean;
	periodType: DealerAuditPeriodType;
	/** "Q3" / "FY 2026": used in the banner and the "audit exists" cell. */
	periodShort: string;
	onChange: (dealerIds: string[]) => void;
}

type DealerSortKey = "name" | "facility" | "zone";

const lastAuditLabel = (dealer: DealerAuditDealerOption): string => {
	const last = dealer.lastAudit;
	if (!last) return text.dealers.noLastAudit;
	return last.finalScore !== null
		? `${last.periodLabel} · ${last.finalScore}`
		: last.periodLabel;
};

export function CycleDealersStep({
	dealers,
	eligibility,
	selectedIds,
	error,
	isLoading,
	isDisabled,
	periodType,
	periodShort,
	onChange,
}: DealersStepProps) {
	const [search, setSearch] = useState("");
	const [zoneFilter, setZoneFilter] = useState(ALL);
	const [stateFilter, setStateFilter] = useState(ALL);
	const [facilityFilter, setFacilityFilter] = useState(ALL);
	const [sort, setSort] = useState<{
		key: DealerSortKey;
		direction: SortDirection;
	}>({
		key: "name",
		direction: "asc",
	});
	const [page, setPage] = useState(1);

	const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
	const byId = useMemo(
		() => new Map(eligibility.map((entry) => [entry.dealerId, entry])),
		[eligibility],
	);

	const zoneOptions = useMemo(
		() =>
			allPlus(
				text.filters.zoneAll,
				uniqueSorted(dealers.map((d) => d.zone)),
				text.filters.zone,
			),
		[dealers],
	);
	const stateOptions = useMemo(
		() =>
			allPlus(
				text.filters.stateAll,
				uniqueSorted(dealers.map((d) => d.state)),
				text.filters.state,
			),
		[dealers],
	);
	const facilityOptions = useMemo(
		() =>
			allPlus(
				text.filters.facilityAll,
				uniqueSorted(dealers.map((d) => d.facilityType)),
				text.filters.facility,
				(value) => FACILITY_SHORT[value] ?? value,
			),
		[dealers],
	);

	const rows = useMemo(() => {
		const needle = search.trim().toLowerCase();
		const sortValue = (dealer: DealerAuditDealerOption): string => {
			if (sort.key === "zone") return dealer.zone ?? "";
			if (sort.key === "facility") return dealer.facilityType ?? "";
			return dealer.name;
		};
		const factor = sort.direction === "asc" ? 1 : -1;
		return dealers
			.filter(
				(dealer) =>
					(zoneFilter === ALL || dealer.zone === zoneFilter) &&
					(stateFilter === ALL || dealer.state === stateFilter) &&
					(facilityFilter === ALL || dealer.facilityType === facilityFilter) &&
					(needle === "" ||
						[
							dealer.name,
							dealer.code ?? "",
							dealer.location,
							dealer.zone ?? "",
							dealer.state ?? "",
						]
							.join(" ")
							.toLowerCase()
							.includes(needle)),
			)
			.sort(
				(a, b) =>
					factor * sortValue(a).localeCompare(sortValue(b)) ||
					a.name.localeCompare(b.name),
			);
	}, [dealers, search, zoneFilter, stateFilter, facilityFilter, sort]);

	const eligibleOf = (dealerId: string): boolean =>
		byId.get(dealerId)?.isEligible ?? true;
	const eligibleRows = rows.filter((dealer) => eligibleOf(dealer.id));
	const selectedInRows = rows.filter((dealer) =>
		selected.has(dealer.id),
	).length;
	const skippedAudited = rows.filter(
		(dealer) => byId.get(dealer.id)?.reason === "ALREADY_AUDITED",
	).length;
	const skippedMismatch = rows.filter(
		(dealer) => byId.get(dealer.id)?.reason === "FACILITY_MISMATCH",
	).length;
	const allEligibleSelected =
		eligibleRows.length > 0 &&
		eligibleRows.every((dealer) => selected.has(dealer.id));
	const hasFilters =
		search !== "" ||
		zoneFilter !== ALL ||
		stateFilter !== ALL ||
		facilityFilter !== ALL;
	const paged = paginate(rows, page);
	const periodNoun = text.periodNoun[periodType];

	const filter = (apply: () => void): void => {
		apply();
		setPage(1);
	};
	const toggleSort = (key: DealerSortKey): void =>
		setSort((current) => ({
			key,
			direction:
				current.key === key && current.direction === "asc" ? "desc" : "asc",
		}));

	const toggle = (dealerId: string): void =>
		onChange(
			selected.has(dealerId)
				? selectedIds.filter((id) => id !== dealerId)
				: [...selectedIds, dealerId],
		);
	const selectAllMatching = (): void =>
		onChange([...new Set([...selectedIds, ...eligibleRows.map((d) => d.id)])]);
	const clearMatching = (): void => {
		const hide = new Set(eligibleRows.map((d) => d.id));
		onChange(selectedIds.filter((id) => !hide.has(id)));
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<SearchBox
					value={search}
					placeholder={text.dealers.searchPlaceholder}
					onChange={(value) => filter(() => setSearch(value))}
				/>
				{SHOW_ZONE_FILTERS && (
					<FilterSelect
						ariaLabel={text.filters.zoneAll}
						options={zoneOptions}
						value={zoneFilter}
						disabled={isDisabled}
						onChange={(value) => filter(() => setZoneFilter(value))}
					/>
				)}
				{SHOW_ZONE_FILTERS && (
					<FilterSelect
						ariaLabel={text.filters.stateAll}
						options={stateOptions}
						value={stateFilter}
						disabled={isDisabled}
						onChange={(value) => filter(() => setStateFilter(value))}
					/>
				)}
				<FilterSelect
					ariaLabel={text.filters.facilityAll}
					options={facilityOptions}
					value={facilityFilter}
					disabled={isDisabled}
					onChange={(value) => filter(() => setFacilityFilter(value))}
				/>
			</div>

			<div className={PANEL}>
				<div
					role="status"
					aria-live="polite"
					className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-accent-subtle px-3 py-2.5 text-sm text-fg"
				>
					<p>
						<strong className="tabular-nums">
							{format(text.dealers.bannerCount, {
								selected: selectedInRows,
								total: rows.length,
							})}
						</strong>{" "}
						{text.dealers.bannerMatching}
						{skippedAudited > 0
							? ` ${format(text.dealers.bannerSkipped, { count: skippedAudited, period: periodShort })}`
							: ""}
						{skippedMismatch > 0
							? ` ${format(text.dealers.bannerMismatch, { count: skippedMismatch })}`
							: ""}
					</p>
					<div className="flex items-center gap-3">
						{hasFilters ? (
							<button
								type="button"
								className="rounded-sm font-medium text-fg-secondary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
								onClick={() =>
									filter(() => {
										setSearch("");
										setZoneFilter(ALL);
										setStateFilter(ALL);
										setFacilityFilter(ALL);
									})
								}
							>
								{dealerCycleContent.common.clearFilters}
							</button>
						) : null}
						<button
							type="button"
							className="rounded-sm font-semibold text-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
							disabled={isDisabled || eligibleRows.length === 0}
							onClick={allEligibleSelected ? clearMatching : selectAllMatching}
						>
							{allEligibleSelected
								? text.dealers.clearAll
								: format(text.dealers.selectAll, {
										count: eligibleRows.length,
									})}
						</button>
					</div>
				</div>

				{error ? (
					<p className="form-error-text px-3 py-2" role="alert">
						{error}
					</p>
				) : null}

				{isLoading ? (
					<p
						className="px-3 py-6 text-center text-sm text-fg-secondary"
						role="status"
					>
						{auditContent.ui.create.loading}
					</p>
				) : rows.length === 0 ? (
					<p className="px-3 py-6 text-center text-sm text-fg-secondary">
						{text.dealers.empty}
					</p>
				) : (
					<>
						<div className={TABLE_WRAP}>
							<table className="w-full min-w-[46rem] border-collapse">
								<thead>
									<tr className="border-b border-line bg-surface-muted">
										<th scope="col" className="w-12 px-3 py-2">
											<span className="sr-only">
												{text.dealers.columns.select}
											</span>
										</th>
										<SortHeader
											label={text.dealers.columns.dealer}
											active={sort.key === "name"}
											direction={sort.direction}
											onClick={() => toggleSort("name")}
										/>
										<SortHeader
											label={text.dealers.columns.facility}
											active={sort.key === "facility"}
											direction={sort.direction}
											onClick={() => toggleSort("facility")}
										/>
										<SortHeader
											label={text.dealers.columns.zone}
											active={sort.key === "zone"}
											direction={sort.direction}
											onClick={() => toggleSort("zone")}
										/>
										<th scope="col" className={CELL_HEAD}>
											{text.dealers.columns.lastAudit}
										</th>
										<th scope="col" className={CELL_HEAD}>
											{text.dealers.columns.eligibility}
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-line">
									{paged.rows.map((dealer) => {
										const entry = byId.get(dealer.id);
										const eligible = entry?.isEligible ?? true;
										const audited = entry?.reason === "ALREADY_AUDITED";
										return (
											<tr
												key={dealer.id}
												className={
													selected.has(dealer.id)
														? "bg-accent-subtle"
														: eligible
															? "hover:bg-surface-hover"
															: "bg-surface-muted"
												}
											>
												<td className="px-3 py-1">
													<label className="flex min-h-11 cursor-pointer items-center justify-center">
														<input
															type="checkbox"
															className="size-5 accent-[var(--color-brand-solid)]"
															aria-label={format(text.dealers.selectRow, {
																dealer: dealer.name,
															})}
															checked={selected.has(dealer.id)}
															disabled={isDisabled || !eligible}
															onChange={() => toggle(dealer.id)}
														/>
													</label>
												</td>
												<td className={`${CELL} font-semibold`}>
													<span className="block break-words">
														{dealerTitle(dealer)}
													</span>
												</td>
												<td className={CELL}>
													{dealer.facilityType
														? (FACILITY_SHORT[dealer.facilityType] ??
															dealer.facilityType)
														: "—"}
												</td>
												<td className={CELL}>{dealer.zone ?? "—"}</td>
												<td className={CELL}>
													{audited
														? format(text.dealers.auditExists, {
																period: periodShort,
															})
														: lastAuditLabel(dealer)}
												</td>
												<td className={CELL}>
													{eligible ? (
														<span className={PILL_GREEN}>
															<Check size={12} aria-hidden="true" />
															{text.dealers.eligible}
														</span>
													) : (
														<span className={PILL_AMBER}>
															<Clock size={12} aria-hidden="true" />
															{audited
																? format(text.ineligibleShort.ALREADY_AUDITED, {
																		period: periodNoun,
																	})
																: text.ineligibleShort.FACILITY_MISMATCH}
														</span>
													)}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						<div className="border-t border-line">
							<Pager
								page={paged.page}
								totalPages={paged.totalPages}
								from={paged.from}
								to={paged.to}
								total={paged.total}
								disabled={isDisabled}
								onPage={setPage}
							/>
						</div>
					</>
				)}
			</div>
		</div>
	);
}

// ── Step 3: assign reviewers ──────────────────────────────────────────

interface ReviewersStepProps {
	dealers: readonly DealerAuditDealerOption[];
	reviewers: readonly DealerAuditReviewerOption[];
	selectedIds: readonly string[];
	reviewerByDealer: Readonly<Record<string, string>>;
	sourceByDealer: Readonly<Record<string, ReviewerAssignSource>>;
	fallbackReviewerId: string;
	error: string | undefined;
	isDisabled: boolean;
	onAutoAssign: () => void;
	onChange: (dealerId: string, reviewerId: string) => void;
	/** Sets one reviewer on many dealers at once (all dealers currently shown). */
	onBulkChange: (dealerIds: readonly string[], reviewerId: string) => void;
	onFallbackChange: (reviewerId: string) => void;
}

export function CycleReviewersStep({
	dealers,
	reviewers,
	selectedIds,
	reviewerByDealer,
	sourceByDealer,
	fallbackReviewerId,
	error,
	isDisabled,
	onAutoAssign,
	onChange,
	onBulkChange,
	onFallbackChange,
}: ReviewersStepProps) {
	const [search, setSearch] = useState("");
	const [zoneFilter, setZoneFilter] = useState(ALL);
	const [assignmentFilter, setAssignmentFilter] = useState(ALL);
	const [page, setPage] = useState(1);

	const dealerById = useMemo(
		() => new Map(dealers.map((d) => [d.id, d])),
		[dealers],
	);
	const reviewerOptions = useMemo<Option[]>(
		() =>
			reviewers.map((reviewer) => {
				const base = reviewer.designation
					? `${reviewer.name} — ${reviewer.designation}`
					: reviewer.name;
				return {
					value: reviewer.id,
					label: `${base} (${format(text.reviewers.workload, { count: reviewer.openAudits })})`,
				};
			}),
		[reviewers],
	);
	const plainReviewerOptions = useMemo<Option[]>(
		() =>
			reviewers.map((reviewer) => ({
				value: reviewer.id,
				label: reviewer.name,
			})),
		[reviewers],
	);
	const assignmentOptions: Option[] = [
		{ value: ALL, label: text.filters.assignmentAll },
		{ value: UNASSIGNED_ONLY, label: text.filters.unassignedOnly },
	];

	const selectedDealers = useMemo(
		() => selectedIds.map((id) => ({ id, dealer: dealerById.get(id) })),
		[selectedIds, dealerById],
	);
	const zoneOptions = useMemo(
		() =>
			allPlus(
				text.filters.zoneAll,
				uniqueSorted(selectedDealers.map((row) => row.dealer?.zone)),
				text.filters.zone,
			),
		[selectedDealers],
	);

	const rows = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return selectedDealers
			.filter(
				(row) =>
					(zoneFilter === ALL || row.dealer?.zone === zoneFilter) &&
					(assignmentFilter !== UNASSIGNED_ONLY || !reviewerByDealer[row.id]) &&
					(needle === "" ||
						[
							row.dealer?.name ?? "",
							row.dealer?.location ?? "",
							row.dealer?.code ?? "",
						]
							.join(" ")
							.toLowerCase()
							.includes(needle)),
			)
			.sort((a, b) =>
				(a.dealer?.name ?? a.id).localeCompare(b.dealer?.name ?? b.id),
			);
	}, [selectedDealers, search, zoneFilter, assignmentFilter, reviewerByDealer]);

	const paged = paginate(rows, page);
	const shownIds = rows.map((row) => row.id);
	const unassigned = countUnassigned(selectedIds, reviewerByDealer);
	const optionFor = (
		options: readonly Option[],
		reviewerId: string,
	): Option | null =>
		options.find((option) => option.value === reviewerId) ?? null;

	const perReviewer = useMemo(() => {
		const counts = new Map<string, number>();
		for (const id of selectedIds) {
			const reviewerId = reviewerByDealer[id];
			if (reviewerId) counts.set(reviewerId, (counts.get(reviewerId) ?? 0) + 1);
		}
		return counts;
	}, [selectedIds, reviewerByDealer]);
	const barMax = Math.max(1, unassigned, ...perReviewer.values());

	const filter = (apply: () => void): void => {
		apply();
		setPage(1);
	};

	const sourcePill = (dealerId: string) => {
		if (reviewerByDealer[dealerId]) {
			const source = sourceByDealer[dealerId] ?? "MANUAL";
			return (
				<span className={PILL_GREY}>
					<Clock size={12} aria-hidden="true" />
					{text.reviewers.source[source]}
				</span>
			);
		}
		return fallbackReviewerId ? (
			<span className={PILL_GREY}>{text.reviewers.source.FALLBACK}</span>
		) : (
			<span className={PILL_AMBER}>
				<Clock size={12} aria-hidden="true" />
				{text.reviewers.source.NONE}
			</span>
		);
	};

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
			<div className="min-w-0 space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<SearchBox
						value={search}
						placeholder={text.reviewers.searchPlaceholder}
						onChange={(value) => filter(() => setSearch(value))}
					/>
					{SHOW_ZONE_FILTERS && (
						<FilterSelect
							ariaLabel={text.filters.zoneAll}
							options={zoneOptions}
							value={zoneFilter}
							disabled={isDisabled}
							onChange={(value) => filter(() => setZoneFilter(value))}
						/>
					)}
					<Button
						type="button"
						text={text.reviewers.autoAssign}
						Icon={RefreshCw}
						appearance="standard"
						variant="outline"
						size="lg"
						disabled={isDisabled || reviewers.length === 0}
						onClick={onAutoAssign}
					/>
					<div className="min-w-40 flex-1 basis-40 sm:flex-none sm:basis-44">
						<SelectInput
							aria-label={text.reviewers.bulkAria}
							options={plainReviewerOptions}
							value={null}
							placeholder={text.reviewers.bulkPlaceholder}
							onChange={(option) => {
								if (option) onBulkChange(shownIds, option.value);
							}}
							isDisabled={
								isDisabled || reviewers.length === 0 || shownIds.length === 0
							}
							isSearchable={false}
						/>
					</div>
					<FilterSelect
						ariaLabel={text.filters.assignmentAll}
						options={assignmentOptions}
						value={assignmentFilter}
						disabled={isDisabled}
						onChange={(value) => filter(() => setAssignmentFilter(value))}
					/>
				</div>

				{error ? (
					<p className="form-error-text" role="alert">
						{error}
					</p>
				) : null}

				<div className={PANEL}>
					{rows.length === 0 ? (
						<p className="px-3 py-6 text-center text-sm text-fg-secondary">
							{text.reviewers.empty}
						</p>
					) : (
						<>
							<div className={TABLE_WRAP}>
								<table className="w-full min-w-[40rem] border-collapse">
									<thead>
										<tr className="border-b border-line bg-surface-muted">
											<th scope="col" className={CELL_HEAD}>
												{text.reviewers.columns.dealer}
											</th>
											<th scope="col" className={CELL_HEAD}>
												{text.reviewers.columns.zone}
											</th>
											<th scope="col" className={`${CELL_HEAD} w-64`}>
												{text.reviewers.columns.reviewer}
											</th>
											<th scope="col" className={CELL_HEAD}>
												{text.reviewers.columns.source}
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-line">
										{paged.rows.map(({ id, dealer }) => {
											const name = dealer ? dealerTitle(dealer) : id;
											return (
												<tr key={id} className="hover:bg-surface-hover">
													<td className={`${CELL} font-semibold`}>
														<span className="block break-words">{name}</span>
													</td>
													<td className={CELL}>{dealer?.zone ?? "—"}</td>
													<td className="px-3 py-2 align-middle">
														<SelectInput
															aria-label={format(text.reviewers.reviewerFor, {
																dealer: name,
															})}
															options={reviewerOptions}
															value={optionFor(
																reviewerOptions,
																reviewerByDealer[id] ?? "",
															)}
															onChange={(option) =>
																onChange(id, option?.value ?? "")
															}
															isDisabled={isDisabled}
															placeholder={text.reviewers.unassigned}
														/>
													</td>
													<td className={CELL}>{sourcePill(id)}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
							{unassigned > 0 ? (
								<p className="flex items-center gap-2 border-t border-caution-line bg-caution-bg px-3 py-2.5 text-sm text-fg">
									<Info
										size={16}
										aria-hidden="true"
										className="shrink-0 text-caution-text"
									/>
									{format(text.reviewers.missingWarning, { count: unassigned })}
								</p>
							) : null}
							<div className="border-t border-line">
								<Pager
									page={paged.page}
									totalPages={paged.totalPages}
									from={paged.from}
									to={paged.to}
									total={paged.total}
									disabled={isDisabled}
									onPage={setPage}
								/>
							</div>
						</>
					)}
				</div>
			</div>

			<aside className="space-y-4">
				<section
					aria-label={text.reviewers.workloadTitle}
					className="rounded-lg border border-line bg-surface p-4 shadow-sm"
				>
					<h3 className="text-sm font-semibold text-fg">
						{text.reviewers.workloadTitle}
					</h3>
					<ul className="mt-3 space-y-3">
						{reviewers.map((reviewer) => {
							const count = perReviewer.get(reviewer.id) ?? 0;
							return (
								<li key={reviewer.id}>
									<div className="flex items-baseline justify-between gap-2 text-sm text-fg">
										<span className="min-w-0 break-words">{reviewer.name}</span>
										<span className="shrink-0 text-xs font-medium tabular-nums text-fg-secondary">
											{format(text.reviewers.workloadCount, { count })}
										</span>
									</div>
									<div className="mt-1 h-1.5 rounded-full bg-line">
										<div
											className="h-full rounded-full bg-accent"
											style={{ width: `${(count / barMax) * 100}%` }}
										/>
									</div>
								</li>
							);
						})}
						<li>
							<div className="flex items-baseline justify-between gap-2 text-sm text-fg">
								<span>{text.reviewers.unassignedRow}</span>
								<span className="shrink-0 text-xs font-medium tabular-nums text-fg-secondary">
									{format(text.reviewers.workloadCount, { count: unassigned })}
								</span>
							</div>
							<div className="mt-1 h-1.5 rounded-full bg-line">
								<div
									className="h-full rounded-full bg-caution-text"
									style={{ width: `${(unassigned / barMax) * 100}%` }}
								/>
							</div>
						</li>
					</ul>
				</section>

				<section
					aria-label={text.reviewers.fallbackTitle}
					className="rounded-lg border border-line bg-surface p-4 shadow-sm"
				>
					<h3 className="text-sm font-semibold text-fg">
						{text.reviewers.fallbackTitle}
					</h3>
					<div className="mt-3">
						<SelectInput
							aria-label={text.reviewers.fallbackTitle}
							options={reviewerOptions}
							value={optionFor(reviewerOptions, fallbackReviewerId)}
							onChange={(option) => onFallbackChange(option?.value ?? "")}
							isDisabled={isDisabled || reviewers.length === 0}
							placeholder={text.reviewers.fallbackPlaceholder}
							isClearable
						/>
					</div>
					<p className="mt-2 text-xs text-fg-secondary">
						{text.reviewers.fallbackHelp}
					</p>
				</section>
			</aside>
		</div>
	);
}

// ── Step 4: confirm ───────────────────────────────────────────────────

interface ConfirmStepProps {
	values: CreateAuditCycleFormValues;
	templateLabel: string;
	reviewers: readonly DealerAuditReviewerOption[];
	onEditStep: (step: "DETAILS" | "DEALERS" | "REVIEWERS") => void;
}

export function CycleConfirmStep({
	values,
	templateLabel,
	reviewers,
	onEditStep,
}: ConfirmStepProps) {
	const c = text.confirm;
	const reviewerName = useMemo(
		() => new Map(reviewers.map((r) => [r.id, r.name])),
		[reviewers],
	);
	const perReviewer = useMemo(() => {
		const counts = new Map<string, number>();
		for (const dealerId of values.dealerIds) {
			// Same rule as the launch payload: fallback covers unassigned dealers.
			const reviewerId =
				values.reviewerByDealer[dealerId] || values.fallbackReviewerId;
			if (reviewerId) counts.set(reviewerId, (counts.get(reviewerId) ?? 0) + 1);
		}
		return [...counts.entries()].map(([id, count]) => ({
			id,
			name: reviewerName.get(id) ?? id,
			count,
		}));
	}, [
		values.dealerIds,
		values.reviewerByDealer,
		values.fallbackReviewerId,
		reviewerName,
	]);

	const rows: Array<{
		label: string;
		value: string;
		step: "DETAILS" | "DEALERS" | "REVIEWERS";
	}> = [
		{ label: c.checklist, value: templateLabel, step: "DETAILS" },
		{
			label: c.period,
			value: formatPeriodLabel({
				type: values.periodType,
				year: values.year,
				quarter: values.periodType === "YEARLY" ? null : values.quarter,
			}),
			step: "DETAILS",
		},
		{ label: c.dueDate, value: values.dueDate, step: "DETAILS" },
		{
			label: c.dealers,
			value: format(text.dealers.footerSelected, {
				count: values.dealerIds.length,
			}),
			step: "DEALERS",
		},
	];

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold text-fg">{c.heading}</h3>
				<p className="text-sm text-fg-secondary">{c.body}</p>
				<p className="mt-1 break-words text-sm font-semibold text-fg">
					{values.name}
				</p>
			</div>

			<dl className="divide-y divide-line rounded-lg border border-line bg-surface">
				{rows.map((row) => (
					<div
						key={row.label}
						className="flex items-center justify-between gap-3 px-3 py-2"
					>
						<div className="min-w-0">
							<dt className="text-xs font-medium text-fg-secondary">
								{row.label}
							</dt>
							<dd className="break-words text-sm font-semibold text-fg">
								{row.value}
							</dd>
						</div>
						<Button
							type="button"
							text={c.editStep}
							appearance="standard"
							variant="transparent"
							size="sm"
							onClick={() => onEditStep(row.step)}
						/>
					</div>
				))}
				<div className="flex items-start justify-between gap-3 px-3 py-2">
					<div className="min-w-0">
						<dt className="text-xs font-medium text-fg-secondary">
							{c.reviewers}
						</dt>
						<dd className="text-sm text-fg">
							<ul className="mt-1 space-y-0.5">
								{perReviewer.map((entry) => (
									<li key={entry.id} className="break-words">
										<span className="font-semibold">{entry.name}</span> —{" "}
										<span className="tabular-nums">{entry.count}</span>
									</li>
								))}
							</ul>
						</dd>
					</div>
					<Button
						type="button"
						text={c.editStep}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => onEditStep("REVIEWERS")}
					/>
				</div>
			</dl>
		</div>
	);
}
