import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import { vendorContent } from "../utils/vendor.content";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorOnboardingInitiationForm, {
	type VendorInitiationFormMode,
} from "../forms/VendorOnboardingInitiationForm";
import VendorInitiationSidePanel from "../forms/VendorInitiationSidePanel";

// Copy lives in content/vendor.content.en.json -> pages.initiation.*, pages.breadcrumbs.*
const { breadcrumbs } = vendorContent.pages;
const pageContent = vendorContent.pages.initiation;

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

	const pageTitle = isViewMode ? pageContent.viewTitle : pageContent.formTitle;

	const handleBackToListing = () => {
		navigate("/vendor-onboarding/listing?tab=onboarding");
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={pageTitle}
				subtitleText={pageContent.subtitle}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: pageTitle,
					breadcrumbs: [
						{
							label: breadcrumbs.home,
							href: "/",
						},
						{
							label: breadcrumbs.vendorsListing,
							href: "/vendor-onboarding/listing?tab=onboarding",
						},
						{
							label: pageTitle,
						},
					],
					separator: vendorContent.common.breadcrumbSeparator,
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
