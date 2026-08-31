import type { ReactNode } from "react";
import { ClipboardClock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { AuditLogSection } from "../../../components/ui/audit";
import { CommentsSection } from "../../../components/ui/comments";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { ApprovalWorkflowTableContent } from "../../workflows";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import { useMedicalClaimView } from "../hooks/useMedicalClaimView";
import type { ReimbursementClaimFormMode } from "../types/reimbursementClaim.types";

type ReimbursementPageProps = {
	mode?: ReimbursementClaimFormMode;
	refreshKey?: string | number;
};

const ReimbursementPage = ({
	mode,
	refreshKey = 0,
}: ReimbursementPageProps) => {
	const navigate = useNavigate();

	const {
		claimId = "",
		medicalClaimId = "",
		id = "",
	} = useParams<{
		claimId?: string;
		medicalClaimId?: string;
		id?: string;
	}>();

	const resolvedClaimId = claimId || medicalClaimId || id;
	const isExistingClaim = Boolean(resolvedClaimId);

	const claimView = useMedicalClaimView({
		claimId: resolvedClaimId,
	});

	let content: ReactNode;

	if (!isExistingClaim) {
		content = (
			<Card padding="spacious">
				<p className="text-sm text-rejected" role="alert">
					Medical claim ID is missing.
				</p>
			</Card>
		);
	} else if (claimView.isLoading) {
		content = (
			<Card padding="spacious">
				<p role="status">Loading medical claim…</p>
			</Card>
		);
	} else if (claimView.isError) {
		content = (
			<Card padding="spacious">
				<p className="text-sm text-rejected" role="alert">
					Unable to load this medical claim. Please try again.
				</p>
			</Card>
		);
	} else {
		content = (
			<ReimbursementClaimForm
				claimId={resolvedClaimId}
				referenceNumber={claimView.referenceNumber}
				mode={mode ?? claimView.mode}
				canEdit={claimView.canEdit}
				actorRole={claimView.actorRole}
				initialValues={claimView.initialValues}
				initialLineItems={claimView.initialLineItems}
				statusLabel={claimView.detail?.status ?? undefined}
				isExportingExcel={claimView.isExportingExcel}
				handleExport={claimView.handleExport}
				isPreparingPdf={claimView.isPreparingPdf}
				isDownloadingPdf={claimView.isDownloadingPdf}
				handleDownloadPdf={claimView.handleDownloadPdf}
				handleViewPdf={claimView.handleViewPdf}
				canApprove={claimView.canApprove}
				canClarify={claimView.canClarify}
				isExternalApprover={claimView.isExternalApprover}
				approvalActionLoading={claimView.isWorkflowActionLoading}
				onApproveStage={claimView.approveCurrentStage}
				onClarifyStage={claimView.clarifyCurrentStage}
				onLineItemApprove={
					claimView.canApproveLineItems ? claimView.approveLineItem : undefined
				}
				onLineItemRemarksSave={
					claimView.canApproveLineItems
						? claimView.saveLineItemRemarks
						: undefined
				}
				onSubmit={claimView.canEdit ? claimView.saveClaim : undefined}
				actionText={claimView.actionText}
				commentsSection={
					claimView.canShowCommentSection ? (
						<CommentsSection
							subjectType="MEDICAL_CLAIM"
							subjectId={resolvedClaimId}
							approvalId={claimView.commentContext.approvalId}
							canComment={claimView.commentContext.canComment}
							mentionableUsers={claimView.commentContext.mentionableUsers}
							ccEmails={claimView.commentContext.ccEmails}
							currentUserId={claimView.currentUserId}
							refreshKey={refreshKey}
							emptyTitle="No comments yet"
							emptyDescription="Comments about this medical claim will appear here."
						/>
					) : null
				}
				auditSection={
					<AuditLogSection
						subjectType="MEDICAL_CLAIM"
						subjectId={resolvedClaimId}
						entityName="medical claim"
						refreshKey={refreshKey}
						emptyTitle="No medical claim activity yet"
						emptyDescription="Medical claim activity will appear here."
					/>
				}
				workflowSection={
					claimView.workflowStages.length > 0 ? (
						<ApprovalWorkflowTableContent
							stages={claimView.workflowStages}
							showEmptyState={false}
						/>
					) : (
						<CardEmpty
							title="No applicable workflow found"
							description="No workflow stages are available for this claim."
							Icon={ClipboardClock}
						/>
					)
				}
				onBack={() => navigate(-1)}
			/>
		);
	}

	return <PageSectionLayout>{content}</PageSectionLayout>;
};

export default ReimbursementPage;
