import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import ReimbursementClaimListingTable from "./ReimbursementClaimListingTable";
import { useReimbursementClaimListing } from "./useReimbursementClaimListing";

import type { ReimbursementClaimListItem } from "./reimbursementClaim.types";

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
			const editable = ["DRAFT", "CLARIFICATION_REQUESTED"].includes(
				row.status,
			);

			navigate(`/guest/medi-claim/${row.id}/${editable ? "edit" : "view"}`);
		},
		[navigate],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Forms"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical reimbursement forms",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Medical Reimbursement Forms",
						},
					],
					separator: "›",
				}}
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
