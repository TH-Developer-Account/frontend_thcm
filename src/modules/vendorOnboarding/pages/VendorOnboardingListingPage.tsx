import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorListingTable from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import type { VendorOnboardingListingRow } from "../types/vendorListing.types";
import { VENDOR_ONBOARDING_FILTER_TABS } from "../utils/vendor.constant";
import { toOnboardingRow } from "../utils/vendorListingRowMapper";
import Button from "../../../components/common/Button";
import { Plus } from "lucide-react";
import { Alert } from "../../../components/common/Alert";
import { navigateToDownloadUrl } from "../../../utils/exportJob.helper";

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
		isExporting,
		exportState,
		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		handleExport,
		dismissExport,
		setPageIndex,
	} = useVendorListing({ initialTab: "pendingOnMe" });

	const rowsForTable = useMemo(() => rows.map(toOnboardingRow), [rows]);

	const handleViewRow = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor/onboarding/${row.id}/view`);
		},
		[navigate],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding"
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

			{exportState.status === "delayed" && (
				<Alert
					type="banner"
					variant="info"
					title="Still exporting…"
					description="This is taking longer than usual. We'll let you know when it's ready."
				/>
			)}

			{exportState.status === "ready" && (
				<Alert
					type="banner"
					variant="success"
					title="Export ready"
					description="Your vendor onboarding export is ready to download."
					primaryAction={{
						label: "Download",
						onClick: () => navigateToDownloadUrl(exportState.downloadUrl),
					}}
					secondaryAction={{ label: "Dismiss", onClick: dismissExport }}
				/>
			)}

			{exportState.status === "error" && (
				<Alert
					type="banner"
					variant="error"
					title="Export failed"
					description={exportState.message}
					primaryAction={{ label: "Retry", onClick: handleExport }}
					secondaryAction={{ label: "Dismiss", onClick: dismissExport }}
				/>
			)}

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
