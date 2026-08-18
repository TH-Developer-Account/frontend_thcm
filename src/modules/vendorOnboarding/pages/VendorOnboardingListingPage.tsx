import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorListingTable from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import type { VendorOnboardingListingRow } from "../types/vendorListing.types";
import { VENDOR_ONBOARDING_FILTER_TABS } from "../utils/vendor.constant";
import { toOnboardingRow } from "../utils/vendorListingRowMapper";

const VendorOnboardingListingPage = () => {
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
	} = useVendorListing({
		initialTab: "pendingOnMe",
	});

	const rowsForTable = useMemo(() => rows.map(toOnboardingRow), [rows]);

	const handleViewRow = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor/onboarding/${row.id}/view`);
		},
		[navigate],
	);

	const handleExport = useCallback(() => {
		console.log(`Export vendor ${tab} rows:`, rows);
	}, [rows, tab]);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor onboarding listing location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendor Onboarding",
						},
					],
					separator: "›",
				}}
			/>

			<VendorListingTable
				listingType="onboarding"
				filterTabs={VENDOR_ONBOARDING_FILTER_TABS}
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
				onExport={handleExport}
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default VendorOnboardingListingPage;
