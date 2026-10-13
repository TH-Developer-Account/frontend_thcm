import { useMemo } from "react";
import { FileDown } from "lucide-react";

import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import { SearchInput } from "../../../components/forms/SearchInput";
import SelectInput from "../../../components/forms/SelectInput";
import type { Option } from "../../../components/forms/input.types";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import type {
	MedicalClaimListingRow,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";
import {
	MEDICAL_CLAIM_LISTING_FILTER_TABS,
	type MedicalClaimStatusFilter,
	type MedicalClaimStatusOption,
} from "../utils/medicalClaimListing.constants";
import { getMedicalClaimListingColumns } from "../utils/medicalClaimListing.columns";

interface MedicalClaimListingTableProps {
	selectedFilter: MedicalClaimListingTab;
	onFilterChange: (value: MedicalClaimListingTab) => void;
	search: string;
	onSearchChange: (value: string) => void;
	status: MedicalClaimStatusFilter;
	statusOptions: MedicalClaimStatusOption[];
	onStatusChange: (value: MedicalClaimStatusFilter) => void;
	rows: MedicalClaimListingRow[];
	totalCount: number;
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
	onViewRow: (row: MedicalClaimListingRow) => void;
	onExport: () => void;
	isExporting?: boolean;
}

const SKELETON_ROW_COUNT = 8;

const SEARCH_PLACEHOLDER: Record<MedicalClaimListingTab, string> = {
	initiation: "Search by employee, ticket, email or mobile",
	claims: "Search by employee, reference or ticket number",
	pendingOnMe: "Search by employee, reference or ticket number",
	approvedByMe: "Search by employee, reference or ticket number",
};

export default function MedicalClaimListingTable({
	selectedFilter,
	onFilterChange,
	search,
	onSearchChange,
	status,
	statusOptions,
	onStatusChange,
	rows,
	totalCount,
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
	onExport,
	isExporting,
}: MedicalClaimListingTableProps) {
	const columns = useMemo(
		() =>
			getMedicalClaimListingColumns({ onView: onViewRow, tab: selectedFilter }),
		[onViewRow, selectedFilter],
	);

	return (
		<Card
			className="medical-claim-listing-card"
			title={
				<FilterTabs
					id="medical-claim-listing-filter-tabs"
					ariaLabel="Filter medical claim listings"
					items={MEDICAL_CLAIM_LISTING_FILTER_TABS}
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
						placeholder={SEARCH_PLACEHOLDER[selectedFilter]}
					/>

					{statusOptions.length > 1 ? (
						<SelectInput<Option>
							inputId="medical-claim-status-filter"
							aria-label="Filter by status"
							className="medical-claim-status-select"
							options={statusOptions}
							value={
								statusOptions.find((option) => option.value === status) ?? null
							}
							onChange={(option) =>
								onStatusChange(
									(option?.value ?? "all") as MedicalClaimStatusFilter,
								)
							}
							isSearchable={false}
						/>
					) : null}
					<Button
						type="button"
						text={isExporting ? "Preparing export..." : "Export"}
						Icon={FileDown}
						iconPosition="left"
						iconSize={16}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={onExport}
						disabled={isExporting || totalCount === 0}
					/>
				</div>
			}
		>
			<section
				aria-labelledby="medical-claim-listing-filter-tabs"
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
							{errorMessage ?? "Unable to load medical claims."}
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
					<DataTable<MedicalClaimListingRow>
						data={rows}
						columns={columns}
						loading={false}
						manualPagination
						pageIndex={pageIndex}
						pageSize={pageSize}
						pageCount={pageCount}
						onPageChange={onPageChange}
						onPageSizeChange={onPageSizeChange}
						scrollTargetId={`medical-claim-${selectedFilter}-table-scroll`}
						emptyTitle="No medical claims found"
						emptyDescription={
							search || status !== "all"
								? "No medical claims match this search or status."
								: "There are no medical claims in this tab yet."
						}
					/>
				)}

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing medical claims
					</span>
				) : null}
			</section>
		</Card>
	);
}
