import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import MedicalClaimCommentSection from "../components/MedicalClaimCommentSection";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import { useMedicalClaimView } from "../hooks/useMedicalClaimView";
import { ClipboardClock } from "lucide-react";
import { CardEmpty } from "../../../components/ui/CardSkeleton";
import { ApprovalWorkflowTableContent } from "../../workflows";

type ReimbursementPageProps = {
	mode?: "view" | "edit";
};

const ReimbursementPage = ({ mode = "edit" }: ReimbursementPageProps) => {
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
	if (isExistingClaim && claimView.isLoading) {
		content = (
			<Card padding="spacious">
				<p role="status">Loading medical claim…</p>
			</Card>
		);
	} else if (isExistingClaim && claimView.isError) {
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
				isExportingExcel={claimView.isExportingExcel}
				handleExport={claimView.handleExport}
				isPreparingPdf={claimView.isPreparingPdf}
				isDownloadingPdf={claimView.isDownloadingPdf}
				handleDownloadPdf={claimView.handleDownloadPdf}
				handleViewPdf={claimView.handleViewPdf}
				referenceNumber={claimView.referenceNumber}
				mode={mode}
				canEdit={claimView.canEdit}
				actorRole={claimView.actorRole}
				initialValues={claimView.initialValues}
				initialLineItems={claimView.initialLineItems}
				statusLabel={claimView.detail?.status ?? undefined}
				canApprove={claimView.canApprove}
				canClarify={claimView.canClarify}
				isExternalApprover={claimView.isExternalApprover}
				approvalActionLoading={claimView.isWorkflowActionLoading}
				onApproveStage={claimView.approveCurrentStage}
				onClarifyStage={claimView.clarifyCurrentStage}
				onLineItemApprove={
					claimView.canApproveLineItems ? claimView.approveLineItem : undefined
				}
				onLineItemRemarksSave={claimView.saveLineItemRemarks}
				onSubmit={claimView.canEdit ? claimView.saveClaim : undefined}
				actionText="Save Changes"
				commentsSection={
					claimView.canComment && claimView.workflowStages ? (
						<MedicalClaimCommentSection
							claimId={resolvedClaimId}
							workflow={claimView.workflowStages}
							createdBy={claimView.creator}
						/>
					) : null
				}
				workflowSection={
					claimView.workflowStages.length > 0 ? (
						<ApprovalWorkflowTableContent
							stages={claimView.workflowStages}
							showEmptyState={false}
						/>
					) : (
						<CardEmpty
							title={
								claimView.workflowStages === undefined
									? "No approval workflow assigned"
									: "No applicable workflow found"
							}
							description={"No workflow stages are available for this claim."}
							Icon={ClipboardClock}
						/>
					)
				}
				onBack={() => navigate(-1)}
			/>
		);
	}

	return (
		<PageSectionLayout>
			{/* <PageHeader
					headerText="Medical Reimbursement Form"
					navigation={{
						variant: "breadcrumbs",
						ariaLabel: "Medical Reimbursement Form",
						breadcrumbs: [
							{
								label: "Home Screen",
								href: "/",
							},
							{
								label: "Medical Reimbursement Forms",
								href: "/medi-claim/create",
							},
							{
								label: "Medical Reimbursement Form",
							},
						],
						separator: "›",
					}}
				/> */}

			{content}
		</PageSectionLayout>
	);
};

export default ReimbursementPage;
