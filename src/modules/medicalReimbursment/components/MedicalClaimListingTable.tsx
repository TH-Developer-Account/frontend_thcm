import { useMemo } from "react";

import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import type {
	MedicalClaimListingRow,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";
import { MEDICAL_CLAIM_LISTING_FILTER_TABS } from "../utils/medicalClaimListing.constants";
import { getMedicalClaimListingColumns } from "../utils/medicalClaimListing.columns";
import Button from "../../../components/common/Button";
import { FileDown } from "lucide-react";
import {
	MEDICAL_CLAIM_STATUS_OPTIONS,
	type MedicalClaimStatusFilter,
} from "../hooks/useMedicalClaimListing";
import SelectInput from "../../../components/forms/SelectInput";
import type { Option } from "../../../components/forms/input.types";

interface MedicalClaimListingTableProps {
	selectedFilter: MedicalClaimListingTab;
	onFilterChange: (value: MedicalClaimListingTab) => void;
	search: string;
	onSearchChange: (value: string) => void;
	status: MedicalClaimStatusFilter;
	onStatusChange: (value: MedicalClaimStatusFilter) => void;
	rows: MedicalClaimListingRow[];
	isLoading?: boolean;
	isFetching?: boolean;
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

export default function MedicalClaimListingTable({
	selectedFilter,
	onFilterChange,
	search,
	onSearchChange,
	status,
	onStatusChange,
	rows,
	isLoading = false,
	isFetching = false,
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
		() => getMedicalClaimListingColumns({ onView: onViewRow }),
		[onViewRow],
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
				/>
			}
			actions={
				<div className="flex gap-4">
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder="Search by employee, reference, ticket, email or mobile"
					/>

					<SelectInput<Option>
						inputId="medical-claim-status-filter"
						aria-label="Filter by status"
						className="medical-claim-status-select"
						options={MEDICAL_CLAIM_STATUS_OPTIONS}
						value={
							MEDICAL_CLAIM_STATUS_OPTIONS.find(
								(option) => option.value === status,
							) ?? null
						}
						onChange={(option) =>
							onStatusChange((option?.value ?? "") as MedicalClaimStatusFilter)
						}
						isSearchable={false}
					/>
					<Button
						type="button"
						text={isExporting ? "Exporting..." : "Export"}
						Icon={FileDown}
						iconPosition="left"
						iconSize={16}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={onExport}
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
						emptyDescription="There are no medical claims matching this filter and search."
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
