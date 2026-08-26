import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import ReimbursementClaimListingTable from "./ReimbursementClaimListingTable";
import { useReimbursementClaimListing } from "./useReimbursementClaimListing";

import type { ReimbursementClaimListItem } from "./reimbursementClaim.types";
import Button from "../../../components/common/Button";
import { Plus } from "lucide-react";

const ReimbursementClaimListingPage = () => {
	const navigate = useNavigate();

	const {
		tab,
		search,
		pageIndex,
		pageSize,
		pageCount,
		rows,
		isLoading,
		isFetching,
		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		setPageIndex,
	} = useReimbursementClaimListing({
		initialTab: "createdByMe",
	});

	const rowsForTable = useMemo(() => rows, [rows]);

	const handleViewRow = useCallback(
		(row: ReimbursementClaimListItem) => {
			navigate(`/guest/medi-claim/${row.id}`);
		},
		[navigate],
	);
	const handleCreateNew = () => {
		navigate(`/guest/medi-claim/create`);
	};

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Forms"
				headerChildren={
					<Button
						text="Create New"
						appearance="standard"
						variant="brand"
						Icon={Plus}
						onClick={handleCreateNew}
					/>
				}
			/>

			<ReimbursementClaimListingTable
				selectedFilter={tab}
				onFilterChange={handleTabChange}
				search={search}
				onSearchChange={handleSearchChange}
				rows={rowsForTable}
				isLoading={isLoading}
				isFetching={isFetching}
				pageIndex={pageIndex}
				pageSize={pageSize}
				pageCount={pageCount}
				onPageChange={setPageIndex}
				onPageSizeChange={handlePageSizeChange}
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default ReimbursementClaimListingPage;
