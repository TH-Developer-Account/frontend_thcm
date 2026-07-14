import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorListingTable from "../components/VendorListingTable";

const VendorListingPage = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendors Listing"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendors listing location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor/listing",
						},
					],
					separator: "›",
				}}
			/>

			<VendorListingTable />
		</PageSectionLayout>
	);
};

export default VendorListingPage;
