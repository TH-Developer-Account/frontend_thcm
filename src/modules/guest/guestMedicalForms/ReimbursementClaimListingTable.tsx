import { useMemo } from "react";

import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import type {
	ReimbursementClaimListItem,
	ReimbursementListingTab,
} from "./reimbursementClaim.types";
import { getReimbursementClaimListingColumns } from "./reimbursementClaimListing.columns";

interface ReimbursementClaimListingTableProps {
	selectedFilter: ReimbursementListingTab;
	onFilterChange: (value: ReimbursementListingTab) => void;

	search: string;
	onSearchChange: (value: string) => void;

	rows: ReimbursementClaimListItem[];

	isLoading?: boolean;
	isFetching?: boolean;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;

	onViewRow: (row: ReimbursementClaimListItem) => void;
}

const SKELETON_ROW_COUNT = 8;

const ReimbursementClaimListingTable = ({
	selectedFilter,
	search,
	onSearchChange,
	rows,
	isLoading = false,
	isFetching = false,
	pageIndex,
	pageSize,
	pageCount,
	onPageChange,
	onPageSizeChange,
	onViewRow,
}: ReimbursementClaimListingTableProps) => {
	const columns = useMemo(
		() => getReimbursementClaimListingColumns({ onView: onViewRow }),
		[onViewRow],
	);

	return (
		<Card
			className="reimbursement-claim-listing-card"
			title={
				<>
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder="Search by claim number, employee or ticket"
					/>
				</>
			}
		>
			<section
				aria-labelledby="reimbursement-claim-listing-filter-tabs"
				aria-busy={isLoading || isFetching}
			>
				{isLoading ? (
					<DataTableSkeleton
						rows={SKELETON_ROW_COUNT}
						columns={11}
						showPagination
					/>
				) : (
					<DataTable<ReimbursementClaimListItem>
						data={rows}
						columns={columns}
						loading={false}
						manualPagination
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						scrollTargetId={`reimbursement-claim-${selectedFilter}-table-scroll`}
						emptyTitle="No reimbursement claims found"
						emptyDescription="There are no reimbursement claims matching this filter and search."
					/>
				)}

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing reimbursement claims
					</span>
				) : null}
			</section>
		</Card>
	);
};

export default ReimbursementClaimListingTable;
