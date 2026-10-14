// modules/audit/dealerAudit/pages/DealerAuditDetailPage.tsx
//
// One audit: summary, progress, reminders, workflow actions and (for staff)
// the audit trail. What each role sees is decided by the audit-scoped
// permissions, never by role names.

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Card from "../../../../components/common/Card";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { dealerAuditContent as content } from "../dealer-audit.content";
import { formatAuditDate, formatAuditDateTime } from "../../shared/execution/audit-execution.format";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel } from "../dealer-audit.sla";
import {
	getAuditStatusLabelByCode,
	isReportAvailableStatus,
} from "../dealer-audit.status";
import {
	calculateFinalTotals,
	calculateSelfTotals,
	flattenChecklistItems,
	getChecklistProgress,
	getReviewProgress,
} from "../../shared/execution/audit-execution.utils";
import AuditDueLabel from "../components/AuditDueLabel";
import AuditHistoryPanel from "../../shared/execution/components/AuditHistoryPanel";
import AuditProgressSummary from "../../shared/execution/components/AuditProgressSummary";
import AuditReminderBanner from "../../shared/execution/components/AuditReminderBanner";
import AuditStatusBadge from "../components/AuditStatusBadge";
import AuditWorkflowActions from "../components/AuditWorkflowActions";
import { useAuditReminders } from "../hooks/useAuditReminders";
import {
	useAuditPermissions,
	useDealerAuditSession,
} from "../hooks/useDealerAuditAccess";
import {
	useDealerAudit,
	useDealerAuditChecklist,
	useDealerAuditHistory,
} from "../hooks/useDealerAudits";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import Button from "../../../../components/common/Button";

const text = content.ui.detail;

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="min-w-0">
			<dt className="text-xs text-(--color-text-secondary)">{label}</dt>
			<dd className="break-words text-sm text-(--color-text-primary)">
				{children}
			</dd>
		</div>
	);
}

