import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import Button from "../../../components/common/Button";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

import ReimbursementClaimListingTable from "./ReimbursementClaimListingTable";
import { useReimbursementClaimListing } from "./useReimbursementClaimListing";
import { useGuestClaimProfileQuery } from "./useReimbursementClaimQueries";
import type { ReimbursementClaimListItem } from "./reimbursementClaim.types";

const ReimbursementClaimListingPage = () => {
	const navigate = useNavigate();
	const listing = useReimbursementClaimListing({ initialTab: "createdByMe" });
	const profileQuery = useGuestClaimProfileQuery();

	const handleViewRow = useCallback(
		(row: ReimbursementClaimListItem) => navigate(`/guest/medi-claim/${row.id}`),
		[navigate],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Forms"
				headerChildren={
					profileQuery.data?.canCreate ? (
						<Button
							text="Create New"
							appearance="standard"
							variant="brand"
							Icon={Plus}
							onClick={() => navigate("/guest/medi-claim/create")}
						/>
					) : undefined
				}
			/>

			<ReimbursementClaimListingTable
				selectedFilter={listing.tab}
				onFilterChange={listing.handleTabChange}
				search={listing.search}
				onSearchChange={listing.handleSearchChange}
				rows={listing.rows}
				isLoading={listing.isLoading}
				isFetching={listing.isFetching}
				isError={listing.isError}
				errorMessage={getApiErrorMessage(listing.error, "Unable to load your claims.")}
				onRetry={() => void listing.refetch()}
				pageIndex={listing.pageIndex}
				pageSize={listing.pageSize}
				pageCount={listing.pageCount}
				onPageChange={listing.setPageIndex}
				onPageSizeChange={listing.handlePageSizeChange}
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default ReimbursementClaimListingPage;
