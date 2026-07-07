import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorOnboardingInitiationForm from "../forms/VendorOnboardingInitiationForm";

const VendorInitiationPage = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Initiation Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor Initiation Form",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor/listing",
						},
						{
							label: "Vendor Onboarding Form",
						},
					],
					separator: "›",
				}}
			/>

			<VendorOnboardingInitiationForm />
		</PageSectionLayout>
	);
};

export default VendorInitiationPage;
