import { useLocation } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import PageSectionLayout from "../../layout/PageSectionLayout";
import ReimbursementClaimForm from "./ReimbursementClaimForm";
import ReimbursementClaimView from "./ReimbursementClaimView";

const ReimbursementPage = () => {
	const { pathname } = useLocation();

	const isViewRoute = pathname.endsWith("/view");

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical Reimbursement Form",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Medical Reimbursement Forms",
							href: "/medical-claim/form/create",
						},
						{
							label: "Medical Reimbursement Form",
						},
					],
					separator: "›",
				}}
			/>

			{isViewRoute ? <ReimbursementClaimView /> : <ReimbursementClaimForm />}
		</PageSectionLayout>
	);
};

export default ReimbursementPage;
