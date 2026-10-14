// modules/audit/dealerAudit/pages/DealerAuditListPage.tsx
//
// Audit listing for every role. What the server returns is already scoped to
// the user (dealer: own audits; reviewer: assigned audits), so the page only
// decides which columns the role may see.

import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../../components/common/Button";
import SelectInput from "../../../../components/forms/SelectInput";
import { SearchInput } from "../../../../components/forms/SearchInput";
import { Alert } from "../../../../components/common/Alert";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { dealerAuditContent as content } from "../dealer-audit.content";
import { formatPercent } from "../../shared/execution/audit-execution.format";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel, getSelectableYears } from "../dealer-audit.sla";
import {
	AUDIT_STATUS_FILTER_ORDER,
	getAuditStatusLabel,
} from "../dealer-audit.status";
import type {
	DealerAuditListItem,
	DealerAuditQuarter,
} from "../dealer-audit.types";
import AuditDueLabel from "../components/AuditDueLabel";
import AuditStatusBadge from "../components/AuditStatusBadge";
import { useDealerAuditList } from "../hooks/useDealerAudits";
import { useDealerAuditSession } from "../hooks/useDealerAuditAccess";
import { useDealerAuditListParams } from "../hooks/useDealerAuditListParams";
import Card from "../../../../components/common/Card";

const text = content.ui.list;
const ALL_VALUE = "";

const QUARTERS: readonly DealerAuditQuarter[] = [1, 2, 3, 4];

interface FilterOption {
	value: string;
	label: string;
}

const getScoreLabel = (audit: DealerAuditListItem): string => {
	const score = audit.finalScore ?? audit.selfScore;
	if (score === null) return "—";
	const percent = audit.maxScore > 0 ? (score / audit.maxScore) * 100 : 0;
	return `${score}/${audit.maxScore} (${formatPercent(Math.round(percent * 10) / 10)})`;
};

type ListSortField = "dueAt" | "updatedAt" | "dealerName" | "status";

const toSortField = (id: string | undefined): ListSortField | null => {
	switch (id) {
		case "dueAt":
		case "updatedAt":
		case "dealerName":
		case "status":
			return id;
		default:
			return null;
	}
};

