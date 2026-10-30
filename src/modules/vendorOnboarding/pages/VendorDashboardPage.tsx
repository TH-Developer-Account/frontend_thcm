import { PageHeader } from "../../../components/ui/PageHeader";
import { vendorContent } from "../utils/vendor.content";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorDashboard from "../components/VendorDashboard";

// Copy lives in content/vendor.content.en.json -> pages.dashboard.*, pages.breadcrumbs.*
const { breadcrumbs } = vendorContent.pages;
const pageContent = vendorContent.pages.dashboard;

const VendorDashboardPage = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText={pageContent.title}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: pageContent.ariaLabel,
					breadcrumbs: [
						{ label: breadcrumbs.home, href: "/" },
						{
							label: breadcrumbs.vendors,
							href: "/vendor-onboarding/dashboard",
						},
						{ label: breadcrumbs.dashboard },
					],
					separator: vendorContent.common.breadcrumbSeparator,
				}}
			/>

			<VendorDashboard />
		</PageSectionLayout>
	);
};

export default VendorDashboardPage;
