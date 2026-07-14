import { useCallback, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { VENDOR_FILTER_TABS } from "../utils/vendor.constant";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import { getVendorInitiationColumns } from "../utils/vendorListing.columns";
import { getVendorOnboardingColumns } from "../utils/vendorOnboardingListing.columns";

import type {
	VendorInitiationListingRow,
	VendorOnboardingListingRow,
	VendorListingFilter,
} from "../types/vendorListing.types";

type VendorListingTableProps = {
	selectedFilter: VendorListingFilter;
	onFilterChange: (value: VendorListingFilter) => void;

	search: string;
	onSearchChange: (value: string) => void;

	initiationVendors?: VendorInitiationListingRow[];
	onboardingVendors?: VendorOnboardingListingRow[];

	isLoading?: boolean;
	isFetching?: boolean;

	pageIndex: number;
	pageSize: number;
	pageCount: number;

	onPageChange: (pageIndex: number) => void;
	onPageSizeChange: (pageSize: number) => void;

	onExport: () => void;

	onViewInitiation: (row: VendorInitiationListingRow) => void;
	onViewOnboarding: (row: VendorOnboardingListingRow) => void;
};

const SKELETON_ROW_COUNT = 8;

export default function VendorListingTable({
	selectedFilter,
	onFilterChange,

	search,
	onSearchChange,

	initiationVendors = [],
	onboardingVendors = [],

	isLoading = false,
	isFetching = false,

	pageIndex,
	pageSize,
	pageCount,

	onPageChange,
	onPageSizeChange,

	onExport,

	onViewInitiation,
	onViewOnboarding,
}: VendorListingTableProps) {
	const [selectedInitiationIds, setSelectedInitiationIds] = useState<string[]>(
		[],
	);

	const [selectedOnboardingIds, setSelectedOnboardingIds] = useState<string[]>(
		[],
	);

	const isInitiationTab = selectedFilter === "initiation";

	const initiationVisibleIds = useMemo(
		() => initiationVendors.map((vendor) => vendor.id),
		[initiationVendors],
	);

	const onboardingVisibleIds = useMemo(
		() => onboardingVendors.map((vendor) => vendor.id),
		[onboardingVendors],
	);

	const areAllInitiationsSelected =
		initiationVisibleIds.length > 0 &&
		initiationVisibleIds.every((id) => selectedInitiationIds.includes(id));

	const areAllOnboardingSelected =
		onboardingVisibleIds.length > 0 &&
		onboardingVisibleIds.every((id) => selectedOnboardingIds.includes(id));

	const handleToggleInitiationRow = useCallback((id: string) => {
		setSelectedInitiationIds((currentIds) =>
			currentIds.includes(id)
				? currentIds.filter((selectedId) => selectedId !== id)
				: [...currentIds, id],
		);
	}, []);

	const handleToggleAllInitiations = useCallback(() => {
		setSelectedInitiationIds((currentIds) => {
			const allVisibleRowsSelected =
				initiationVisibleIds.length > 0 &&
				initiationVisibleIds.every((id) => currentIds.includes(id));

			if (allVisibleRowsSelected) {
				return currentIds.filter((id) => !initiationVisibleIds.includes(id));
			}

			return Array.from(new Set([...currentIds, ...initiationVisibleIds]));
		});
	}, [initiationVisibleIds]);

	const handleToggleOnboardingRow = useCallback((id: string) => {
		setSelectedOnboardingIds((currentIds) =>
			currentIds.includes(id)
				? currentIds.filter((selectedId) => selectedId !== id)
				: [...currentIds, id],
		);
	}, []);

	const handleToggleAllOnboarding = useCallback(() => {
		setSelectedOnboardingIds((currentIds) => {
			const allVisibleRowsSelected =
				onboardingVisibleIds.length > 0 &&
				onboardingVisibleIds.every((id) => currentIds.includes(id));

			if (allVisibleRowsSelected) {
				return currentIds.filter((id) => !onboardingVisibleIds.includes(id));
			}

			return Array.from(new Set([...currentIds, ...onboardingVisibleIds]));
		});
	}, [onboardingVisibleIds]);

	const initiationColumns = useMemo(
		() =>
			getVendorInitiationColumns({
				selectedIds: selectedInitiationIds,
				onToggleRow: handleToggleInitiationRow,
				onToggleAll: handleToggleAllInitiations,
				isAllSelected: areAllInitiationsSelected,
				onView: onViewInitiation,
			}),
		[
			selectedInitiationIds,
			handleToggleInitiationRow,
			handleToggleAllInitiations,
			areAllInitiationsSelected,
			onViewInitiation,
		],
	);

	const onboardingColumns = useMemo(
		() =>
			getVendorOnboardingColumns({
				selectedIds: selectedOnboardingIds,
				onToggleRow: handleToggleOnboardingRow,
				onToggleAll: handleToggleAllOnboarding,
				isAllSelected: areAllOnboardingSelected,
				onView: onViewOnboarding,
			}),
		[
			selectedOnboardingIds,
			handleToggleOnboardingRow,
			handleToggleAllOnboarding,
			areAllOnboardingSelected,
			onViewOnboarding,
		],
	);

	const activeColumnCount = isInitiationTab
		? initiationColumns.length
		: onboardingColumns.length;

	return (
		<Card
			className="vendor-listing-card"
			title={
				<FilterTabs
					id="vendor-listing-tabs"
					ariaLabel="Filter vendor listings"
					items={VENDOR_FILTER_TABS}
					value={selectedFilter}
					onChange={onFilterChange}
					className="border-b-none px-0 py-0"
				/>
			}
			secondaryHeader={
				<>
					<SearchInput
						value={search}
						onChange={onSearchChange}
						placeholder={
							isInitiationTab
								? "Search vendor initiation requests"
								: "Search vendor onboarding records"
						}
					/>

					<Button
						type="button"
						text="Export"
						Icon={FileDown}
						iconPosition="left"
						iconSize={16}
						appearance="cta"
						variant="brand"
						size="sm"
						onClick={onExport}
					/>
				</>
			}
		>
			<section
				className="vendor-listing"
				aria-labelledby="vendor-listing-tabs"
				aria-busy={isLoading || isFetching}
			>
				<div className="vendor-listing-table">
					{isLoading ? (
						<DataTableSkeleton
							rows={SKELETON_ROW_COUNT}
							columns={activeColumnCount}
							showPagination
						/>
					) : isInitiationTab ? (
						<DataTable<VendorInitiationListingRow>
							data={initiationVendors}
							columns={initiationColumns}
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							emptyTitle="No vendor initiation requests found"
							emptyDescription="Vendor initiation form entries will appear here."
							scrollTargetId="vendor-initiation-table-scroll"
						/>
					) : (
						<DataTable<VendorOnboardingListingRow>
							data={onboardingVendors}
							columns={onboardingColumns}
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={onPageChange}
							onPageSizeChange={onPageSizeChange}
							emptyTitle="No vendor onboarding records found"
							emptyDescription="Vendor onboarding records will appear here."
							scrollTargetId="vendor-onboarding-table-scroll"
						/>
					)}
				</div>

				{isFetching && !isLoading ? (
					<span className="sr-only" role="status" aria-live="polite">
						Refreshing vendor list
					</span>
				) : null}
			</section>
		</Card>
	);
}
