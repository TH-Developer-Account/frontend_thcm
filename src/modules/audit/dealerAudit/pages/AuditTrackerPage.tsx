// modules/audit/dealerAudit/pages/AuditTrackerPage.tsx
//
// Admin / audit-manager control room: KPI tiles for the chosen period, the
// full audit list (server-side filters + paging) and per-row actions:
// open, remind, change reviewer (reason required), view report.
// "Download summary" exports the CURRENT filtered list as CSV.

import type { ColumnDef } from "@tanstack/react-table";
import {
	AlertTriangle,
	BellRing,
	CheckCircle2,
	ClipboardList,
	Download,
	Eye,
	FileCheck2,
	Hourglass,
	MessageSquareWarning,
	Pencil,
	Plus,
	Send,
	UserCog,
	type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import ActionMenu from "../../../../components/common/ActionMenu";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { SearchInput } from "../../../../components/forms/SearchInput";
import SelectInput from "../../../../components/forms/SelectInput";
import { PageHeader } from "../../../../components/ui/PageHeader";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { formatPercent } from "../../shared/execution/audit-execution.format";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import { dealerCycleApi } from "../cycle/dealer-cycle.api";
import AuditSummaryCard from "../cycle/components/AuditSummaryCard";
import {
	dealerCycleContent as content,
	formatCycleMessage as format,
} from "../cycle/dealer-cycle.content";
import {
	buildAuditsCsv,
	canRemindAudit,
	isAuditOverdue,
} from "../cycle/dealer-cycle.logic";
import { useSendReminders, useTrackerSummary } from "../cycle/hooks/useDealerCycle";
import AuditDueLabel from "../components/AuditDueLabel";
import AuditStatusBadge from "../components/AuditStatusBadge";
import {
	ConfirmActionDialog,
	ReassignReviewerDialog,
} from "../components/AuditWorkflowDialogs";
import { dealerAuditContent } from "../dealer-audit.content";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel, getSelectableYears } from "../dealer-audit.sla";
import {
	AUDIT_STATUS_FILTER_ORDER,
	getAuditStatusLabel,
	isReportAvailableStatus,
	isTerminalAuditStatus,
} from "../dealer-audit.status";
import type { DealerAuditListItem, DealerAuditQuarter } from "../dealer-audit.types";
import { useDealerAuditSession } from "../hooks/useDealerAuditAccess";
import { useDealerAuditListParams } from "../hooks/useDealerAuditListParams";
import { useReassignReviewer } from "../hooks/useDealerAuditMutations";
import { useDealerAuditList } from "../hooks/useDealerAudits";

const text = content.tracker;
const listText = dealerAuditContent.ui.list;
const ALL_VALUE = "";
const QUARTERS: readonly DealerAuditQuarter[] = [1, 2, 3, 4];

interface Kpi {
	id: string;
	label: string;
	value: string;
	Icon: LucideIcon;
	emphasis?: boolean;
}

interface FilterOption {
	value: string;
	label: string;
}

