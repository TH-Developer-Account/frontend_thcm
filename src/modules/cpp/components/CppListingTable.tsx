import { useMemo } from "react";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput from "../../../components/forms/SelectInput";
import type { Option } from "../../../components/forms/input.types";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import type {
	CppListingRow,
	CppListingTab,
	CppStatusFilter,
} from "../types/cpp.types";
import {
	CPP_LISTING_FILTER_TABS,
	type CppStatusOption,
} from "../utils/cpp.constants";
import { getCppListingColumns } from "../utils/cpp.columns";

interface CppListingTableProps {
	selectedFilter: CppListingTab;
	onFilterChange: (value: CppListingTab) => void;
	search: string;
	onSearchChange: (value: string) => void;
	status: CppStatusFilter;
	statusOptions: CppStatusOption[];
	onStatusChange: (value: CppStatusFilter) => void;
	rows: CppListingRow[];
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
	onViewRow: (row: CppListingRow) => void;
}

const SKELETON_ROW_COUNT = 8;

// The server searches reference number, recommended supplier name and code.
const SEARCH_PLACEHOLDER = "Search by reference number or supplier";

export default function CppListingTable({
	selectedFilter,
	onFilterChange,
	search,
	onSearchChange,
	status,
	statusOptions,
	onStatusChange,
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
}: CppListingTableProps) {
	const columns = useMemo(
		() => getCppListingColumns({ onView: onViewRow, tab: selectedFilter }),
		[onViewRow, selectedFilter],
	);

	return (
		<Card
			className="cpp-listing-card"
			title={
				<FilterTabs
					id="cpp-listing-filter-tabs"
					ariaLabel="Filter CPP requests"
					items={CPP_LISTING_FILTER_TABS}
					value={selectedFilter}
					onChange={onFilterChange}
					className="border-b-none px-0 py-0"
					variant="underline"
				/>
			}
			actions={
				<div className="flex flex-row gap-4">
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder={SEARCH_PLACEHOLDER}
					/>

					{statusOptions.length > 1 ? (
						<SelectInput<Option>
							inputId="cpp-status-filter"
							aria-label="Filter by status"
							className="medical-claim-status-select"
							options={statusOptions}
							value={
								statusOptions.find((option) => option.value === status) ?? null
							}
							onChange={(option) =>
								onStatusChange((option?.value ?? "all") as CppStatusFilter)
							}
							isSearchable={false}
						/>
					) : null}
				</div>
			}
		>
			<section
				aria-labelledby="cpp-listing-filter-tabs"
				aria-busy={isLoading || isFetching}
			>
				{isLoading ? (
					<DataTableSkeleton
						rows={SKELETON_ROW_COUNT}
						columns={columns.length}
						showPagination
					/>
				) : isError ? (
					<div className="flex flex-col items-start gap-3 p-4" role="alert">
						<p className="text-sm text-rejected">
							{errorMessage ?? "Unable to load CPP requests."}
						</p>
						{onRetry ? (
							<Button
								type="button"
								text="Retry"
								size="sm"
								appearance="standard"
								variant="outline"
								onClick={onRetry}
							/>
						) : null}
					</div>
				) : (
					<DataTable<CppListingRow>
						data={rows}
						columns={columns}
						loading={false}
						manualPagination
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						scrollTargetId={`cpp-${selectedFilter}-table-scroll`}
						emptyTitle="No CPP requests found"
						emptyDescription={
							search || status !== "all"
								? "No CPP requests match this search or status."
								: selectedFilter === "drafts"
									? "You have no saved drafts."
									: "You have not created any CPP requests yet."
						}
					/>
				)}

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing CPP requests
					</span>
				) : null}
			</section>
		</Card>
	);
}
