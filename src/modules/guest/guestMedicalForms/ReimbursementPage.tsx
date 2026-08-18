import { Navigate, useLocation, useParams } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { useReimbursementClaimDetailQuery } from "./useReimbursementClaimQueries";
import ReimbursementClaimForm from "../../medicalReimbursment/components/ReimbursementClaimForm";

const ReimbursementPage = () => {
	const { pathname } = useLocation();
	const { claimId } = useParams<{ claimId?: string }>();
	const isViewRoute = pathname.endsWith("/view");
	const isCreateRoute = pathname.endsWith("/create");
	const claimQuery = useReimbursementClaimDetailQuery(
		claimId ?? "",
		!isCreateRoute,
	);

	if (!isCreateRoute && !claimId) {
		return <Navigate to="/medi-claim/listing" replace />;
	}

	if (!isCreateRoute && claimQuery.isLoading) {
		return <div role="status">Loading medical reimbursement claim...</div>;
	}

	if (!isCreateRoute && (claimQuery.isError || !claimQuery.data)) {
		return <div role="alert">Unable to load medical reimbursement claim.</div>;
	}

	const canEdit =
		isCreateRoute ||
		claimQuery.data?.status === "DRAFT" ||
		claimQuery.data?.status === "CLARIFICATION_REQUESTED";

	if (!isViewRoute && !canEdit && claimId) {
		return <Navigate to={`/medi-claim/${claimId}/view`} replace />;
	}

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Form"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical Reimbursement Form",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{
							label: "Medical Reimbursement Forms",
							href: "/medi-claim/listing",
						},
						{ label: "Medical Reimbursement Form" },
					],
					separator: "›",
				}}
			/>

			<ReimbursementClaimForm
				mode={!isViewRoute && isCreateRoute ? "edit" : "view"}
				// claim={claimQuery.data}
			/>
		</PageSectionLayout>
	);
};

export default ReimbursementPage;
