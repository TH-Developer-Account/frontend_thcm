import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorOnboardingInitiationForm, {
	type VendorInitiationFormMode,
} from "../forms/VendorOnboardingInitiationForm";
import VendorInitiationSidePanel from "../forms/VendorInitiationSidePanel";

type VendorInitiationPageProps = {
	mode?: VendorInitiationFormMode;
};

const VendorInitiationPage = ({ mode }: VendorInitiationPageProps) => {
	const navigate = useNavigate();
	const { initiationId } = useParams<{ initiationId: string }>();

	const isViewMode = mode === "view";

	// Same resolution the form uses, so the panel only shows when creating.
	const resolvedMode: VendorInitiationFormMode =
		mode ?? (initiationId ? "edit" : "create");
	const showNextSteps = resolvedMode === "create";

	const handleBackToListing = () => {
		navigate("/vendor-onboarding/listing?tab=onboarding");
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={
					isViewMode ? "Vendor Initiation Details" : "Vendor Initiation Form"
				}
				subtitleText="Enter the basics below. We send the vendor a secure link to complete their onboarding details."
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
							href: "/vendor-onboarding/listing?tab=onboarding",
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

			<div
				className={
					showNextSteps
						? "vendor-initiation-layout vendor-initiation-layout-with-aside"
						: "vendor-initiation-layout"
				}
			>
				<VendorOnboardingInitiationForm
					initiationId={initiationId}
					mode={mode}
					onCancel={handleBackToListing}
					onSuccess={handleBackToListing}
					onBack={handleBackToListing}
				/>

				{showNextSteps ? <VendorInitiationSidePanel /> : null}
			</div>
		</PageSectionLayout>
	);
};

export default VendorInitiationPage;
