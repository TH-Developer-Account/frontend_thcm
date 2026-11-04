// modules/audit/dealerAudit/pages/DealerAuditSubmitPage.tsx
//
// The last step for a dealer: one page that says clearly whether everything is
// complete, lists anything missing with a "Go to item" jump, and offers a single
// Submit button. Validation uses server-confirmed checklist data only.

import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import PageNavigation from "../../../../components/ui/PageNavigation/PageNavigation";
import { PageHeader } from "../../../../components/ui/PageHeader";
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
import { dealerCycleContent as content, formatCycleMessage as format } from "../cycle/dealer-cycle.content";
import { DEALER_AUDIT_ROUTES } from "../dealer-audit.routes";
import { validateAuditForSubmission } from "../dealer-audit.schemas";
import { useAuditPermissions } from "../hooks/useDealerAuditAccess";
import { useSubmitAudit } from "../hooks/useDealerAuditMutations";
import { useDealerAudit, useDealerAuditChecklist } from "../hooks/useDealerAudits";

const text = content.submit;

export default function DealerAuditSubmitPage() {
	const { auditId } = useParams();
	const navigate = useNavigate();
	const auditQuery = useDealerAudit(auditId);
	const checklistQuery = useDealerAuditChecklist(auditId);
	const permissions = useAuditPermissions(auditQuery.data);
	const submit = useSubmitAudit();
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	const items = useMemo(
		() => (checklistQuery.data ? flattenChecklistItems(checklistQuery.data.sections) : []),
		[checklistQuery.data],
	);
	const audit = auditQuery.data;
	const validation = useMemo(
		() => (audit ? validateAuditForSubmission(items, audit.status) : null),
		[audit, items],
	);

	const back = (
		<PageNavigation
			variant="button"
			direction="back"
			ariaLabel="Back"
			to={auditId ? DEALER_AUDIT_ROUTES.myAudits : DEALER_AUDIT_ROUTES.audits.list}
		/>
	);

	if (auditQuery.isLoading || checklistQuery.isLoading) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				<PageLoading />
			</PageSectionLayout>
		);
	}
	if (auditQuery.isError || checklistQuery.isError || !audit || !validation) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<PageError
					message={getAuditActionErrorMessage(
						auditQuery.error ?? checklistQuery.error,
						"audit",
					)}
					onRetry={() => {
						void auditQuery.refetch();
						void checklistQuery.refetch();
					}}
				/>
			</PageSectionLayout>
		);
	}
	if (!permissions.canSubmitSelfAssessment) {
		return (
			<PageSectionLayout className="audit-page audit-page-narrow">
				{back}
				<PageNoAccess />
			</PageSectionLayout>
		);
	}

	const handleSubmitSelfAssessment = async (): Promise<void> => {
		await submit.mutateAsync({ auditId: audit.id, version: audit.version });
		setIsConfirmOpen(false);
		navigate(DEALER_AUDIT_ROUTES.audits.status(audit.id));
	};

	const jumpToItem = (itemId: string): void =>
		navigate(DEALER_AUDIT_ROUTES.execution.item(audit.id, itemId));

	return (
		<PageSectionLayout className="audit-page audit-page-narrow">
			{back}
			<PageHeader
				headerText={text.title}
				subtitleText={`${audit.dealerName} · ${text.subtitle}`}
			/>

			<div className="audit-stack">
				<Card variant="outlined" padding="default">
					<p className="text-sm font-medium">
						{format(content.myAudits.progress, {
							done: audit.completedItems,
							total: audit.totalItems,
						})}
					</p>
					<div
						className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"
						role="progressbar"
						aria-valuemin={0}
						aria-valuemax={audit.totalItems}
						aria-valuenow={audit.completedItems}
					>
						<div
							className="h-full rounded-full bg-emerald-600"
							style={{
								width: `${audit.totalItems > 0 ? Math.round((audit.completedItems / audit.totalItems) * 100) : 0}%`,
							}}
						/>
					</div>
				</Card>

				{validation.valid ? (
					<Alert variant="success" title={text.allDone} />
				) : (
					<>
						<Alert
							variant="warning"
							title={format(text.notDone, { count: validation.incompleteCount })}
						/>
						<AuditSubmissionSummary
							result={validation}
							heading={text.title}
							onJumpToItem={jumpToItem}
						/>
					</>
				)}

				<Card variant="outlined" padding="default">
					<Button
						type="button"
						text={text.submit}
						Icon={Send}
						appearance="standard"
						variant="brand"
						size="xl"
						fullWidth
						disabled={!validation.valid}
						onClick={() => setIsConfirmOpen(true)}
					/>
				</Card>
			</div>

			<ConfirmActionDialog
				open={isConfirmOpen}
				title={text.confirmTitle}
				description={text.confirmBody}
				confirmText={text.confirmAction}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={handleSubmitSelfAssessment}
			/>
		</PageSectionLayout>
	);
}
