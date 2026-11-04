// modules/audit/dealerAudit/pages/ApprovalPage.tsx
//
// Approver sign-off. Uses the shared ApprovalActionsBar so the reason is
// ALWAYS mandatory:
//   Approve              → approveAudit(remarks = reason)
//   Return to reviewer   → opens the clarification dialog pre-filled with the reason
//   Reject (separate)    → RejectAuditDialog (irreversible, kept apart)
// The page shows the final score matrix, every score the reviewer lowered
// and the deficiencies, so the decision is made on facts.

import { XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../../../components/common/Button";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import ApprovalActionsBar from "../../../../components/ui/ApprovalActionsBar";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import { flattenChecklistItems } from "../../shared/execution/audit-execution.utils";
import {
	RaiseClarificationDialog,
	RejectAuditDialog,
} from "../components/AuditWorkflowDialogs";
import {
	PageError,
	PageLoading,
	PageNoAccess,
} from "../cycle/components/AuditPageStates";
import {
	DeficiencyList,
	ScoreChangeList,
	ScoreOverview,
} from "../cycle/components/AuditReviewSections";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { formatPeriodLabel } from "../dealer-audit.sla";
import { useAuditPermissions } from "../hooks/useDealerAuditAccess";
import { useApproveAudit, useRaiseClarification, useRejectAudit } from "../hooks/useDealerAuditMutations";
import { useDealerAudit, useDealerAuditChecklist } from "../hooks/useDealerAudits";

const text = content.approval;
const MIN_REASON = 3;

export default function ApprovalPage() {
	const { auditId } = useParams();
	const navigate = useNavigate();
	const auditQuery = useDealerAudit(auditId);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const audit = auditQuery.data;
	const permissions = useAuditPermissions(audit);

	const approve = useApproveAudit();
	const raiseClarification = useRaiseClarification();
	const reject = useRejectAudit();

	const [isReturnOpen, setIsReturnOpen] = useState(false);
	const [isRejectOpen, setIsRejectOpen] = useState(false);
	const [returnReason, setReturnReason] = useState("");

	const sections = checklistQuery.data?.sections;
	const items = useMemo(() => (sections ? flattenChecklistItems(sections) : []), [sections]);

	const back = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel="Back"
			to={DEALER_AUDIT_ROUTES.approvals}
		/>
	);

	if (auditQuery.isLoading || checklistQuery.isLoading) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<PageLoading />
			</PageSectionLayout>
		);
	}
	if (auditQuery.isError || checklistQuery.isError || !audit || !sections) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<PageError
					message={getAuditActionErrorMessage(auditQuery.error ?? checklistQuery.error, "audit")}
					onRetry={() => {
						void auditQuery.refetch();
						void checklistQuery.refetch();
					}}
				/>
			</PageSectionLayout>
		);
	}
	if (!permissions.canApprove) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<PageNoAccess />
			</PageSectionLayout>
		);
	}

	const goBackToQueue = (): void => navigate(DEALER_AUDIT_ROUTES.approvals);

	// The error is shown from approve.error; swallowing it here keeps the
	// bar from throwing an unhandled rejection and keeps the typed reason.
	const handleApprove = async (reason: string): Promise<void> => {
		try {
			await approve.mutateAsync({ auditId: audit.id, version: audit.version, remarks: reason });
			goBackToQueue();
		} catch {
			/* surfaced via approve.error */
		}
	};

	const handleReturn = (reason: string): void => {
		setReturnReason(reason);
		setIsReturnOpen(true);
	};

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			<div className="audit-stack">
				<ApprovalActionsBar
					layout="card"
					eyebrow={`${audit.auditNumber} · ${formatPeriodLabel(audit.period)}`}
					title={`${text.title}: ${audit.dealerName}`}
					subtitle={text.subtitle}
					onBack={goBackToQueue}
					canApprove={permissions.canApprove}
					canClarify={permissions.canRaiseClarification}
					approveRequiresReason
					loading={approve.isPending}
					minReasonLength={MIN_REASON}
					onApprove={handleApprove}
					onClarify={handleReturn}
					approveLabel={text.approve}
					clarifyLabel={text.returnToReviewer}
					reasonLabel={text.reasonLabel}
					reasonPlaceholder={text.reasonRequired}
				/>

				{approve.error ? (
					<p className="form-error-text" role="alert">
						{getAuditActionErrorMessage(approve.error, "approval")}
					</p>
				) : null}

				<ScoreOverview
					sections={sections}
					title={content.status.scores}
					showReviewer
					showFinal
				/>
				<ScoreChangeList items={items} />
				<DeficiencyList items={items} showReviewerNote showEvidence />

				{permissions.canReject ? (
					<div className="flex justify-end border-t border-(--color-border-default) pt-4">
						<Button
							type="button"
							text={text.reject}
							Icon={XCircle}
							appearance="standard"
							variant="danger-soft"
							onClick={() => setIsRejectOpen(true)}
						/>
					</div>
				) : null}
			</div>

			<RaiseClarificationDialog
				open={isReturnOpen}
				items={items}
				initialRemarks={returnReason}
				onClose={() => setIsReturnOpen(false)}
				onSubmit={async (values) => {
					await raiseClarification.mutateAsync({
						auditId: audit.id,
						version: audit.version,
						itemIds: values.itemIds,
						remarks: values.remarks,
					});
					goBackToQueue();
				}}
			/>
			<RejectAuditDialog
				open={isRejectOpen}
				onClose={() => setIsRejectOpen(false)}
				onSubmit={async (values) => {
					await reject.mutateAsync({
						auditId: audit.id,
						version: audit.version,
						reason: values.reason,
					});
					goBackToQueue();
				}}
			/>
		</PageSectionLayout>
	);
}
