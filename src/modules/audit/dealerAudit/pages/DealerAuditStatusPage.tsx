// modules/audit/dealerAudit/pages/DealerAuditStatusPage.tsx
//
// "Where is my audit?" — a four-step progress bar, one plain sentence about
// what happens next, and the dealer / reviewer / final scoring matrix.
// Dealers never see reviewer scores or the audit trail; reviewers,
// approvers and admins do.

import { FileText } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import { StepProgress } from "../../../../components/ui/StepProgress";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import { formatAuditDateTime } from "../../shared/execution/audit-execution.format";
import { flattenChecklistItems } from "../../shared/execution/audit-execution.utils";
import AuditStatusBadge from "../components/AuditStatusBadge";
import { PageError, PageLoading } from "../cycle/components/AuditPageStates";
import {
	ScoreChangeList,
	ScoreOverview,
} from "../cycle/components/AuditReviewSections";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import { getAuditProgressStep } from "../cycle/dealer-cycle.logic";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel } from "../dealer-audit.sla";
import { isReportAvailableStatus } from "../dealer-audit.status";
import { useAuditPermissions } from "../hooks/useDealerAuditAccess";
import {
	useDealerAudit,
	useDealerAuditChecklist,
	useDealerAuditHistory,
} from "../hooks/useDealerAudits";

const text = content.status;

export default function DealerAuditStatusPage() {
	const { auditId } = useParams();
	const navigate = useNavigate();
	const auditQuery = useDealerAudit(auditId);
	const audit = auditQuery.data;
	const permissions = useAuditPermissions(audit);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const historyQuery = useDealerAuditHistory(auditId, permissions.canViewHistory);

	const showReviewer = permissions.canViewReviewerAssessment;
	const sections = checklistQuery.data?.sections;
	const items = useMemo(() => (sections ? flattenChecklistItems(sections) : []), [sections]);

	const back = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel="Back"
			to={DEALER_AUDIT_ROUTES.audits.list}
		/>
	);

	if (auditQuery.isLoading) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<PageLoading />
			</PageSectionLayout>
		);
	}
	if (auditQuery.isError || !audit) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<PageError
					message={getAuditActionErrorMessage(auditQuery.error, "audit")}
					onRetry={() => void auditQuery.refetch()}
				/>
			</PageSectionLayout>
		);
	}

	const step = getAuditProgressStep(audit.status);
	const steps = text.steps.map((label, index) => ({ id: index + 1, label }));

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			{back}
			<PageHeader
				headerText={text.title}
				subtitleText={`${audit.dealerName} · ${formatPeriodLabel(audit.period)}`}
			/>

			<div className="audit-stack">
				<Card variant="outlined" padding="default">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<p className="text-xs text-(--color-text-secondary)">{text.current}</p>
							<AuditStatusBadge status={audit.status} />
						</div>
						{isReportAvailableStatus(audit.status) && permissions.canDownloadReport ? (
							<Button
								type="button"
								text={text.viewReport}
								Icon={FileText}
								appearance="standard"
								variant="brand"
								onClick={() => navigate(DEALER_AUDIT_ROUTES.audits.report(audit.id))}
							/>
						) : null}
					</div>

					{step > 0 ? (
						<div className="mt-4">
							<StepProgress steps={steps} currentStep={step} ariaLabel={text.stepsAria} />
						</div>
					) : null}

					<div className="mt-4 rounded-lg bg-slate-50 p-3">
						<p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary)">
							{text.nextStep}
						</p>
						<p className="mt-1 text-base">{text.next[audit.status] ?? ""}</p>
					</div>
				</Card>

				{sections && sections.length > 0 ? (
					<ScoreOverview
						sections={sections}
						title={text.scores}
						showReviewer={showReviewer}
						showFinal={isReportAvailableStatus(audit.status)}
					/>
				) : null}

				{showReviewer && items.length > 0 ? <ScoreChangeList items={items} /> : null}

				{permissions.canViewHistory && historyQuery.data && historyQuery.data.length > 0 ? (
					<Card variant="outlined" title={text.timeline} padding="compact">
						<ol className="space-y-3">
							{historyQuery.data.map((entry) => (
								<li key={entry.id} className="border-l-2 border-(--color-border-default) pl-3">
									<p className="text-sm font-medium">
										{entry.actorName}
										{entry.actorRole ? ` · ${entry.actorRole}` : ""}
									</p>
									<p className="text-xs text-(--color-text-secondary)">
										{formatAuditDateTime(entry.occurredAt)}
									</p>
									{entry.comment ? (
										<p className="mt-1 break-words text-sm">{entry.comment}</p>
									) : null}
								</li>
							))}
						</ol>
					</Card>
				) : null}
			</div>
		</PageSectionLayout>
	);
}
