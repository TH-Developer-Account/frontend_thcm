import type { ReactNode } from "react";
import { ClipboardClock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { AuditLogSection } from "../../../components/ui/audit";
import { CommentsSection } from "../../../components/ui/comments";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { getApiErrorMessage } from "../../../utils/apiError.helper";
import { ApprovalWorkflowTableContent } from "../../workflows";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import { useMedicalClaimView } from "../hooks/useMedicalClaimView";
import type { ReimbursementClaimFormMode } from "../types/reimbursementClaim.types";

type ReimbursementPageProps = {
	mode?: ReimbursementClaimFormMode;
	refreshKey?: string | number;
};

/** THCM claim detail: review, line-item approval, workflow, close, export. */
const ReimbursementPage = ({ mode, refreshKey = 0 }: ReimbursementPageProps) => {
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
	const claimView = useMedicalClaimView({ claimId: resolvedClaimId });

	let content: ReactNode;

	if (!resolvedClaimId) {
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
	} else if (claimView.isError || !claimView.detail) {
		content = (
			<Card padding="spacious">
				<div className="flex flex-col items-start gap-3">
					<p className="text-sm text-rejected" role="alert">
						{getApiErrorMessage(
							claimView.error,
							"Unable to load this medical claim. Please try again.",
						)}
					</p>
					<Button
						type="button"
						text="Retry"
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => void claimView.refresh()}
					/>
				</div>
			</Card>
		);
	} else {
		content = (
			<ReimbursementClaimForm
				claimId={resolvedClaimId}
				referenceNumber={claimView.referenceNumber}
				// Staff never edit claimant data — view mode unless a page forces it.
				mode={mode ?? claimView.mode}
				canEdit={claimView.canEdit}
				actorRole={claimView.actorRole}
				initialValues={claimView.initialValues}
				initialLineItems={claimView.initialLineItems}
				gradeOptions={claimView.gradeOptions}
				statusLabel={claimView.detail.status ?? undefined}
				correctionReason={claimView.correctionReason}
				eligibilityPendingAmount={claimView.eligibilityPendingAmount}
				// Approvers decide on over-limit claims; never block in staff view.
				enforceEligibilityLimit={false}
				isExportingExcel={claimView.isExportingExcel}
				handleExport={claimView.permissions.canExport ? claimView.handleExport : undefined}
				isPreparingPdf={claimView.isPreparingPdf}
				isDownloadingPdf={claimView.isDownloadingPdf}
				handleViewPdf={claimView.permissions.canDownloadPdf ? claimView.handleViewPdf : undefined}
				handleDownloadPdf={
					claimView.permissions.canDownloadPdf ? claimView.handleDownloadPdf : undefined
				}
				pdfUrl={claimView.pdfUrl}
				onClosePdfPreview={claimView.closePdfPreview}
				canApprove={claimView.canApprove}
				canClarify={claimView.canClarify}
				canReviewLineItems={claimView.canApproveLineItems}
				isExternalApprover={claimView.isExternalApprover}
				approvalActionLoading={claimView.isWorkflowActionLoading}
				onApproveStage={claimView.approveCurrentStage}
				onClarifyStage={claimView.clarifyCurrentStage}
				onLineItemApprove={
					claimView.canApproveLineItems ? claimView.approveLineItem : undefined
				}
				onLineItemUnapprove={
					claimView.canApproveLineItems ? claimView.unapproveLineItem : undefined
				}
				onLineItemRemarksSave={
					claimView.canApproveLineItems ? claimView.saveLineItemRemarks : undefined
				}
				canClose={claimView.canClose}
				onCloseClaim={claimView.canClose ? claimView.closeClaim : undefined}
				isClosing={claimView.isClosing}
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
