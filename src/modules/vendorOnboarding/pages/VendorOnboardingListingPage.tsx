import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";

import VendorListingTable from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import type { VendorOnboardingListingRow } from "../types/vendorListing.types";
import { VENDOR_ONBOARDING_FILTER_TABS } from "../utils/vendor.constant";
import { toOnboardingRow } from "../utils/vendorListingRowMapper";
import { useToast } from "../../../context/Auth/AuthContext";
import { vendorOnboardingApi } from "../api/vendorOnboarding.api";
import Button from "../../../components/common/Button";
import { Plus } from "lucide-react";

const VendorOnboardingListingPage = () => {
	const navigate = useNavigate();
	const { showToast } = useToast();

	const [isExporting, setIsExporting] = useState(false);
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

	const handleExport = useCallback(async () => {
		setIsExporting(true);
		try {
			await vendorOnboardingApi.enqueueBulkExport({
				tab,
				search: search || undefined,
			});

			showToast({
				type: "success",
				title: "Export started",
				description: "We'll notify you when it's ready to download.",
			});
		} catch (error) {
			showToast({
				type: "error",
				title: "Export failed",
				description: "Failed to start vendor export.",
			});
		} finally {
			setIsExporting(false);
		}
	}, [tab, search, showToast, navigate]);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding"
				// navigation={{
				// 	variant: "breadcrumbs",
				// 	ariaLabel: "Vendor onboarding listing location",
				// 	breadcrumbs: [
				// 		{
				// 			label: "Home Screen",
				// 			href: "/",
				// 		},
				// 		{
				// 			label: "Vendor Onboarding",
				// 		},
				// 	],
				// 	separator: "›",
				// }}
				headerChildren={
					<Button
						path="/vendor/initiation/create"
						text="Initiate Onboarding"
						appearance="standard"
						variant="brand"
						Icon={Plus}
						size="sm"
						iconSize={18}
					/>
				}
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
				isExporting={isExporting}
			/>
		</PageSectionLayout>
	);
};

export default VendorOnboardingListingPage;
