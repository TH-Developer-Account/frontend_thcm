import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import MedicalClaimInitiationForm from "../components/MedicalClaimInitiationForm";
import type { MedicalClaimInitiationFormMode } from "../types/medicalClaimInitiation.types";

type MedicalClaimInitiationPageProps = {
	mode?: MedicalClaimInitiationFormMode;
};

const MedicalClaimInitiationPage = ({
	mode,
}: MedicalClaimInitiationPageProps) => {
	const navigate = useNavigate();
	const { claimId } = useParams<{ claimId: string }>();

	const isViewMode = mode === "view";

	const pageTitle = isViewMode
		? "Medical Claim Initiation Details"
		: "Medical Claim Initiation Form";

	const handleBackToListing = () => {
		navigate("/medi-claim/listing?tab=claims");
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={pageTitle}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: pageTitle,
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Medical Reimbursement Claims",
							href: "/medi-claim/listing?tab=claims",
						},
						{
							label: pageTitle,
						},
					],
					separator: "›",
				}}
			/>

			<MedicalClaimInitiationForm
				claimId={claimId}
				mode={mode}
				onCancel={handleBackToListing}
				onSuccess={handleBackToListing}
				onBack={handleBackToListing}
			/>
		</PageSectionLayout>
	);
};

export default MedicalClaimInitiationPage;
