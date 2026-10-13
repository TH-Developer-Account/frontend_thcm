import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import MedicalClaimListingTable from "../components/MedicalClaimListingTable";
import { useMedicalClaimListing } from "../hooks/useMedicalClaimListing";
import type {
	MedicalClaimListingRow,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";
import { toMedicalClaimListingRow } from "../helpers/medicalClaimListing.mapper";
import { getMedicalClaimRowRoute } from "../utils/medicalClaimListing.columns";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Alert } from "../../../components/common/Alert";
import { navigateToDownloadUrl } from "../../../utils/exportJob.helper";
import { getApiErrorMessage } from "../../../utils/apiError.helper";

const TABS: MedicalClaimListingTab[] = ["claims", "initiation", "pendingOnMe", "approvedByMe"];

/** Tab shown when the listing is opened without ?tab= (e.g. from the home card). */
export const DEFAULT_MEDICAL_CLAIM_TAB: MedicalClaimListingTab = "pendingOnMe";

const toTab = (value: string | null): MedicalClaimListingTab =>
	value && TABS.includes(value as MedicalClaimListingTab)
		? (value as MedicalClaimListingTab)
		: DEFAULT_MEDICAL_CLAIM_TAB;

const MedicalClaimListingPage = () => {
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const tabParam = searchParams.get("tab");
	const urlTab = toTab(tabParam);

	const listing = useMedicalClaimListing({ initialTab: urlTab });
	const { tab: currentTab, handleTabChange: changeListingTab } = listing;

	// The URL is the source of truth for the tab:
	//  - no / unknown ?tab= (home card, sidebar) → write the default into the
	//    URL so the tab is visibly selected and "back" returns to it;
	//  - ?tab= changed while already on this page (home card clicked again,
	//    redirect after approve) → switch the listing to it.
	useEffect(() => {
		if (tabParam !== urlTab) {
			setSearchParams(
				(current) => {
					const next = new URLSearchParams(current);
					next.set("tab", urlTab);
					return next;
				},
				{ replace: true },
			);
		}
		if (urlTab !== currentTab) changeListingTab(urlTab);
	}, [changeListingTab, currentTab, setSearchParams, tabParam, urlTab]);

	const rowsForTable = useMemo(
		() => listing.rows.map(toMedicalClaimListingRow),
		[listing.rows],
	);

	const handleTabChange = useCallback(
		(tab: MedicalClaimListingTab) => {
			listing.handleTabChange(tab);
			// Keep the tab in the URL so "back" from a claim returns to it.
			setSearchParams({ tab }, { replace: true });
		},
		[listing, setSearchParams],
	);

	const handleViewRow = useCallback(
		(row: MedicalClaimListingRow) => {
			navigate(getMedicalClaimRowRoute(row), {
				state: {
					actorRole:
						listing.tab === "pendingOnMe" || listing.tab === "approvedByMe"
							? "approver"
							: "creator",
				},
			});
		},
		[listing.tab, navigate],
	);

	const { exportState } = listing;

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Medical Reimbursement Claims"
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Medical reimbursement claim listing location",
					breadcrumbs: [
						{ label: "Home Screen", href: "/" },
						{ label: "Medical Reimbursement Claims" },
					],
					separator: "›",
				}}
			/>

			{exportState.status === "delayed" && (
				<Alert
					type="banner"
					variant="info"
					title="Still exporting…"
					description="This is taking longer than usual. We'll let you know the moment it's ready."
				/>
			)}

			{exportState.status === "ready" && (
				<Alert
					type="banner"
					variant="success"
					title="Export ready"
					description="Your medical claims export is ready to download."
					primaryAction={{
						label: "Download",
						onClick: () => navigateToDownloadUrl(exportState.downloadUrl),
					}}
					secondaryAction={{ label: "Dismiss", onClick: listing.dismissExport }}
				/>
			)}

			{exportState.status === "error" && (
				<Alert
					type="banner"
					variant="error"
					title="Export failed"
					description={exportState.message}
					primaryAction={{ label: "Retry", onClick: listing.handleExport }}
					secondaryAction={{ label: "Dismiss", onClick: listing.dismissExport }}
				/>
			)}

			<MedicalClaimListingTable
				selectedFilter={listing.tab}
				onFilterChange={handleTabChange}
				search={listing.search}
				onSearchChange={listing.handleSearchChange}
				status={listing.status}
				statusOptions={listing.statusOptions}
				onStatusChange={listing.handleStatusChange}
				rows={rowsForTable}
				totalCount={listing.totalCount}
				isLoading={listing.isLoading}
				isFetching={listing.isFetching}
				isError={listing.isError}
				errorMessage={getApiErrorMessage(listing.error, "Unable to load medical claims.")}
				onRetry={() => void listing.refetch()}
				pageIndex={listing.pageIndex}
				pageSize={listing.pageSize}
				pageCount={listing.pageCount}
				onExport={listing.handleExport}
				isExporting={listing.isExporting}
				onPageChange={listing.setPageIndex}
				onPageSizeChange={listing.handlePageSizeChange}
				onViewRow={handleViewRow}
			/>
		</PageSectionLayout>
	);
};

export default MedicalClaimListingPage;
