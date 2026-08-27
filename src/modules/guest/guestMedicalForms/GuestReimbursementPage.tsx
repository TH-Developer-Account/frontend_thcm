import { useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import ReimbursementClaimForm from "../../medicalReimbursment/components/ReimbursementClaimForm";

import { useGuestMedicalClaimView } from "./useGuestReimbursementClaimAccess";

const GuestReimbursementPage = () => {
	const navigate = useNavigate();
	const { claimId: routeClaimId = "" } = useParams<{ claimId?: string }>();
	const claimId = routeClaimId === "create" ? "" : routeClaimId;

	const guestClaim = useGuestMedicalClaimView(claimId);
	const isCreateMode = guestClaim.isCreateMode;

	if (guestClaim.isLoading) {
		return (
			<PageSectionLayout>
				<Card padding="spacious">
					<p role="status">Loading medical reimbursement claim…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (!isCreateMode && (guestClaim.isError || !guestClaim.detail)) {
		return (
			<PageSectionLayout>
				<Card padding="spacious">
					<p className="text-sm text-rejected" role="alert">
						Unable to load this medical reimbursement claim.
					</p>
				</Card>
			</PageSectionLayout>
		);
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical reimbursement form",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Medical Reimbursement Forms",
							href: "/guest/medi-claim/listing",
						},
						{
							label: isCreateMode
								? "Create Claim"
								: "Medical Reimbursement Form",
						},
					],
					separator: "›",
				}}
			/>

			<ReimbursementClaimForm
				referenceNumber={guestClaim.referenceNumber}
				mode={guestClaim.canEdit ? "edit" : "view"}
				onSubmit={guestClaim.canEdit ? guestClaim.submitClaim : undefined}
				initialValues={guestClaim.initialValues}
				initialLineItems={guestClaim.initialLineItems}
				canEdit={guestClaim.canEdit}
				statusLabel={guestClaim.detail?.status}
				actionText={isCreateMode ? "Submit Claim" : "Resubmit Claim"}
				onBack={() => navigate(-1)}
			/>
		</PageSectionLayout>
	);
};

export default GuestReimbursementPage;
