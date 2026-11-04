// modules/audit/dealerAudit/pages/ReviewSummaryPage.tsx
//
// Reviewer's last step before approval: every score change with its reason,
// any items still waiting on the dealer, and a single "Send for approval".
// Validation runs on server-confirmed checklist data.

import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { PageHeader } from "../../../../components/ui/PageHeader";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import { getAuditActionErrorMessage } from "../../shared/audit-error.utils";
import { flattenChecklistItems } from "../../shared/execution/audit-execution.utils";
import AuditSubmissionSummary from "../../shared/execution/components/AuditSubmissionSummary";
import { ConfirmActionDialog } from "../components/AuditWorkflowDialogs";
import {
	PageError,
	PageLoading,
	PageNoAccess,
} from "../cycle/components/AuditPageStates";
import {
	ScoreChangeList,
	ScoreOverview,
} from "../cycle/components/AuditReviewSections";
import { dealerCycleContent as content } from "../cycle/dealer-cycle.content";
import { getClarificationCandidates } from "../cycle/dealer-cycle.logic";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { validateReviewForSubmission } from "../dealer-audit.schemas";
import { useAuditPermissions } from "../hooks/useDealerAuditAccess";
import { useSubmitReview } from "../hooks/useDealerAuditMutations";
import { useDealerAudit, useDealerAuditChecklist } from "../hooks/useDealerAudits";

const text = content.reviewSummary;

export default function ReviewSummaryPage() {
	const { auditId } = useParams();
	const navigate = useNavigate();
	const auditQuery = useDealerAudit(auditId);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const audit = auditQuery.data;
	const permissions = useAuditPermissions(audit);
	const submitReview = useSubmitReview();
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const sections = checklistQuery.data?.sections;
	const items = useMemo(() => (sections ? flattenChecklistItems(sections) : []), [sections]);
	const validation = useMemo(() => validateReviewForSubmission(items), [items]);
	const clarifications = useMemo(() => getClarificationCandidates(items), [items]);

	const back = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel="Back"
			to={auditId ? DEALER_AUDIT_ROUTES.audits.detail(auditId) : DEALER_AUDIT_ROUTES.reviewQueue}
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
	if (!permissions.canSubmitReview) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<PageNoAccess />
			</PageSectionLayout>
		);
	}

	const handleSubmitReview = async (): Promise<void> => {
		await submitReview.mutateAsync({ auditId: audit.id, version: audit.version });
		navigate(DEALER_AUDIT_ROUTES.reviewQueue);
	};

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			{back}
			<PageHeader
				headerText={text.title}
				subtitleText={`${audit.dealerName} · ${text.subtitle}`}
			/>

			<div className="audit-stack">
				{!validation.valid ? (
					<AuditSubmissionSummary
						result={validation}
						heading={text.title}
						onJumpToItem={(itemId) =>
							navigate(DEALER_AUDIT_ROUTES.execution.item(audit.id, itemId))
						}
					/>
				) : null}

				{audit.openClarificationCount > 0 ? (
					<Alert variant="warning" title={text.openClarifications} />
				) : null}

				<ScoreOverview
					sections={sections}
					title={content.status.scores}
					showReviewer
					showFinal
				/>

				<ScoreChangeList items={items} title={text.scoreChanges} />

				{clarifications.length > 0 ? (
					<Card variant="outlined" title={text.clarifications} padding="compact">
						<ul className="list-disc space-y-1 pl-5 text-sm">
							{clarifications.map((item) => (
								<li key={item.id} className="break-words">
									{item.sequence}. {item.title}
								</li>
							))}
						</ul>
					</Card>
				) : null}

				<Button
					type="button"
					text={text.submit}
					Icon={Send}
					appearance="standard"
					variant="brand"
					size="xl"
					fullWidth
					disabled={!validation.valid || audit.openClarificationCount > 0}
					onClick={() => setIsConfirmOpen(true)}
				/>
			</div>

			<ConfirmActionDialog
				open={isConfirmOpen}
				title={text.confirmTitle}
				description={text.confirmBody}
				confirmText={text.confirmAction}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={handleSubmitReview}
			/>
		</PageSectionLayout>
	);
}
