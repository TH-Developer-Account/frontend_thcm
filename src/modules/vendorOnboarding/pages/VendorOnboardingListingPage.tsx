import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { vendorContent } from "../../../content/vendor.content";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import { navigateToDownloadUrl } from "../../../utils/exportJob.helper";

import VendorListingTable, {
	type VendorListingFilterTab,
} from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import type { VendorOnboardingListingRow } from "../types/vendorListing.types";
import { VENDOR_ONBOARDING_FILTER_TABS } from "../utils/vendor.constant";
import { toOnboardingRow } from "../utils/vendorListingRowMapper";

// ─────────────────────────────────────────────────────────────────────────
// External-user listing identity
// ─────────────────────────────────────────────────────────────────────────
// TODO(confirm): the two lookups below are the ONLY place that knows how the
// auth user exposes "is external" and the BP name. I couldn't see the AuthUser
// type in project files, so these property names are best guesses — rename
// them here to match the real shape and nothing else needs to change.
type AuthUserLike = Record<string, unknown> | null | undefined;

const getExternalListingIdentity = (
	user: unknown,
): { isExternalUser: boolean; bpName: string } => {
	const source = user as AuthUserLike;

	const isExternalUser =
		Boolean(source?.isExternal ?? source?.isExternalUser) ||
		String(source?.userType ?? "").toUpperCase() === "EXTERNAL";

	const bpName = String(
		source?.bpName ??
			(source?.businessPartner as { name?: string } | undefined)?.name ??
			"",
	).trim();

	return { isExternalUser, bpName };
};

const PENDING_ON_ME_TAB = VENDOR_ONBOARDING_FILTER_TABS.find(
	(tab) => tab.value === "pendingOnMe",
);

const VendorOnboardingListingPage = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const { isExternalUser, bpName } = getExternalListingIdentity(user);

	// External users (e.g. TCS) get exactly one tab — "Pending on me" — labelled
	// with their BP name. Internal users keep the full tab set.
	const filterTabs = useMemo<readonly VendorListingFilterTab[]>(() => {
		if (!isExternalUser || !PENDING_ON_ME_TAB) {
			return VENDOR_ONBOARDING_FILTER_TABS;
		}

		const label = bpName || PENDING_ON_ME_TAB.label;

		return [
			{
				...PENDING_ON_ME_TAB,
				label,
				shortLabel: bpName || PENDING_ON_ME_TAB.shortLabel,
			},
		];
	}, [bpName, isExternalUser]);

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
		getRowPermissions,
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
			navigate(`/vendor-onboarding/${row.id}/view`);
		},
		[navigate],
	);

	const handleEditRow = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor-onboarding/${row.id}`);
		},
		[navigate],
	);

	// The Retrigger Email button in VendorOnboardingInitiationForm only
	// renders in "view" mode — point this at whichever route mounts
	// VendorInitiationPage with mode="view".
	const handleRetriggerRow = useCallback(
		(row: VendorOnboardingListingRow) => {
			navigate(`/vendor/initiation/${row.id}/view`);
		},
		[navigate],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText="Vendor Onboarding"
				headerChildren={
					<Button
						path="/vendor-onboarding/initiate"
						text="Initiate"
						appearance="standard"
						variant="brand"
						Icon={Plus}
						size="sm"
						iconSize={18}
					/>
				}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: "Vendors Listing Page",
					breadcrumbs: [
						{
							label: "Home Screen",
							href: "/",
						},
						{
							label: "Vendors Listing",
							href: "/vendor-onboarding/listing?tab=onboarding",
						},
					],
					separator: "›",
				}}
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
				filterTabs={filterTabs}
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
				getRowPermissions={getRowPermissions}
				onViewRow={handleViewRow}
				onEditRow={handleEditRow}
				onRetriggerRow={handleRetriggerRow}
				isExporting={isExporting}
			/>
		</PageSectionLayout>
	);
};

export default VendorOnboardingListingPage;
