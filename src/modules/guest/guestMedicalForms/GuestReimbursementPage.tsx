import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import ReimbursementClaimForm from "../../medicalReimbursment/components/ReimbursementClaimForm";

import { useGuestMedicalClaimView } from "./useGuestReimbursementClaimAccess";
import { MEDICLAIM_BACKEND } from "../../medicalReimbursment/utils/mediclaimBackend.config";

const GuestReimbursementPage = () => {
	const navigate = useNavigate();
	const { claimId: routeClaimId = "" } = useParams<{ claimId?: string }>();
	const claimId = routeClaimId === "create" ? "" : routeClaimId;

	const guestClaim = useGuestMedicalClaimView(claimId);
	const { isCreateMode } = guestClaim;

	const breadcrumbs = (
		<PageHeader
			headerText={isCreateMode ? "New Medical Reimbursement Claim" : "Medical Reimbursement Form"}
			navigation={{
				variant: "breadcrumbs",
				ariaLabel: "Medical reimbursement form",
				breadcrumbs: [
					{ label: "Medical Reimbursement Forms", href: "/guest/medi-claim/listing" },
					{ label: isCreateMode ? "Create Claim" : "Medical Reimbursement Form" },
				],
				separator: "›",
			}}
		/>
	);

	if (guestClaim.isLoading) {
		return (
			<PageSectionLayout>
				<Card padding="spacious">
					<p role="status">Loading medical reimbursement claim…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (guestClaim.isError || (!isCreateMode && !guestClaim.detail)) {
		return (
			<PageSectionLayout>
				{breadcrumbs}
				<Card padding="spacious">
					<div className="flex flex-col items-start gap-3">
						<p className="text-sm text-rejected" role="alert">
							{guestClaim.errorMessage}
						</p>
						<Button
							type="button"
							text="Retry"
							size="sm"
							appearance="standard"
							variant="outline"
							onClick={() => void guestClaim.refetch()}
						/>
					</div>
				</Card>
			</PageSectionLayout>
		);
	}

	if (isCreateMode && !guestClaim.canCreate) {
		return (
			<PageSectionLayout>
				{breadcrumbs}
				<Card padding="spacious">
					<p className="text-sm text-iron" role="status">
						{MEDICLAIM_BACKEND.guestCreateClaim
							? "Your first medical claim is started by HR — you'll receive an email with a link to the claim form. After that you can raise new claims from here."
							: "New medical claims are started by HR — you'll receive an email with a link to the claim form. Please contact HR to raise a new claim."}
					</p>
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			{breadcrumbs}

			<ReimbursementClaimForm
				referenceNumber={guestClaim.referenceNumber}
				mode={guestClaim.canEdit ? "edit" : "view"}
				canEdit={guestClaim.canEdit}
				actorRole="creator"
				canApprove={false}
				canClarify={false}
				canReviewLineItems={false}
				hideReviewColumns={guestClaim.permissions.hideReviewColumns}
				gradeOptions={guestClaim.gradeOptions}
				onSubmit={guestClaim.canEdit ? guestClaim.submitClaim : undefined}
				submitSuccessMessage={
					isCreateMode
						? "Your new claim has been submitted for approval."
						: "Your claim has been resubmitted for approval."
				}
				initialValues={guestClaim.initialValues}
				initialLineItems={guestClaim.initialLineItems}
				statusLabel={guestClaim.detail?.status}
				correctionReason={guestClaim.correctionReason}
				actionText={isCreateMode ? "Submit Claim" : "Resubmit Claim"}
				statusBanner={guestClaim.statusBanner ?? undefined}
				showAlertBanner={guestClaim.showAlertBanner}
				onBack={() => navigate("/guest/medi-claim/listing")}
			/>
		</PageSectionLayout>
	);
};

export default GuestReimbursementPage;
