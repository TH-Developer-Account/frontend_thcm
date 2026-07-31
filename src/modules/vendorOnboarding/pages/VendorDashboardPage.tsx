import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import Card from "../../../components/common/Card";

const VendorDashboardPage = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Dashboard"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Dashboard",

					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor/dashboard",
						},
						{
							label: "Vendor Dashboard Page",
						},
					],
					separator: "›",
				}}
			/>
			<Card>
				<div className="grid grid-cols-4 gap-4">
					<Card>Initiate Vendor</Card>
					<Card>Initiate Vendor</Card>
					<Card>Initiate Vendor</Card>
					<Card>Initiate Vendor</Card>
					<Card>Initiate Vendor</Card>
				</div>
			</Card>
		</PageSectionLayout>
	);
};

export default VendorDashboardPage;