export default function DealerAuditListPage() {
	const navigate = useNavigate();
	const { permissions } = useDealerAuditSession();
	const params = useDealerAuditListParams();
	const audits = useDealerAuditList(params.listParams);

	const statusOptions = useMemo<FilterOption[]>(
		() => [
			{ value: ALL_VALUE, label: text.allStatuses },
			...AUDIT_STATUS_FILTER_ORDER.map((status) => ({
				value: status,
				label: getAuditStatusLabel(status),
			})),
		],
		[],
	);
	const yearOptions = useMemo<FilterOption[]>(
		() => [
			{ value: ALL_VALUE, label: text.allYears },
			...getSelectableYears().map((year) => ({
				value: String(year),
				label: formatPeriodLabel({ type: "YEARLY", year, quarter: null }),
			})),
		],
		[],
	);
	const quarterOptions = useMemo<FilterOption[]>(
		() => [
			{ value: ALL_VALUE, label: text.allQuarters },
			...QUARTERS.map((quarter) => ({
				value: String(quarter),
				label: text.quarters[quarter],
			})),
		],
		[],
	);

	const showWorkflowColumns = permissions.canViewWorkflow;

	const columns = useMemo<ColumnDef<DealerAuditListItem>[]>(() => {
		const base: ColumnDef<DealerAuditListItem>[] = [
			{
				id: "auditNumber",
				header: text.columns.audit,
				enableSorting: false,
				cell: ({ row }) => (
					<Link
						to={DEALER_AUDIT_ROUTES.audits.detail(row.original.id)}
						className="font-medium text-(--color-brand) hover:underline"
						onClick={(event) => event.stopPropagation()}
					>
						{row.original.auditNumber}
					</Link>
				),
			},
			{
				id: "dealerName",
				header: text.columns.dealer,
				cell: ({ row }) => (
					<div className="min-w-0">
						<p className="truncate font-medium">{row.original.dealerName}</p>
						<p className="truncate text-xs text-slate-500">
							{[row.original.dealerCode, row.original.location]
								.filter(Boolean)
								.join(" · ")}
						</p>
					</div>
				),
			},
			{
				id: "period",
				header: text.columns.period,
				enableSorting: false,
				cell: ({ row }) => formatPeriodLabel(row.original.period),
			},
			{
				id: "status",
				header: text.columns.status,
				cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
			},
			{
				id: "dueAt",
				header: text.columns.due,
				cell: ({ row }) => (
					<AuditDueLabel
						status={row.original.status}
						dueAt={row.original.dueAt}
					/>
				),
			},
			{
				id: "progress",
				header: text.columns.progress,
				enableSorting: false,
				cell: ({ row }) =>
					`${row.original.completedItems}/${row.original.totalItems}`,
			},
			{
				id: "score",
				header: text.columns.score,
				enableSorting: false,
				cell: ({ row }) => getScoreLabel(row.original),
			},
		];
		if (showWorkflowColumns) {
			base.splice(3, 0, {
				id: "reviewer",
				header: text.columns.reviewer,
				enableSorting: false,
				cell: ({ row }) => row.original.assignedReviewer?.name ?? "—",
			});
		}
		return base;
	}, [showWorkflowColumns]);

	const sorting = [
		{
			id: params.listParams.sortBy,
			desc: params.listParams.sortOrder === "desc",
		},
	];

	return (
		<PageSectionLayout className="audit-page">
			<PageHeader
				headerText={text.title}
				subtitleText={text.subtitle}
			></PageHeader>

			<Card
				actions={
					permissions.canCreateAudit ? (
						<Button
							type="button"
							text={text.create}
							Icon={Plus}
							appearance="standard"
							variant="brand"
							onClick={() => navigate(DEALER_AUDIT_ROUTES.audits.create)}
						/>
					) : null
				}
				title={
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<SearchInput
							value={params.searchInput}
							onChange={params.setSearchInput}
							placeholder={text.searchPlaceholder}
							containerClassName="sm:col-span-2 lg:col-span-1"
						/>
						<SelectInput
							name="status"
							options={statusOptions}
							value={
								statusOptions.find(
									(option) => option.value === (params.status ?? ALL_VALUE),
								) ?? null
							}
							onChange={(option) =>
								params.setStatus(
									option && option.value !== ALL_VALUE
										? (AUDIT_STATUS_FILTER_ORDER.find(
												(status) => status === option.value,
											) ?? null)
										: null,
								)
							}
							aria-label={text.filters.status}
						/>
						<SelectInput
							name="year"
							options={yearOptions}
							value={
								yearOptions.find(
									(option) =>
										option.value ===
										(params.year === null ? ALL_VALUE : String(params.year)),
								) ?? null
							}
							onChange={(option) =>
								params.setYear(
									option && option.value ? Number(option.value) : null,
								)
							}
						/>
						<SelectInput
							name="quarter"
							options={quarterOptions}
							value={
								quarterOptions.find(
									(option) =>
										option.value ===
										(params.quarter === null
											? ALL_VALUE
											: String(params.quarter)),
								) ?? null
							}
							onChange={(option) =>
								params.setQuarter(
									QUARTERS.find(
										(quarter) => String(quarter) === option?.value,
									) ?? null,
								)
							}
						/>
					</div>
				}
			>
				<div className="audit-stack">
					{params.hasActiveFilters ? (
						<div>
							<Button
								type="button"
								text={text.clearFilters}
								appearance="standard"
								variant="outline"
								size="sm"
								onClick={params.clearFilters}
							/>
						</div>
					) : null}

					{audits.isError ? (
						<Alert
							variant="error"
							title={text.errorTitle}
							description={audits.errorMessage ?? undefined}
							primaryAction={{
								label: text.retry,
								onClick: () => void audits.refetch(),
							}}
						/>
					) : null}

					{/* Desktop / tablet: table */}
					<div className="hidden md:block">
						<DataTable<DealerAuditListItem>
							data={audits.items}
							columns={columns}
							loading={audits.isLoading}
							manualPagination
							manualSorting
							pageIndex={params.listParams.page - 1}
							pageSize={params.listParams.pageSize}
							pageCount={audits.totalPages}
							onPageChange={params.setPageIndex}
							onPageSizeChange={params.setPageSize}
							sorting={sorting}
							onSortingChange={(updater) => {
								const next =
									typeof updater === "function" ? updater(sorting) : updater;
								const [first] = next;
								const field = toSortField(first?.id);
								if (!first || !field) {
									params.setSort("updatedAt", "desc");
									return;
								}
								params.setSort(field, first.desc ? "desc" : "asc");
							}}
							getRowId={(row) => row.id}
							onRowClick={(row) =>
								navigate(DEALER_AUDIT_ROUTES.audits.detail(row.id))
							}
							emptyTitle={text.emptyTitle}
							emptyDescription={text.emptyDescription}
							ariaLabel={text.tableLabel}
							minWidth="lg"
						/>
					</div>

					{/* Mobile: compact cards */}
					<ul className="space-y-2 md:hidden" aria-label={text.tableLabel}>
						{audits.isLoading ? (
							<li className="text-sm text-slate-600" role="status">
								{text.loading}
							</li>
						) : audits.items.length === 0 ? (
							<li className="rounded-lg border border-dashed border-(--color-border-default) p-4 text-center text-sm text-slate-600">
								<p className="font-medium">{text.emptyTitle}</p>
								<p>{text.emptyDescription}</p>
							</li>
						) : (
							audits.items.map((audit) => (
								<li key={audit.id}>
									<Link
										to={DEALER_AUDIT_ROUTES.audits.detail(audit.id)}
										className="block rounded-lg border border-(--color-border-default) p-3 focus-visible:outline-2"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold">
													{audit.dealerName}
												</p>
												<p className="truncate text-xs text-slate-500">
													{audit.auditNumber} ·{" "}
													{formatPeriodLabel(audit.period)}
												</p>
											</div>
											<AuditStatusBadge status={audit.status} />
										</div>
										<div className="mt-2 flex items-center justify-between gap-2 text-xs">
											<AuditDueLabel
												status={audit.status}
												dueAt={audit.dueAt}
											/>
											<span className="tabular-nums text-slate-600">
												{audit.completedItems}/{audit.totalItems} ·{" "}
												{getScoreLabel(audit)}
											</span>
										</div>
									</Link>
								</li>
							))
						)}
					</ul>
					{audits.items.length > 0 ? (
						<p className="text-xs text-slate-500 md:hidden">
							{text.page} {params.listParams.page} /{" "}
							{Math.max(1, audits.totalPages)}
						</p>
					) : null}
				</div>
			</Card>
		</PageSectionLayout>
	);
}
