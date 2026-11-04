// modules/audit/dealerAudit/cycle/components/CycleWizardSteps.tsx
//
// The four panels of the "Create audit cycle" wizard. Presentational only:
// they get values + errors and emit changes. No API calls, no navigation.
// Touch targets are 44px+ and wording is plain on purpose.

import { Lock, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert } from "../../../../../components/common/Alert";
import Button from "../../../../../components/common/Button";
import FormInput from "../../../../../components/forms/FormInput";
import SelectInput from "../../../../../components/forms/SelectInput";
import TextareaInput from "../../../../../components/forms/TextareaInput";
import { toDateInputValue } from "../../../shared/execution/audit-execution.format";
import { dealerAuditContent as auditContent } from "../../dealer-audit.content";
import { formatPeriodLabel, getSelectableYears } from "../../dealer-audit.sla";
import type {
	DealerAuditDealerOption,
	DealerAuditPeriodType,
	DealerAuditQuarter,
	DealerAuditReviewerOption,
} from "../../dealer-audit.types";
import { dealerCycleContent, formatCycleMessage as format } from "../dealer-cycle.content";
import { countUnassigned } from "../dealer-cycle.logic";
import { CYCLE_NOTES_MAX } from "../dealer-cycle.schemas";
import type {
	CreateAuditCycleFormValues,
	DealerEligibility,
	ReviewerWorkload,
} from "../dealer-cycle.types";
import type { CycleStepErrors } from "../dealer-cycle.schemas";

const text = dealerCycleContent.wizard;

const QUARTERS: readonly DealerAuditQuarter[] = [1, 2, 3, 4];
const PERIOD_TYPES: readonly DealerAuditPeriodType[] = ["QUARTERLY", "YEARLY"];

interface Option {
	value: string;
	label: string;
}

const dealerLine = (dealer: DealerAuditDealerOption): string =>
	[dealer.code, dealer.location].filter(Boolean).join(" · ");

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
					value={templateOptions.find((o) => o.value === values.templateId) ?? null}
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
				value={periodTypeOptions.find((o) => o.value === values.periodType) ?? null}
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
					value={quarterOptions.find((o) => o.value === String(values.quarter)) ?? null}
					onChange={(option) =>
						onChange({
							quarter: QUARTERS.find((q) => String(q) === option?.value) ?? null,
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

			<div className="sm:col-span-2">
				<TextareaInput
					label={text.fields.notes}
					rows={3}
					maxLength={CYCLE_NOTES_MAX}
					value={values.notes}
					disabled={isDisabled}
					error={errors.notes}
					onChange={(event) => onChange({ notes: event.target.value })}
				/>
			</div>
		</div>
	);
}

// ── Step 2: dealers ───────────────────────────────────────────────────

interface DealersStepProps {
	dealers: readonly DealerAuditDealerOption[];
	eligibility: readonly DealerEligibility[];
	selectedIds: readonly string[];
	error: string | undefined;
	isLoading: boolean;
	isDisabled: boolean;
	onChange: (dealerIds: string[]) => void;
}

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
	const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
	const byId = useMemo(
		() => new Map(eligibility.map((entry) => [entry.dealerId, entry])),
		[eligibility],
	);

	const needle = search.trim().toLowerCase();
	const visible = useMemo(
		() =>
			dealers.filter(
				(dealer) =>
					needle === "" ||
					[dealer.name, dealer.code ?? "", dealer.location]
						.join(" ")
						.toLowerCase()
						.includes(needle),
			),
		[dealers, needle],
	);
	const eligibleVisible = visible.filter((d) => byId.get(d.id)?.isEligible ?? true);
	const ineligibleVisible = visible.filter((d) => byId.get(d.id)?.isEligible === false);
	const allEligibleSelected =
		eligibleVisible.length > 0 && eligibleVisible.every((d) => selected.has(d.id));

	const toggle = (dealerId: string): void =>
		onChange(
			selected.has(dealerId)
				? selectedIds.filter((id) => id !== dealerId)
				: [...selectedIds, dealerId],
		);

	const selectAllVisible = (): void =>
		onChange([...new Set([...selectedIds, ...eligibleVisible.map((d) => d.id)])]);

	const clearVisible = (): void => {
		const hide = new Set(eligibleVisible.map((d) => d.id));
		onChange(selectedIds.filter((id) => !hide.has(id)));
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-0 flex-1 basis-56">
					<Search
						size={16}
						aria-hidden="true"
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
					/>
					<input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder={text.dealers.searchPlaceholder}
						aria-label={text.dealers.searchPlaceholder}
						className="h-11 w-full rounded-md border border-(--color-border-default) pl-9 pr-3 text-sm"
					/>
				</div>
				<Button
					type="button"
					text={allEligibleSelected ? text.dealers.clearAll : text.dealers.selectAll}
					appearance="standard"
					variant="outline"
					disabled={isDisabled || eligibleVisible.length === 0}
					onClick={allEligibleSelected ? clearVisible : selectAllVisible}
				/>
			</div>

			<p className="text-sm text-(--color-text-secondary)" role="status" aria-live="polite">
				{format(text.dealers.selectedCount, { count: selectedIds.length })} ·{" "}
				{format(text.dealers.eligibleCount, { count: eligibleVisible.length })}
				{ineligibleVisible.length > 0
					? ` · ${format(text.dealers.ineligibleCount, { count: ineligibleVisible.length })}`
					: ""}
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
			) : visible.length === 0 ? (
				<p className="rounded-lg border border-dashed border-(--color-border-default) p-4 text-center text-sm text-slate-600">
					{text.dealers.empty}
				</p>
			) : (
				<>
					<ul className="max-h-[28rem] divide-y divide-(--color-border-default) overflow-y-auto rounded-lg border border-(--color-border-default)">
						{eligibleVisible.map((dealer) => (
							<li key={dealer.id}>
								<label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
									<input
										type="checkbox"
										className="size-5 shrink-0"
										checked={selected.has(dealer.id)}
										disabled={isDisabled}
										onChange={() => toggle(dealer.id)}
									/>
									<span className="min-w-0">
										<span className="block break-words text-sm font-medium">{dealer.name}</span>
										<span className="block break-words text-xs text-slate-500">
											{dealerLine(dealer)}
										</span>
									</span>
								</label>
							</li>
						))}
					</ul>

					{ineligibleVisible.length > 0 ? (
						<section aria-label={text.dealers.ineligibleHeading} className="space-y-2">
							<h4 className="text-sm font-semibold">{text.dealers.ineligibleHeading}</h4>
							<ul className="divide-y divide-(--color-border-default) rounded-lg border border-(--color-border-default) bg-slate-50">
								{ineligibleVisible.map((dealer) => {
									const entry = byId.get(dealer.id);
									const reason = entry?.reason
										? format(text.ineligible[entry.reason], {
												auditNumber: entry.blockingAuditNumber ?? "",
											})
										: "";
									return (
										<li key={dealer.id} className="flex items-start gap-3 px-3 py-2">
											<Lock size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-500" />
											<span className="min-w-0">
												<span className="block break-words text-sm font-medium text-slate-700">
													{dealer.name}
												</span>
												<span className="block break-words text-xs text-slate-600">
													{dealerLine(dealer)}
												</span>
												<span className="mt-0.5 block text-xs font-medium text-amber-800">
													{reason}
												</span>
											</span>
										</li>
									);
								})}
							</ul>
						</section>
					) : null}
				</>
			)}
		</div>
	);
}

