import type { ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import MedicalClaimCommentSection from "../components/MedicalClaimCommentSection";
import MedicalClaimWorkflowSection from "../components/MedicalClaimWorkflowSection";
import ReimbursementClaimForm from "../components/ReimbursementClaimForm";
import { useMedicalClaimView } from "../hooks/useMedicalClaimView";

const ReimbursementPage = () => {
	const navigate = useNavigate();
	const location = useLocation();
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
	const isViewRoute = location.pathname.endsWith("/view");
	const isGuestRoute = location.pathname.includes("/guest/");
	const isExistingClaim = Boolean(resolvedClaimId);
	const claimView = useMedicalClaimView({
		claimId: resolvedClaimId,
		isGuestRoute,
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
				mode={isViewRoute ? "view" : "edit"}
				canEdit={!isViewRoute && claimView.canEdit}
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
				onSubmit={
					!isViewRoute && claimView.canEdit ? claimView.saveClaim : undefined
				}
				actionText={isGuestRoute ? "Resubmit Claim" : "Save Changes"}
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
					<MedicalClaimWorkflowSection
						claimId={resolvedClaimId}
						criteria={{}}
						initialStages={claimView.workflowStages}
						showPreviewAction={!isGuestRoute}
					/>
				}
				onBack={() => navigate(-1)}
			/>
		);
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical Reimbursement Form",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{
							label: "Medical Reimbursement Forms",
							href: "/medi-claim/create",
						},
						{ label: "Medical Reimbursement Form" },
					],
					separator: "›",
				}}
			/>

			{content}
		</PageSectionLayout>
	);
};

export default ReimbursementPage;
