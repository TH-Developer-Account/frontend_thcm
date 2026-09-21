import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { vendorContent } from "../../../content/vendor.content";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { navigateToDownloadUrl } from "../../../utils/exportJob.helper";

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
		isExporting,
		exportState,
		handleTabChange,
		handleSearchChange,
		handlePageSizeChange,
		handleExport,
		dismissExport,
		setPageIndex,
	} = useVendorListing({
		initialTab: "pendingOnMe",
	});

	const rowsForTable = useMemo(() => rows.map(toOnboardingRow), [rows]);

	const handleViewRow = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor/onboarding/${row.id}`);
		},
		[navigate],
	);

	const handleEditRow = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor/onboarding/${row.id}`);
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
						text="Initiate"
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
					title={vendorContent.toast.export.delayedTitle}
					description={vendorContent.toast.export.delayedDescription}
				/>
			)}

			{exportState.status === "ready" && (
				<Alert
					type="banner"
					variant="success"
					title={vendorContent.toast.export.readyTitle}
					description={vendorContent.toast.export.readyDescription}
					primaryAction={{
						label: vendorContent.toast.export.downloadLabel,
						onClick: () => navigateToDownloadUrl(exportState.downloadUrl),
					}}
					secondaryAction={{
						label: vendorContent.toast.export.dismissLabel,
						onClick: dismissExport,
					}}
				/>
			)}

			{exportState.status === "error" && (
				<Alert
					type="banner"
					variant="error"
					title={vendorContent.toast.export.errorTitle}
					description={exportState.message}
					primaryAction={{
						label: vendorContent.toast.export.retryLabel,
						onClick: handleExport,
					}}
					secondaryAction={{
						label: vendorContent.toast.export.dismissLabel,
						onClick: dismissExport,
					}}
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
				onEditRow={handleEditRow}
				isExporting={isExporting}
			/>
		</PageSectionLayout>
	);
};

export default VendorOnboardingListingPage;
