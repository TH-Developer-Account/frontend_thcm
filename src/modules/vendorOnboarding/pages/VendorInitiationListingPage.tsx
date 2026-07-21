import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorListingTable from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import type { VendorInitiationListingRow } from "../types/vendorListing.types";
import { VENDOR_INITIATION_FILTER_TABS } from "../utils/vendor.constant";
import { toInitiationRow } from "../utils/vendorListingRowMapper";

const VendorInitiationListingPage = () => {
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

	const rowsForTable = useMemo(() => rows.map(toInitiationRow), [rows]);

	const handleViewRow = useCallback(
		(row: VendorInitiationListingRow) => {
			navigate(`/vendor/initiation/${row.id}/view`);
		},
		[navigate],
	);

	const handleExport = useCallback(() => {
		console.log(`Export vendor initiation ${tab} rows:`, rows);
	}, [rows, tab]);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Initiation"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendor initiation listing location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendor Initiation",
						},
					],
					separator: "›",
				}}
			/>

			<VendorListingTable
				listingType="initiation"
				filterTabs={VENDOR_INITIATION_FILTER_TABS}
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

export default VendorInitiationListingPage;