const downloadCsv = (fileName: string, csv: string): void => {
	const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

export default function AuditTrackerPage() {
	const navigate = useNavigate();
	const { permissions } = useDealerAuditSession();
	const params = useDealerAuditListParams();
	const audits = useDealerAuditList(params.listParams);
	const summary = useTrackerSummary({
		periodType: params.listParams.periodType,
		year: params.listParams.year,
		quarter: params.listParams.quarter,
	});
	const reminders = useSendReminders();
	const reassign = useReassignReviewer();

	const [reassignTarget, setReassignTarget] = useState<DealerAuditListItem | null>(null);
	const [isRemindAllOpen, setIsRemindAllOpen] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	const statusOptions = useMemo<FilterOption[]>(
		() => [
			{ value: ALL_VALUE, label: listText.allStatuses },
			...AUDIT_STATUS_FILTER_ORDER.map((status) => ({
				value: status,
				label: getAuditStatusLabel(status),
			})),
		],
		[],
	);
	const yearOptions = useMemo<FilterOption[]>(
		() => [
			{ value: ALL_VALUE, label: listText.allYears },
			...getSelectableYears().map((year) => ({
				value: String(year),
				label: formatPeriodLabel({ type: "YEARLY", year, quarter: null }),
			})),
		],
		[],
	);
	const quarterOptions = useMemo<FilterOption[]>(
		() => [
			{ value: ALL_VALUE, label: listText.allQuarters },
			...QUARTERS.map((q) => ({ value: String(q), label: listText.quarters[q] })),
		],
		[],
	);

	const kpis = useMemo<Kpi[]>(() => {
		const s = summary.data;
		const n = (value: number | undefined): string => (s ? String(value ?? 0) : "—");
		return [
			{ id: "total", label: text.kpi.total, value: n(s?.total), Icon: ClipboardList },
			{ id: "notStarted", label: text.kpi.notStarted, value: n(s?.notStarted), Icon: Hourglass },
			{ id: "inProgress", label: text.kpi.inProgress, value: n(s?.inProgress), Icon: Pencil },
			{ id: "awaitingReview", label: text.kpi.awaitingReview, value: n(s?.awaitingReview), Icon: Eye },
			{ id: "clarification", label: text.kpi.clarification, value: n(s?.clarification), Icon: MessageSquareWarning },
			{ id: "awaitingApproval", label: text.kpi.awaitingApproval, value: n(s?.awaitingApproval), Icon: FileCheck2 },
			{ id: "closed", label: text.kpi.closed, value: n(s?.closed), Icon: CheckCircle2 },
			{
				id: "overdue",
				label: text.kpi.overdue,
				value: n(s?.overdue),
				Icon: AlertTriangle,
				emphasis: (s?.overdue ?? 0) > 0,
			},
			{
				id: "average",
				label: text.kpi.averageScore,
				value: s?.averageScorePercent != null ? formatPercent(s.averageScorePercent) : "—",
				Icon: CheckCircle2,
			},
		];
	}, [summary.data]);

	const canManage = permissions.canAssignAudit;

	const remindOne = (audit: DealerAuditListItem): void => {
		setActionError(null);
		reminders.mutate(
			{ auditIds: [audit.id] },
			{ onError: (error) => setActionError(getAuditActionErrorMessage(error, "reminder")) },
		);
	};

	const handleRemindAllOverdue = async (): Promise<void> => {
		const all = await dealerCycleApi.getAllAudits({ ...params.listParams });
		const targets = all.filter((audit) => isAuditOverdue(audit) && canRemindAudit(audit));
		if (targets.length === 0) return;
		await reminders.mutateAsync({ auditIds: targets.map((audit) => audit.id) });
	};

	const handleDownload = async (): Promise<void> => {
		setActionError(null);
		setIsExporting(true);
		try {
			const all = await dealerCycleApi.getAllAudits({ ...params.listParams });
			downloadCsv(
				`dealer-audit-summary-${new Date().toISOString().slice(0, 10)}.csv`,
				buildAuditsCsv(all, getAuditStatusLabel),
			);
		} catch (error) {
			setActionError(getAuditActionErrorMessage(error, "summary"));
		} finally {
			setIsExporting(false);
		}
	};

	const rowActions = (audit: DealerAuditListItem) => [
		{
			id: "open",
			label: text.actions.open,
			Icon: Eye,
			onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.detail(audit.id)),
		},
		{
			id: "remind",
			label: text.actions.remind,
			Icon: BellRing,
			hidden: !canManage || !canRemindAudit(audit),
			onClick: () => remindOne(audit),
		},
		{
			id: "reassign",
			label: text.actions.reassign,
			Icon: UserCog,
			hidden: !permissions.canReassignReviewer || isTerminalAuditStatus(audit.status),
			onClick: () => setReassignTarget(audit),
		},
		{
			id: "report",
			label: text.actions.report,
			Icon: FileCheck2,
			hidden: !isReportAvailableStatus(audit.status),
			onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.report(audit.id)),
		},
	];

	const columns = useMemo<ColumnDef<DealerAuditListItem>[]>(
		() => [
			{
				id: "dealerName",
				header: listText.columns.dealer,
				cell: ({ row }) => (
					<div className="min-w-0">
						<p className="truncate font-medium">{row.original.dealerName}</p>
						<p className="truncate text-xs text-slate-500">
							{[row.original.dealerCode, row.original.location].filter(Boolean).join(" · ")}
						</p>
					</div>
				),
			},
			{
				id: "period",
				header: listText.columns.period,
				enableSorting: false,
				cell: ({ row }) => formatPeriodLabel(row.original.period),
			},
			{
				id: "status",
				header: listText.columns.status,
				cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
			},
			{
				id: "reviewer",
				header: listText.columns.reviewer,
				enableSorting: false,
				cell: ({ row }) => row.original.assignedReviewer?.name ?? "—",
			},
			{
				id: "dueAt",
				header: listText.columns.due,
				cell: ({ row }) => (
					<AuditDueLabel status={row.original.status} dueAt={row.original.dueAt} />
				),
			},
			{
				id: "progress",
				header: listText.columns.progress,
				enableSorting: false,
				cell: ({ row }) => `${row.original.completedItems}/${row.original.totalItems}`,
			},
			{
				id: "actions",
				header: "",
				enableSorting: false,
				cell: ({ row }) => (
					<ActionMenu<DealerAuditListItem>
						row={row.original}
						actions={rowActions(row.original)}
						ariaLabel={`${text.actions.more}: ${row.original.dealerName}`}
					/>
				),
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[canManage, permissions.canReassignReviewer],
	);

	const sorting = [
		{ id: params.listParams.sortBy, desc: params.listParams.sortOrder === "desc" },
	];

	return (
		<PageSectionLayout className="audit-page">
			<PageHeader headerText={text.title} subtitleText={text.subtitle} />

			<div className="audit-stack">
				{summary.isError ? (
					<Alert
						variant="error"
						title={content.common.loadError}
						primaryAction={{ label: content.common.retry, onClick: () => void summary.refetch() }}
					/>
				) : (
					<ul
						className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9"
						aria-label={text.title}
					>
						{kpis.map((kpi) => (
							<li
								key={kpi.id}
								className={
									kpi.emphasis
										? "rounded-lg border border-red-300 bg-red-50 p-3"
										: "rounded-lg border border-(--color-border-default) bg-white p-3"
								}
							>
								<div className="flex items-center gap-1.5 text-xs text-(--color-text-secondary)">
									<kpi.Icon size={14} aria-hidden="true" />
									<span className="break-words">{kpi.label}</span>
								</div>
								<p className="mt-1 text-2xl font-bold tabular-nums">{kpi.value}</p>
							</li>
						))}
					</ul>
				)}

				<Card
					actions={
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								text={text.downloadSummary}
								Icon={Download}
								appearance="standard"
								variant="outline"
								loading={isExporting}
								onClick={() => void handleDownload()}
							/>
							{canManage ? (
								<Button
									type="button"
									text={text.remindOverdue}
									Icon={Send}
									appearance="standard"
									variant="warning-soft"
									disabled={(summary.data?.overdue ?? 0) === 0}
									onClick={() => setIsRemindAllOpen(true)}
								/>
							) : null}
							{permissions.canCreateAudit ? (
								<Button
									type="button"
									text={text.newCycle}
									Icon={Plus}
									appearance="standard"
									variant="brand"
									onClick={() => navigate(DEALER_AUDIT_ROUTES.cycles.create)}
								/>
							) : null}
						</div>
					}
					title={
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<SearchInput
								value={params.searchInput}
								onChange={params.setSearchInput}
								placeholder={listText.searchPlaceholder}
								containerClassName="sm:col-span-2 lg:col-span-1"
							/>
							<SelectInput
								name="status"
								aria-label={listText.filters.status}
								options={statusOptions}
								value={statusOptions.find((o) => o.value === (params.status ?? ALL_VALUE)) ?? null}
								onChange={(option) =>
									params.setStatus(
										option && option.value !== ALL_VALUE
											? (AUDIT_STATUS_FILTER_ORDER.find((s) => s === option.value) ?? null)
											: null,
									)
								}
							/>
							<SelectInput
								name="year"
								options={yearOptions}
								value={
									yearOptions.find(
										(o) => o.value === (params.year === null ? ALL_VALUE : String(params.year)),
									) ?? null
								}
								onChange={(option) =>
									params.setYear(option && option.value ? Number(option.value) : null)
								}
							/>
							<SelectInput
								name="quarter"
								options={quarterOptions}
								value={
									quarterOptions.find(
										(o) => o.value === (params.quarter === null ? ALL_VALUE : String(params.quarter)),
									) ?? null
								}
								onChange={(option) =>
									params.setQuarter(QUARTERS.find((q) => String(q) === option?.value) ?? null)
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
									text={content.common.clearFilters}
									appearance="standard"
									variant="outline"
									size="sm"
									onClick={params.clearFilters}
								/>
							</div>
						) : null}

						{actionError ? <Alert variant="error" title={actionError} /> : null}
						{audits.isError ? (
							<Alert
								variant="error"
								title={listText.errorTitle}
								description={audits.errorMessage ?? undefined}
								primaryAction={{ label: listText.retry, onClick: () => void audits.refetch() }}
							/>
						) : null}

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
									const next = typeof updater === "function" ? updater(sorting) : updater;
									const [first] = next;
									const field = (["dueAt", "updatedAt", "dealerName", "status"] as const).find(
										(f) => f === first?.id,
									);
									if (!first || !field) {
										params.setSort("updatedAt", "desc");
										return;
									}
									params.setSort(field, first.desc ? "desc" : "asc");
								}}
								getRowId={(row) => row.id}
								onRowClick={(row) => navigate(DEALER_AUDIT_ROUTES.audits.detail(row.id))}
								emptyTitle={listText.emptyTitle}
								emptyDescription={listText.emptyDescription}
								ariaLabel={listText.tableLabel}
								minWidth="lg"
							/>
						</div>

						<ul className="grid gap-3 md:hidden" aria-label={listText.tableLabel}>
							{audits.isLoading ? (
								<li className="text-sm text-slate-600" role="status">
									{listText.loading}
								</li>
							) : audits.items.length === 0 ? (
								<li className="rounded-lg border border-dashed border-(--color-border-default) p-4 text-center text-sm text-slate-600">
									<p className="font-medium">{listText.emptyTitle}</p>
									<p>{listText.emptyDescription}</p>
								</li>
							) : (
								audits.items.map((audit) => (
									<li key={audit.id}>
										<AuditSummaryCard
											audit={audit}
											showReviewer
											primaryAction={{
												label: text.actions.open,
												Icon: Eye,
												onClick: () => navigate(DEALER_AUDIT_ROUTES.audits.detail(audit.id)),
											}}
											secondary={
												<ActionMenu<DealerAuditListItem>
													row={audit}
													actions={rowActions(audit)}
													ariaLabel={`${text.actions.more}: ${audit.dealerName}`}
												/>
											}
										/>
									</li>
								))
							)}
						</ul>
					</div>
				</Card>
			</div>

			<ReassignReviewerDialog
				open={reassignTarget !== null}
				currentReviewerId={reassignTarget?.assignedReviewer?.id ?? null}
				onClose={() => setReassignTarget(null)}
				onSubmit={async ({ reviewerId, reason }) => {
					if (!reassignTarget) return;
					await reassign.mutateAsync({ auditId: reassignTarget.id, reviewerId, reason });
				}}
			/>

			<ConfirmActionDialog
				open={isRemindAllOpen}
				title={text.remindOverdue}
				description={format(text.remindOverdueBody, { count: summary.data?.overdue ?? 0 })}
				confirmText={text.actions.remind}
				onClose={() => setIsRemindAllOpen(false)}
				onConfirm={handleRemindAllOverdue}
			/>
		</PageSectionLayout>
	);
}