export default function DealerAuditDetailPage() {
	const { auditId } = useParams();
	const navigate = useNavigate();
	const { role } = useDealerAuditSession();

	const auditQuery = useDealerAudit(auditId);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const audit = auditQuery.data;
	const permissions = useAuditPermissions(audit);
	const historyQuery = useDealerAuditHistory(auditId, permissions.canViewHistory);
	const reminders = useAuditReminders(
		audit,
		role === "DEALER" ? "DEALER" : "INTERNAL",
	);

	const items = useMemo(
		() =>
			checklistQuery.data
				? flattenChecklistItems(checklistQuery.data.sections)
				: undefined,
		[checklistQuery.data],
	);

	const selfProgress = useMemo(
		() => (items ? getChecklistProgress(items) : null),
		[items],
	);
	const reviewProgress = useMemo(
		() => (items ? getReviewProgress(items) : null),
		[items],
	);
	const selfTotals = useMemo(
		() => (items ? calculateSelfTotals(items) : null),
		[items],
	);
	const finalTotals = useMemo(
		() => (items ? calculateFinalTotals(items) : null),
		[items],
	);

	const backNavigation = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel={text.back}
			to={DEALER_AUDIT_ROUTES.audits.list}
		/>
	);

	if (auditQuery.isLoading) {
		return (
			<PageSectionLayout className="audit-page">
				<p className="text-sm text-slate-600" role="status">
					{text.loading}
				</p>
			</PageSectionLayout>
		);
	}

	if (auditQuery.isError || !audit) {
		return (
			<PageSectionLayout className="audit-page">
				{backNavigation}
				<Alert
					variant="error"
					title={text.errorTitle}
					description={getAuditActionErrorMessage(auditQuery.error, "audit")}
					primaryAction={{
						label: text.retry,
						onClick: () => void auditQuery.refetch(),
					}}
				/>
			</PageSectionLayout>
		);
	}

	if (!permissions.canView) {
		return (
			<PageSectionLayout className="audit-page">
				{backNavigation}
				<Alert
					variant="warning"
					title={text.deniedTitle}
					description={text.deniedDescription}
				/>
			</PageSectionLayout>
		);
	}

	const showFinalScore =
		permissions.canViewReviewerAssessment || isReportAvailableStatus(audit.status);
	const progress =
		permissions.canReview && reviewProgress ? reviewProgress : selfProgress;
	const progressLabel = permissions.canReview
		? text.reviewProgress
		: text.selfProgress;

	return (
		<PageSectionLayout className="audit-page">
			<header className="flex flex-wrap items-start gap-3">
				{backNavigation}
				<div className="min-w-0 flex-1">
					<h1 className="break-words text-lg font-semibold text-(--color-text-primary)">
						{audit.dealerName}
					</h1>
					<p className="text-sm text-(--color-text-secondary)">
						{audit.auditNumber} · {formatPeriodLabel(audit.period)}
					</p>
				</div>
				<AuditStatusBadge status={audit.status} />
			</header>

			<div className="audit-stack">
				<AuditReminderBanner reminders={reminders} />

				{audit.finalScoreSource === "SELF_AUTO" ? (
					<Alert
						variant="info"
						title={text.autoFinalizedTitle}
						description={text.autoFinalizedDescription}
					/>
				) : null}

				{checklistQuery.isError ? (
					<Alert
						variant="error"
						title={text.checklistErrorTitle}
						description={getAuditActionErrorMessage(
							checklistQuery.error,
							"checklist",
						)}
						primaryAction={{
							label: text.retry,
							onClick: () => void checklistQuery.refetch(),
						}}
					/>
				) : null}

				<Card variant="outlined" title={text.actionsTitle} padding="compact">
					<AuditWorkflowActions
						audit={audit}
						items={items}
						permissions={permissions}
						onOpenChecklist={() =>
							navigate(DEALER_AUDIT_ROUTES.execution.checklist(audit.id))
						}
						onOpenReport={() =>
							navigate(DEALER_AUDIT_ROUTES.audits.report(audit.id))
						}
						onJumpToItem={(itemId) =>
							navigate(DEALER_AUDIT_ROUTES.execution.item(audit.id, itemId))
						}
						onReAuditCreated={(newAuditId) =>
							navigate(DEALER_AUDIT_ROUTES.audits.detail(newAuditId))
						}
					/>
				</Card>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<Card variant="outlined" title={text.summaryTitle} padding="compact">
						<dl className="grid grid-cols-2 gap-3">
							{permissions.canViewDealerInfo ? (
								<>
									<DetailRow label={text.dealer}>
										{audit.dealerName}
										{audit.dealerCode ? ` (${audit.dealerCode})` : ""}
									</DetailRow>
									<DetailRow label={text.location}>
										{audit.location || "—"}
									</DetailRow>
								</>
							) : null}
							<DetailRow label={text.template}>
								{audit.templateName} · v{audit.templateVersion}
							</DetailRow>
							<DetailRow label={text.period}>
								{formatPeriodLabel(audit.period)}
							</DetailRow>
							<DetailRow label={text.due}>
								<AuditDueLabel status={audit.status} dueAt={audit.dueAt} />
							</DetailRow>
							{permissions.canViewWorkflow ? (
								<DetailRow label={text.reviewer}>
									{audit.assignedReviewer?.name ?? "—"}
								</DetailRow>
							) : null}
							<DetailRow label={text.submittedAt}>
								{formatAuditDateTime(audit.submittedAt)}
							</DetailRow>
							<DetailRow label={text.closedAt}>
								{formatAuditDate(audit.closedAt)}
							</DetailRow>
						</dl>
					</Card>

					<Card variant="outlined" title={text.progressTitle} padding="compact">
						{progress ? (
							<AuditProgressSummary
								label={progressLabel}
								progress={progress}
								selfTotals={selfTotals}
								finalTotals={showFinalScore ? finalTotals : null}
							/>
						) : checklistQuery.isLoading ? (
							<p className="text-sm text-slate-600" role="status">
								{text.loadingChecklist}
							</p>
						) : null}
					</Card>
				</div>

				{permissions.canViewHistory ? (
					<Card variant="outlined" title={text.historyTitle} padding="compact">
						<AuditHistoryPanel
							entries={historyQuery.data ?? []}
							getStatusLabel={getAuditStatusLabelByCode}
							isLoading={historyQuery.isLoading}
							isError={historyQuery.isError}
							onRetry={() => void historyQuery.refetch()}
						/>
					</Card>
				) : null}

				{items ? (
					<div>
						<Button
							type="button"
							text={text.viewChecklist}
							appearance="standard"
							variant="outline"
							onClick={() =>
								navigate(DEALER_AUDIT_ROUTES.execution.checklist(audit.id))
							}
						/>
					</div>
				) : null}
			</div>
		</PageSectionLayout>
	);
}
