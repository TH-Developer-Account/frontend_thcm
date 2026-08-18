import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorOnboardingInitiationForm, {
	type VendorInitiationFormMode,
} from "../forms/VendorOnboardingInitiationForm";

type VendorInitiationPageProps = {
	mode?: VendorInitiationFormMode;
};

const VendorInitiationPage = ({ mode }: VendorInitiationPageProps) => {
	const navigate = useNavigate();
	const { initiationId } = useParams<{ initiationId: string }>();

	const isViewMode = mode === "view";

	const handleBackToListing = () => {
		navigate("/vendor/initiation/listing?tab=initiation");
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={
					isViewMode ? "Vendor Initiation Details" : "Vendor Initiation Form"
				}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: isViewMode
						? "Vendor Initiation Details"
						: "Vendor Initiation Form",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor/initiation/listing?tab=initiation",
						},
						{
							label: isViewMode
								? "Vendor Initiation Details"
								: "Vendor Initiation Form",
						},
					],
					separator: "›",
				}}
			/>

			<VendorOnboardingInitiationForm
				initiationId={initiationId}
				mode={mode}
				onCancel={handleBackToListing}
				onSuccess={handleBackToListing}
				onBack={handleBackToListing}
			/>
		</PageSectionLayout>
	);
};

export default VendorInitiationPage;
