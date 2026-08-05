import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorDashboard from "../components/VendorDashboard";

const VendorDashboardPage = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Dashboard"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor dashboard breadcrumb",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Vendors", href: "/vendor/dashboard" },
						{ label: "Dashboard" },
					],
					separator: "›",
				}}
			/>

			<VendorDashboard />
		</PageSectionLayout>
	);
};

export default VendorDashboardPage;
