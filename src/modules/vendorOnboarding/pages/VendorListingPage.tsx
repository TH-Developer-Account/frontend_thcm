import Card from "../../../components/common/Card";
import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

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
						{
							label: "Form View",
						},
					],
					separator: "›",
				}}
			/>
			<Card>Hello</Card>
		</PageSectionLayout>
	);
};

export default VendorListingPage;
