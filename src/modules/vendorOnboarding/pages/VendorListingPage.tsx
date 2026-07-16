import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../components/ui/PageHeader";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import VendorListingTable from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import {
	toInitiationRow,
	toOnboardingRow,
} from "../utils/vendorListingRowMapper";

import type {
	VendorInitiationListingRow,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";
import type { VendorViewerRole } from "../types/vendorOnboarding.types";

type VendorListingPageProps = {
	viewerRole?: VendorViewerRole;
};

const VendorListingPage = ({
	viewerRole = "THCM_EMPLOYEE",
}: VendorListingPageProps) => {
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
	} = useVendorListing();

	const isInitiationTab = tab === "initiation";

	const rowsForTable = useMemo(
		() =>
			isInitiationTab ? rows.map(toInitiationRow) : rows.map(toOnboardingRow),
		[isInitiationTab, rows],
	);

	const handleViewRow = useCallback(
		(row: VendorInitiationListingRow | VendorOnboardingListingRow) => {
			if (tab === "initiation") {
				navigate(`/vendor/initiation/${row.id}`);
				return;
			}

			// const isThcmEmployee = viewerRole === "THCM_EMPLOYEE";

			// if (isThcmEmployee) {
			// 	/*
			// 	 * Existing onboarding request:
			// 	 * open editable stepper with prepopulated values.
			// 	 */
			// 	navigate(`/vendor/onboarding/${row.id}`);
			// 	return;
			// }

			/*
			 * Approver/viewer route:
			 * open read-only summary and workflow actions.
			 */
			navigate(`/vendor/onboarding/${row.id}/view`);
		},
		[navigate, tab, viewerRole],
	);

	const handleExport = useCallback(() => {
		console.log(`Export vendor ${tab} rows:`, rows);
	}, [rows, tab]);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendors Listing"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendors listing location",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor/listing",
						},
					],
					separator: "›",
				}}
			/>

			<VendorListingTable
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

export default VendorListingPage;
