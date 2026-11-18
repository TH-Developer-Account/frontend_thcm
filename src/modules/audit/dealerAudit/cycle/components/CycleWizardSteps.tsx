// modules/audit/dealerAudit/cycle/components/CycleWizardSteps.tsx
//
// The four panels of the "Create audit cycle" wizard. Presentational only:
// they get values + errors and emit changes. No API calls, no navigation.
// Steps 2 and 3 share one layout: filters on top, a paged table below.

import {
	ChevronLeft,
	ChevronRight,
	Lock,
	Search,
	Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Alert } from "../../../../../components/common/Alert";
import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/forms/FormInput";
import SelectInput from "../../../../../components/forms/SelectInput";
import { toDateInputValue } from "../../../shared/execution/audit-execution.format";
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
	ReviewerWorkload,
} from "../dealer-cycle.types";

const text = dealerCycleContent.wizard;

const QUARTERS: readonly DealerAuditQuarter[] = [1, 2, 3, 4];
const PERIOD_TYPES: readonly DealerAuditPeriodType[] = ["QUARTERLY", "YEARLY"];

const PAGE_SIZE = 10;
/** Filter value meaning "no filter". */
const ALL = "";

const FACILITY_SHORT: Record<string, string> = text.facility.short;
const FACILITY_LONG: Record<string, string> = text.facility.long;

const CELL_HEAD =
	"px-3 py-2 text-left text-xs font-semibold text-(--color-text-secondary)";
const CELL = "px-3 py-2 align-middle text-sm";
const TABLE_WRAP =
	"overflow-x-auto rounded-lg border border-(--color-border-default)";

interface Option {
	value: string;
	label: string;
}

const dealerLine = (dealer: DealerAuditDealerOption): string =>
	[dealer.code, dealer.location].filter(Boolean).join(" · ");

const uniqueSorted = (
	values: ReadonlyArray<string | null | undefined>,
): string[] =>
	[...new Set(values.filter((value): value is string => Boolean(value)))].sort(
		(a, b) => a.localeCompare(b),
	);

const withAll = (
	allLabel: string,
	values: readonly string[],
	labelOf: (value: string) => string = (value) => value,
): Option[] => [
	{ value: ALL, label: allLabel },
	...values.map((value) => ({ value, label: labelOf(value) })),
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

// ── Shared bits for the two table steps ───────────────────────────────

interface FilterSelectProps {
	label: string;
	options: readonly Option[];
	value: string;
	disabled: boolean;
	onChange: (value: string) => void;
}

function FilterSelect({
	label,
	options,
	value,
	disabled,
	onChange,
}: FilterSelectProps) {
	return (
		<div className="min-w-36 flex-1 basis-36">
			<SelectInput
				label={label}
				options={options}
				value={options.find((option) => option.value === value) ?? null}
				onChange={(option) => onChange(option?.value ?? ALL)}
				isDisabled={disabled}
			/>
		</div>
	);
}

interface PagerProps {
	page: number;
	totalPages: number;
	total: number;
	from: number;
	to: number;
	disabled: boolean;
	onPage: (page: number) => void;
}

function Pager({
	page,
	totalPages,
	total,
	from,
	to,
	disabled,
	onPage,
}: PagerProps) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-2">
			<p
				role="status"
				aria-live="polite"
				className="text-sm text-(--color-text-secondary)"
			>
				{format(text.pagination.showing, { from, to, total })}
			</p>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					text={text.pagination.previous}
					Icon={ChevronLeft}
					appearance="standard"
					variant="outline"
					size="sm"
					disabled={disabled || page <= 1}
					onClick={() => onPage(page - 1)}
				/>
				<span className="min-w-20 text-center text-sm">
					{format(text.pagination.pageOf, { current: page, total: totalPages })}
				</span>
				<Button
					type="button"
					text={text.pagination.next}
					Icon={ChevronRight}
					iconPosition="right"
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

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div className="sm:col-span-2">
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
			</div>

			<div className="sm:col-span-2">
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
			</div>

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
				value={yearOptions.find((o) => o.value === String(values.year)) ?? null}
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

			<FormInput
				type="date"
				label={text.fields.dueDate}
				required
				min={toDateInputValue(new Date())}
				value={values.dueDate}
				disabled={isDisabled}
				error={errors.dueDate}
				onChange={(event) => onChange({ dueDate: event.target.value })}
			/>
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
	onChange: (dealerIds: string[]) => void;
}