// ── Step 3: reviewers ─────────────────────────────────────────────────

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
}: ReviewersStepProps) {
	const dealerById = useMemo(() => new Map(dealers.map((d) => [d.id, d])), [dealers]);
	const options = useMemo<Option[]>(
		() =>
			reviewers.map((reviewer) => {
				const open = workload.find((w) => w.reviewerId === reviewer.id)?.openAudits ?? 0;
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
	const unassigned = countUnassigned(selectedIds, reviewerByDealer);

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
				<div className="min-w-0">
					<p className="text-sm font-medium">
						{format(text.reviewers.assignedSummary, {
							assigned: selectedIds.length - unassigned,
							total: selectedIds.length,
						})}
					</p>
					<p className="text-xs text-slate-600">{text.reviewers.autoAssignHelp}</p>
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

			<ul className="max-h-[28rem] divide-y divide-(--color-border-default) overflow-y-auto rounded-lg border border-(--color-border-default)">
				{selectedIds.map((dealerId) => {
					const dealer = dealerById.get(dealerId);
					const name = dealer?.name ?? dealerId;
					return (
						<li
							key={dealerId}
							className="grid grid-cols-1 gap-2 px-3 py-2 sm:grid-cols-2 sm:items-center"
						>
							<div className="min-w-0">
								<p className="break-words text-sm font-medium">{name}</p>
								<p className="break-words text-xs text-slate-500">
									{dealer ? dealerLine(dealer) : ""}
								</p>
							</div>
							<SelectInput
								aria-label={format(text.reviewers.reviewerFor, { dealer: name })}
								options={options}
								value={options.find((o) => o.value === reviewerByDealer[dealerId]) ?? null}
								onChange={(option) => onChange(dealerId, option?.value ?? "")}
								isDisabled={isDisabled}
								placeholder={text.reviewers.unassigned}
							/>
						</li>
					);
				})}
			</ul>
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

	const rows: Array<{ label: string; value: string; step: "DETAILS" | "DEALERS" | "REVIEWERS" }> = [
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
			value: format(text.dealers.selectedCount, { count: values.dealerIds.length }),
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
					<div key={row.label} className="flex items-center justify-between gap-3 px-3 py-2">
						<div className="min-w-0">
							<dt className="text-xs text-(--color-text-secondary)">{row.label}</dt>
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
						<dt className="text-xs text-(--color-text-secondary)">{c.reviewers}</dt>
						<dd className="text-sm">
							<ul className="mt-1 space-y-0.5">
								{perReviewer.map((entry) => (
									<li key={entry.id} className="break-words">
										<span className="font-medium">{entry.name}</span> — {entry.count}
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
