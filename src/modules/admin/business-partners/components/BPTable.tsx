import React from "react";
import type {
	OnChangeFn,
	PaginationState,
	SortingState,
} from "@tanstack/react-table";

import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import type { BusinessPartner } from "../utils/bp.types";
import { getBusinessPartnerColumns } from "../utils/businessPartner.columns";

type BPTableProps = {
	partners: BusinessPartner[];

	pagination: PaginationState;
	pageCount: number;
	onPaginationChange: OnChangeFn<PaginationState>;

	onView: (partner: BusinessPartner) => void;

	isLoading?: boolean;
	isFetching?: boolean;
	isError?: boolean;
};

const BPTable = ({
	partners,
	pagination,
	pageCount,
	onPaginationChange,
	onView,
	isLoading = false,
	isFetching = false,
	isError = false,
}: BPTableProps) => {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const columns = React.useMemo(
		() => getBusinessPartnerColumns(onView),
		[onView],
	);

	const tableData = React.useMemo(
		() => (Array.isArray(partners) ? partners : []),
		[partners],
	);

	const updatePagination = React.useCallback(
		(updater: React.SetStateAction<PaginationState>) => {
			onPaginationChange(updater);
		},
		[onPaginationChange],
	);

	const handlePageChange = React.useCallback(
		(pageIndex: number) => {
			updatePagination((current) => ({
				...current,
				pageIndex,
			}));
		},
		[updatePagination],
	);

	const handlePageSizeChange = React.useCallback(
		(pageSize: number) => {
			updatePagination({
				pageIndex: 0,
				pageSize,
			});
		},
		[updatePagination],
	);

	if (isError) {
		return (
			<div role="alert" className="alert-card">
				<h2 className="alert-title">Unable to load business partners</h2>

				<p className="alert-description">
					The business partner listing could not be retrieved. Refresh the page
					or try again.
				</p>
			</div>
		);
	}

	return (
		<section
			aria-label="Business partner records"
			aria-busy={isLoading || isFetching}
		>
			<DataTable<BusinessPartner>
				data={tableData}
				columns={columns}
				loading={isLoading}
				enableSorting
				manualSorting={false}
				sorting={sorting}
				onSortingChange={setSorting}
				enablePagination
				manualPagination
				pageIndex={pagination.pageIndex}
				pageSize={pagination.pageSize}
				pageCount={pageCount}
				onPageChange={handlePageChange}
				onPageSizeChange={handlePageSizeChange}
				scrollTargetId="business-partner-table-scroll"
				emptyTitle="No business partners found"
				emptyDescription="Try adjusting the current search term."
			/>

			{isFetching && !isLoading ? (
				<span className="sr-only" role="status" aria-live="polite">
					Refreshing business partners
				</span>
			) : null}
		</section>
	);
};

export default BPTable;
