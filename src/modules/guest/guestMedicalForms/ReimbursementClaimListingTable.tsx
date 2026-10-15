import { useMemo } from "react";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
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
	isError?: boolean;
	errorMessage?: string;
	onRetry?: () => void;
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
	isError = false,
	errorMessage,
	onRetry,
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
				<SearchInput
					value={search}
					onChange={onSearchChange}
					placeholder="Search by claim number, employee or ticket"
				/>
			}
		>
			<section aria-label="Your medical claims" aria-busy={isLoading || isFetching}>
				{isLoading ? (
					<DataTableSkeleton rows={SKELETON_ROW_COUNT} columns={columns.length} showPagination />
				) : isError ? (
					<div className="flex flex-col items-start gap-3 p-4" role="alert">
						<p className="text-sm text-rejected">{errorMessage ?? "Unable to load your claims."}</p>
						{onRetry ? (
							<Button type="button" text="Retry" size="sm" appearance="standard" variant="outline" onClick={onRetry} />
						) : null}
					</div>
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
						emptyDescription={
							search
								? "No claims match this search."
								: "Claims you submit will appear here."
						}
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
