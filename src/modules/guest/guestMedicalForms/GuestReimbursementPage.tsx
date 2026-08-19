import { Navigate, useNavigate, useParams } from "react-router-dom";

import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import ReimbursementClaimForm from "../../medicalReimbursment/components/ReimbursementClaimForm";

import { useGuestMedicalClaimView } from "./useGuestReimbursementClaimAccess";

type GuestReimbursementPageProps = {
	mode?: "view" | "edit";
};

const GuestReimbursementPage = ({
	mode = "edit",
}: GuestReimbursementPageProps) => {
	const navigate = useNavigate();

	const { claimId = "" } = useParams<{
		claimId: string;
	}>();

	const guestClaim = useGuestMedicalClaimView(claimId);

	if (!claimId) {
		return <Navigate to="/guest/medi-claim/listing" replace />;
	}

	if (guestClaim.isLoading) {
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
								label: "Medical Reimbursement Form",
							},
						],
						separator: "›",
					}}
				/>

				<Card padding="spacious">
					<p role="status">Loading medical reimbursement claim…</p>
				</Card>
			</PageSectionLayout>
		);
	}

	if (guestClaim.isError || !guestClaim.detail) {
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

	const claim = guestClaim.detail;

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
							label: "Medical Reimbursement Form",
						},
					],
					separator: "›",
				}}
			/>

			<ReimbursementClaimForm
				mode={mode}
				onSubmit={guestClaim.canEdit ? guestClaim.resubmitClaim : undefined}
				initialValues={guestClaim.initialValues}
				initialLineItems={guestClaim.initialLineItems}
				canEdit={guestClaim.canEdit}
				statusLabel={claim.status}
				actionText="Resubmit Claim"
				onBack={() => navigate(-1)}
			/>
		</PageSectionLayout>
	);
};

export default GuestReimbursementPage;
