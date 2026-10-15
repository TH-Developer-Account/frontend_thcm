import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import MedicalClaimInitiationForm from "../components/MedicalClaimInitiationForm";
import type { MedicalClaimInitiationFormMode } from "../types/medicalClaimInitiation.types";

type MedicalClaimInitiationPageProps = {
	mode?: MedicalClaimInitiationFormMode;
};

const MedicalClaimInitiationPage = ({ mode }: MedicalClaimInitiationPageProps) => {
	const navigate = useNavigate();
	const { initiationId, claimId } = useParams<{ initiationId?: string; claimId?: string }>();
	const resolvedId = initiationId ?? claimId;

	const isViewMode = mode === "view";
	const pageTitle = isViewMode
		? "Medical Claim Initiation Details"
		: "Medical Claim Initiation Form";
	const listingHref = isViewMode
		? "/medi-claim/listing?tab=initiation"
		: "/medi-claim/listing?tab=claims";

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={pageTitle}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: pageTitle,
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Medical Reimbursement Claims", href: listingHref },
						{ label: pageTitle },
					],
					separator: "›",
				}}
			/>

			{/* Single initiation navigates to the "Awaiting employee" tab on
			    success (inside the hook); bulk import stays on this page so
			    the import result can be read. */}
			<MedicalClaimInitiationForm
				claimId={resolvedId}
				mode={mode}
				onCancel={() => navigate(listingHref)}
				onBack={() => navigate(listingHref)}
			/>
		</PageSectionLayout>
	);
};

export default MedicalClaimInitiationPage;
