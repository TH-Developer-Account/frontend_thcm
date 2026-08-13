import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

const ReimbursementListingPage = () => {
	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical reimbursement listing location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Medical Reimbursement",
						},
					],
					separator: "›",
				}}
			/>
			Hi
		</PageSectionLayout>
	);
};

export default ReimbursementListingPage;
