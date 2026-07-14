import { useCallback, useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import type {
	VendorInitiationListingRow,
	VendorListingFilter,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";
import {
	DUMMY_INITIATION_ROWS,
	DUMMY_ONBOARDING_ROWS,
	VENDOR_FILTER_TABS,
} from "../utils/vendor.constant";
import { getVendorInitiationColumns } from "../utils/vendorListing.columns";
import { getVendorOnboardingColumns } from "../utils/vendorOnboardingListing.columns";

type VendorListingTableProps = {
	isLoading?: boolean;
	isFetching?: boolean;
};

const DEFAULT_PAGE_SIZE = 10;
const SKELETON_ROW_COUNT = 8;

const getListingFilterFromTab = (tab: string | null): VendorListingFilter => {
	return tab === "onboarding" ? "onboarding" : "initiation";
};

const VendorListingTable = ({
	isLoading = false,
	isFetching = false,
}: VendorListingTableProps) => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();

	const selectedFilter = getListingFilterFromTab(searchParams.get("tab"));

	const [search, setSearch] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

	const [selectedInitiationIds, setSelectedInitiationIds] = useState<string[]>(
		[],
	);

	const [selectedOnboardingIds, setSelectedOnboardingIds] = useState<string[]>(
		[],
	);

	const isInitiationTab = selectedFilter === "initiation";
	const normalizedSearch = search.trim().toLowerCase();

	const filteredInitiationVendors = useMemo(() => {
		if (!normalizedSearch) {
			return DUMMY_INITIATION_ROWS;
		}

		return DUMMY_INITIATION_ROWS.filter((vendor) => {
			return (
				vendor.vendorName.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorEmail.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorPhone.toLowerCase().includes(normalizedSearch) ||
				vendor.createdBy?.toLowerCase().includes(normalizedSearch) ||
				vendor.status?.toLowerCase().includes(normalizedSearch)
			);
		});
	}, [normalizedSearch]);

	const filteredOnboardingVendors = useMemo(() => {
		if (!normalizedSearch) {
			return DUMMY_ONBOARDING_ROWS;
		}

		return DUMMY_ONBOARDING_ROWS.filter((vendor) => {
			return (
				vendor.vendorName.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorCode?.toLowerCase().includes(normalizedSearch) ||
				vendor.vendorType?.toLowerCase().includes(normalizedSearch) ||
				vendor.companyCode?.toLowerCase().includes(normalizedSearch) ||
				vendor.region?.toLowerCase().includes(normalizedSearch) ||
				vendor.createdBy?.toLowerCase().includes(normalizedSearch) ||
				vendor.status?.toLowerCase().includes(normalizedSearch)
			);
		});
	}, [normalizedSearch]);

	const activeFilteredRows = isInitiationTab
		? filteredInitiationVendors
		: filteredOnboardingVendors;

	const pageCount = Math.max(
		1,
		Math.ceil(activeFilteredRows.length / pageSize),
	);

	const safePageIndex = Math.min(pageIndex, Math.max(0, pageCount - 1));

	const paginatedInitiationVendors = useMemo(() => {
		if (!isInitiationTab) {
			return [];
		}

		const startIndex = safePageIndex * pageSize;
		const endIndex = startIndex + pageSize;

		return filteredInitiationVendors.slice(startIndex, endIndex);
	}, [filteredInitiationVendors, isInitiationTab, pageSize, safePageIndex]);

	const paginatedOnboardingVendors = useMemo(() => {
		if (isInitiationTab) {
			return [];
		}

		const startIndex = safePageIndex * pageSize;
		const endIndex = startIndex + pageSize;

		return filteredOnboardingVendors.slice(startIndex, endIndex);
	}, [filteredOnboardingVendors, isInitiationTab, pageSize, safePageIndex]);

	const initiationVisibleIds = useMemo(
		() => paginatedInitiationVendors.map((vendor) => vendor.id),
		[paginatedInitiationVendors],
	);

	const onboardingVisibleIds = useMemo(
		() => paginatedOnboardingVendors.map((vendor) => vendor.id),
		[paginatedOnboardingVendors],
	);

	const areAllInitiationsSelected =
		initiationVisibleIds.length > 0 &&
		initiationVisibleIds.every((id) => selectedInitiationIds.includes(id));

	const areAllOnboardingSelected =
		onboardingVisibleIds.length > 0 &&
		onboardingVisibleIds.every((id) => selectedOnboardingIds.includes(id));

	const handleFilterChange = useCallback(
		(value: VendorListingFilter) => {
			setSearch("");
			setPageIndex(0);

			setSearchParams(
				{
					tab: value,
				},
				{
					replace: true,
				},
			);
		},
		[setSearchParams],
	);

	const handleSearchChange = useCallback((value: string) => {
		setSearch(value);
		setPageIndex(0);
	}, []);

	const handlePageChange = useCallback((nextPageIndex: number) => {
		setPageIndex(nextPageIndex);
	}, []);

	const handlePageSizeChange = useCallback((nextPageSize: number) => {
		setPageSize(nextPageSize);
		setPageIndex(0);
	}, []);

	const handleViewInitiation = useCallback(
		(row: VendorInitiationListingRow) => {
			navigate(`/vendor/initiation/${row.id}`);
		},
		[navigate],
	);

	const handleViewOnboarding = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor/onboarding/${row.id}`);
		},
		[navigate],
	);

	const handleExport = useCallback(() => {
		if (isInitiationTab) {
			console.log("Export vendor initiation rows:", filteredInitiationVendors);

			return;
		}

		console.log("Export vendor onboarding rows:", filteredOnboardingVendors);
	}, [filteredInitiationVendors, filteredOnboardingVendors, isInitiationTab]);

	const handleToggleInitiationRow = useCallback((id: string) => {
		setSelectedInitiationIds((currentIds) => {
			if (currentIds.includes(id)) {
				return currentIds.filter((selectedId) => selectedId !== id);
			}

			return [...currentIds, id];
		});
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
		setSelectedOnboardingIds((currentIds) => {
			if (currentIds.includes(id)) {
				return currentIds.filter((selectedId) => selectedId !== id);
			}

			return [...currentIds, id];
		});
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
				onView: handleViewInitiation,
			}),
		[
			selectedInitiationIds,
			handleToggleInitiationRow,
			handleToggleAllInitiations,
			areAllInitiationsSelected,
			handleViewInitiation,
		],
	);

	const onboardingColumns = useMemo(
		() =>
			getVendorOnboardingColumns({
				selectedIds: selectedOnboardingIds,
				onToggleRow: handleToggleOnboardingRow,
				onToggleAll: handleToggleAllOnboarding,
				isAllSelected: areAllOnboardingSelected,
				onView: handleViewOnboarding,
			}),
		[
			selectedOnboardingIds,
			handleToggleOnboardingRow,
			handleToggleAllOnboarding,
			areAllOnboardingSelected,
			handleViewOnboarding,
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
					onChange={handleFilterChange}
					className="border-b-none px-0 py-0"
				/>
			}
			secondaryHeader={
				<>
					<SearchInput
						value={search}
						onChange={handleSearchChange}
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
						onClick={handleExport}
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
							data={paginatedInitiationVendors}
							columns={initiationColumns}
							manualPagination
							pageIndex={safePageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
							emptyTitle="No vendor initiation requests found"
							emptyDescription="Vendor initiation form entries will appear here."
							scrollTargetId="vendor-initiation-table-scroll"
						/>
					) : (
						<DataTable<VendorOnboardingListingRow>
							data={paginatedOnboardingVendors}
							columns={onboardingColumns}
							manualPagination
							pageIndex={safePageIndex}
							pageSize={pageSize}
							pageCount={pageCount}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
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
};

export default VendorListingTable;