type DealerSort = "name" | "zone";

const facilityShort = (type: string | null): string =>
	type ? (FACILITY_SHORT[type] ?? type) : "—";

const lastAuditLabel = (dealer: DealerAuditDealerOption): string => {
	const last = dealer.lastAudit;
	if (!last) return text.dealers.noLastAudit;
	const score =
		last.finalScore !== null && last.maxScore
			? ` · ${last.finalScore}/${last.maxScore}`
			: "";
	return `${last.periodLabel}${score}`;
};

const shortReason = (entry: DealerEligibility | undefined): string => {
	if (!entry?.reason) return "";
	return entry.reason === "ALREADY_AUDITED"
		? format(text.ineligibleShort.ALREADY_AUDITED, {
				auditNumber: entry.blockingAuditNumber ?? "",
			})
		: text.ineligibleShort.FACILITY_MISMATCH;
};

export function CycleDealersStep({
	dealers,
	eligibility,
	selectedIds,
	error,
	isLoading,
	isDisabled,
	onChange,
}: DealersStepProps) {
	const [search, setSearch] = useState("");
	const [zoneFilter, setZoneFilter] = useState(ALL);
	const [stateFilter, setStateFilter] = useState(ALL);
	const [facilityFilter, setFacilityFilter] = useState(ALL);
	const [sortBy, setSortBy] = useState<DealerSort>("name");
	const [page, setPage] = useState(1);

	const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
	const byId = useMemo(
		() => new Map(eligibility.map((entry) => [entry.dealerId, entry])),
		[eligibility],
	);

	const zoneOptions = useMemo(
		() =>
			withAll(text.filters.allZones, uniqueSorted(dealers.map((d) => d.zone))),
		[dealers],
	);
	const stateOptions = useMemo(
		() =>
			withAll(
				text.filters.allStates,
				uniqueSorted(dealers.map((d) => d.state)),
			),
		[dealers],
	);
	const facilityOptions = useMemo(
		() =>
			withAll(
				text.filters.allFacilities,
				uniqueSorted(dealers.map((d) => d.facilityType)),
				(value) => FACILITY_LONG[value] ?? value,
			),
		[dealers],
	);
	const sortOptions: Option[] = [
		{ value: "name", label: text.filters.sortName },
		{ value: "zone", label: text.filters.sortZone },
	];

	const rows = useMemo(() => {
		const needle = search.trim().toLowerCase();
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
			.sort((a, b) =>
				sortBy === "zone"
					? (a.zone ?? "").localeCompare(b.zone ?? "") ||
						a.name.localeCompare(b.name)
					: a.name.localeCompare(b.name),
			);
	}, [dealers, search, zoneFilter, stateFilter, facilityFilter, sortBy]);

	const isEligible = (dealerId: string): boolean =>
		byId.get(dealerId)?.isEligible ?? true;
	const eligibleRows = rows.filter((dealer) => isEligible(dealer.id));
	const allEligibleSelected =
		eligibleRows.length > 0 &&
		eligibleRows.every((dealer) => selected.has(dealer.id));
	const hasFilters =
		search !== "" ||
		zoneFilter !== ALL ||
		stateFilter !== ALL ||
		facilityFilter !== ALL;
	const paged = paginate(rows, page);

	const filter = (apply: () => void): void => {
		apply();
		setPage(1);
	};
	const clearFilters = (): void =>
		filter(() => {
			setSearch("");
			setZoneFilter(ALL);
			setStateFilter(ALL);
			setFacilityFilter(ALL);
		});

	const toggle = (dealerId: string): void =>
		onChange(
			selected.has(dealerId)
				? selectedIds.filter((id) => id !== dealerId)
				: [...selectedIds, dealerId],
		);
	const selectAllShown = (): void =>
		onChange([...new Set([...selectedIds, ...eligibleRows.map((d) => d.id)])]);
	const clearShown = (): void => {
		const hide = new Set(eligibleRows.map((d) => d.id));
		onChange(selectedIds.filter((id) => !hide.has(id)));
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-0 flex-1 basis-64">
					<Search
						size={16}
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
					/>
					<input
						type="search"
						value={search}
						onChange={(event) => filter(() => setSearch(event.target.value))}
						placeholder={text.dealers.searchPlaceholder}
						aria-label={text.dealers.searchPlaceholder}
						className="h-11 w-full rounded-md border border-(--color-border-default) pl-9 pr-3 text-sm"
					/>
				</div>
				<Button
					type="button"
					text={
						allEligibleSelected ? text.dealers.clearAll : text.dealers.selectAll
					}
					appearance="standard"
					variant="outline"
					disabled={isDisabled || eligibleRows.length === 0}
					onClick={allEligibleSelected ? clearShown : selectAllShown}
				/>
			</div>

			<div className="flex flex-wrap items-end gap-2">
				<FilterSelect
					label={text.filters.zone}
					options={zoneOptions}
					value={zoneFilter}
					disabled={isDisabled}
					onChange={(value) => filter(() => setZoneFilter(value))}
				/>
				<FilterSelect
					label={text.filters.state}
					options={stateOptions}
					value={stateFilter}
					disabled={isDisabled}
					onChange={(value) => filter(() => setStateFilter(value))}
				/>
				<FilterSelect
					label={text.filters.facility}
					options={facilityOptions}
					value={facilityFilter}
					disabled={isDisabled}
					onChange={(value) => filter(() => setFacilityFilter(value))}
				/>
				<FilterSelect
					label={text.filters.sortBy}
					options={sortOptions}
					value={sortBy}
					disabled={isDisabled}
					onChange={(value) =>
						filter(() => setSortBy(value === "zone" ? "zone" : "name"))
					}
				/>
				{hasFilters ? (
					<Button
						type="button"
						text={dealerCycleContent.common.clearFilters}
						appearance="standard"
						variant="transparent"
						onClick={clearFilters}
					/>
				) : null}
			</div>

			<p
				role="status"
				aria-live="polite"
				className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium"
			>
				{format(text.dealers.selectedCount, { count: selectedIds.length })} ·{" "}
				{format(text.dealers.eligibleInList, {
					count: eligibleRows.length,
					total: rows.length,
				})}
			</p>

			{error ? (
				<p className="form-error-text" role="alert">
					{error}
				</p>
			) : null}

			{isLoading ? (
				<p className="text-sm text-slate-600" role="status">
					{auditContent.ui.create.loading}
				</p>
			) : rows.length === 0 ? (
				<p className="rounded-lg border border-dashed border-(--color-border-default) p-4 text-center text-sm text-slate-600">
					{text.dealers.empty}
				</p>
			) : (
				<>
					<div className={TABLE_WRAP}>
						<table className="w-full min-w-[44rem] border-collapse">
							<thead className="bg-slate-50">
								<tr>
									<th className="w-12 px-3 py-2">
										<span className="sr-only">
											{text.dealers.columns.select}
										</span>
									</th>
									<th className={CELL_HEAD}>{text.dealers.columns.dealer}</th>
									<th className={CELL_HEAD}>{text.dealers.columns.facility}</th>
									<th className={CELL_HEAD}>{text.dealers.columns.zone}</th>
									<th className={CELL_HEAD}>
										{text.dealers.columns.lastAudit}
									</th>
									<th className={CELL_HEAD}>
										{text.dealers.columns.eligibility}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--color-border-default)">
								{paged.rows.map((dealer) => {
									const entry = byId.get(dealer.id);
									const eligible = entry?.isEligible ?? true;
									return (
										<tr
											key={dealer.id}
											className={
												eligible
													? "hover:bg-slate-50"
													: "bg-slate-50 text-slate-600"
											}
										>
											<td className="px-3 py-1">
												<label className="flex min-h-11 cursor-pointer items-center justify-center">
													<input
														type="checkbox"
														className="size-5"
														aria-label={format(text.dealers.selectRow, {
															dealer: dealer.name,
														})}
														checked={selected.has(dealer.id)}
														disabled={isDisabled || !eligible}
														onChange={() => toggle(dealer.id)}
													/>
												</label>
											</td>
											<td className={CELL}>
												<span className="block break-words font-medium">
													{dealer.name}
												</span>
												<span className="block break-words text-xs text-slate-500">
													{dealerLine(dealer)}
												</span>
											</td>
											<td className={CELL}>
												{facilityShort(dealer.facilityType)}
											</td>
											<td className={CELL}>{dealer.zone ?? "—"}</td>
											<td className={CELL}>{lastAuditLabel(dealer)}</td>
											<td className={CELL}>
												{eligible ? (
													<span className="text-xs font-medium text-emerald-700">
														{text.dealers.eligible}
													</span>
												) : (
													<span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
														<Lock size={14} aria-hidden="true" />
														{shortReason(entry)}
													</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<Pager
						page={paged.page}
						totalPages={paged.totalPages}
						total={paged.total}
						from={paged.from}
						to={paged.to}
						disabled={isDisabled}
						onPage={setPage}
					/>
				</>
			)}
		</div>
	);
}

// ── Step 3: assign reviewers ──────────────────────────────────────────

interface ReviewersStepProps {
	dealers: readonly DealerAuditDealerOption[];
	reviewers: readonly DealerAuditReviewerOption[];
	workload: readonly ReviewerWorkload[];
	selectedIds: readonly string[];
	reviewerByDealer: Readonly<Record<string, string>>;
	error: string | undefined;
	isDisabled: boolean;
	onAutoAssign: () => void;
	onChange: (dealerId: string, reviewerId: string) => void;
	/** Sets one reviewer on many dealers at once (the dealers currently shown). */
	onBulkChange: (dealerIds: readonly string[], reviewerId: string) => void;
}

export function CycleReviewersStep({
	dealers,
	reviewers,
	workload,
	selectedIds,
	reviewerByDealer,
	error,
	isDisabled,
	onAutoAssign,
	onChange,
	onBulkChange,
}: ReviewersStepProps) {
	const [zoneFilter, setZoneFilter] = useState(ALL);
	const [bulkReviewerId, setBulkReviewerId] = useState("");
	const [page, setPage] = useState(1);

	const dealerById = useMemo(
		() => new Map(dealers.map((d) => [d.id, d])),
		[dealers],
	);
	const options = useMemo<Option[]>(
		() =>
			reviewers.map((reviewer) => {
				const open =
					workload.find((w) => w.reviewerId === reviewer.id)?.openAudits ?? 0;
				const base = reviewer.designation
					? `${reviewer.name} — ${reviewer.designation}`
					: reviewer.name;
				return {
					value: reviewer.id,
					label: `${base} (${format(text.reviewers.workload, { count: open })})`,
				};
			}),
		[reviewers, workload],
	);

	const selectedDealers = useMemo(
		() => selectedIds.map((id) => ({ id, dealer: dealerById.get(id) })),
		[selectedIds, dealerById],
	);
	const zoneOptions = useMemo(
		() =>
			withAll(
				text.filters.allZones,
				uniqueSorted(selectedDealers.map((row) => row.dealer?.zone)),
			),
		[selectedDealers],
	);
	const rows = useMemo(
		() =>
			selectedDealers
				.filter((row) => zoneFilter === ALL || row.dealer?.zone === zoneFilter)
				.sort((a, b) =>
					(a.dealer?.name ?? a.id).localeCompare(b.dealer?.name ?? b.id),
				),
		[selectedDealers, zoneFilter],
	);
	const paged = paginate(rows, page);
	const shownIds = rows.map((row) => row.id);
	const unassigned = countUnassigned(selectedIds, reviewerByDealer);
	const optionFor = (reviewerId: string): Option | null =>
		options.find((option) => option.value === reviewerId) ?? null;

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
				<div className="min-w-0">
					<p className="text-sm font-medium" role="status" aria-live="polite">
						{format(text.reviewers.assignedSummary, {
							assigned: selectedIds.length - unassigned,
							total: selectedIds.length,
						})}
					</p>
					<p className="text-xs text-slate-600">
						{text.reviewers.autoAssignHelp}
					</p>
				</div>
				<Button
					type="button"
					text={text.reviewers.autoAssign}
					Icon={Sparkles}
					appearance="standard"
					variant="brand-soft"
					disabled={isDisabled || reviewers.length === 0}
					onClick={onAutoAssign}
				/>
			</div>

			{reviewers.length === 0 ? (
				<Alert variant="warning" title={dealerCycleContent.common.loadError} />
			) : null}
			{error ? (
				<p className="form-error-text" role="alert">
					{error}
				</p>
			) : null}

			<div className="flex flex-wrap items-end gap-2">
				<FilterSelect
					label={text.filters.zone}
					options={zoneOptions}
					value={zoneFilter}
					disabled={isDisabled}
					onChange={(value) => {
						setZoneFilter(value);
						setPage(1);
					}}
				/>
				<div className="min-w-56 flex-[2] basis-64">
					<SelectInput
						label={text.reviewers.bulkLabel}
						options={options}
						value={optionFor(bulkReviewerId)}
						onChange={(option) => setBulkReviewerId(option?.value ?? "")}
						isDisabled={isDisabled || reviewers.length === 0}
						placeholder={text.reviewers.unassigned}
					/>
				</div>
				<Button
					type="button"
					text={format(text.reviewers.bulkApply, { count: shownIds.length })}
					appearance="standard"
					variant="brand-soft"
					disabled={isDisabled || !bulkReviewerId || shownIds.length === 0}
					onClick={() => onBulkChange(shownIds, bulkReviewerId)}
				/>
			</div>

			{rows.length === 0 ? (
				<p className="rounded-lg border border-dashed border-(--color-border-default) p-4 text-center text-sm text-slate-600">
					{text.reviewers.empty}
				</p>
			) : (
				<>
					<div className={TABLE_WRAP}>
						<table className="w-full min-w-[36rem] border-collapse">
							<thead className="bg-slate-50">
								<tr>
									<th className={CELL_HEAD}>{text.reviewers.columns.dealer}</th>
									<th className={CELL_HEAD}>{text.reviewers.columns.zone}</th>
									<th className={`${CELL_HEAD} w-1/2`}>
										{text.reviewers.columns.reviewer}
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-(--color-border-default)">
								{paged.rows.map(({ id, dealer }) => {
									const name = dealer?.name ?? id;
									return (
										<tr key={id}>
											<td className={CELL}>
												<span className="block break-words font-medium">
													{name}
												</span>
												<span className="block break-words text-xs text-slate-500">
													{dealer ? dealerLine(dealer) : ""}
												</span>
											</td>
											<td className={CELL}>{dealer?.zone ?? "—"}</td>
											<td className={CELL}>
												<SelectInput
													aria-label={format(text.reviewers.reviewerFor, {
														dealer: name,
													})}
													options={options}
													value={optionFor(reviewerByDealer[id] ?? "")}
													onChange={(option) =>
														onChange(id, option?.value ?? "")
													}
													isDisabled={isDisabled}
													placeholder={text.reviewers.unassigned}
												/>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<Pager
						page={paged.page}
						totalPages={paged.totalPages}
						total={paged.total}
						from={paged.from}
						to={paged.to}
						disabled={isDisabled}
						onPage={setPage}
					/>
				</>
			)}
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
			const reviewerId = values.reviewerByDealer[dealerId];
			if (reviewerId) counts.set(reviewerId, (counts.get(reviewerId) ?? 0) + 1);
		}
		return [...counts.entries()].map(([id, count]) => ({
			id,
			name: reviewerName.get(id) ?? id,
			count,
		}));
	}, [values.dealerIds, values.reviewerByDealer, reviewerName]);

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
			value: format(text.dealers.selectedCount, {
				count: values.dealerIds.length,
			}),
			step: "DEALERS",
		},
	];

	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-base font-semibold">{c.heading}</h3>
				<p className="text-sm text-(--color-text-secondary)">{c.body}</p>
				<p className="mt-1 break-words text-sm font-medium">{values.name}</p>
			</div>

			<dl className="divide-y divide-(--color-border-default) rounded-lg border border-(--color-border-default)">
				{rows.map((row) => (
					<div
						key={row.label}
						className="flex items-center justify-between gap-3 px-3 py-2"
					>
						<div className="min-w-0">
							<dt className="text-xs text-(--color-text-secondary)">
								{row.label}
							</dt>
							<dd className="break-words text-sm font-medium">{row.value}</dd>
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
						<dt className="text-xs text-(--color-text-secondary)">
							{c.reviewers}
						</dt>
						<dd className="text-sm">
							<ul className="mt-1 space-y-0.5">
								{perReviewer.map((entry) => (
									<li key={entry.id} className="break-words">
										<span className="font-medium">{entry.name}</span> —{" "}
										{entry.count}
									</li>
								))}
							</ul>
						</dd>
					</div>
					<Button
						type="button"
						text={c.editStep}
						appearance="standard"
						variant="transparent"
						size="sm"
						onClick={() => onEditStep("REVIEWERS")}
					/>
				</div>
			</dl>
		</div>
	);
}
