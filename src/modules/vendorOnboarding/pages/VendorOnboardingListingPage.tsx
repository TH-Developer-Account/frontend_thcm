import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
	showApiErrorToast,
	showSuccessToast,
} from "../../../utils/apiError.helper";
import { navigateToDownloadUrl } from "../../../utils/exportJob.helper";

import VendorListingTable, {
	type VendorListingFilterTab,
} from "../components/VendorListingTable";
import { useVendorListing } from "../hooks/useVendorListing";
import { useResendVendorLinkMutation } from "../queries/useVendorMutations";
import type { VendorOnboardingListingRow } from "../types/vendorListing.types";
import {
	VENDOR_EXTERNAL_FILTER_TABS,
	VENDOR_ONBOARDING_FILTER_TABS,
} from "../utils/vendor.constant";
import { toOnboardingRow } from "../utils/vendorListingRowMapper";
import { formatVendorMessage, vendorContent } from "../utils/vendor.content";

// Copy for the "Retrigger Email" row action now lives in
// content/vendor.content.en.json -> toast.initiation.retrigger*
const retriggerToast = vendorContent.toast.initiation;
const { breadcrumbs } = vendorContent.pages;
const pageContent = vendorContent.pages.listing;

// ─────────────────────────────────────────────────────────────────────────
// External-user listing identity
// ─────────────────────────────────────────────────────────────────────────
// TODO(confirm): this lookup is the ONLY place that knows how the auth user
// exposes "is external". I couldn't see the AuthUser type in project files,
// so these property names are best guesses — rename them here to match the
// real shape and nothing else needs to change.
type AuthUserLike = Record<string, unknown> | null | undefined;

// External (TCS) users are identified by userType on the auth user.
const getIsExternalUser = (user: unknown): boolean => {
	const source = user as AuthUserLike;

	return String(source?.userType ?? "").toUpperCase() === "TCS";
};

const VendorOnboardingListingPage = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { showToast } = useToast();
	const resendLinkMutation = useResendVendorLinkMutation();

	const isExternalUser = getIsExternalUser(user);

	// External (TCS) approvers: no tab bar at all — the listing always shows
	// "Pending on me" (initialTab below). Internal users keep the full tab set.
	// External (TCS) users: Pending on me + Completed (approvedByMe).
	// Internal users keep the full tab set.
	const filterTabs = useMemo<readonly VendorListingFilterTab[]>(
		() =>
			isExternalUser
				? VENDOR_EXTERNAL_FILTER_TABS
				: VENDOR_ONBOARDING_FILTER_TABS,
		[isExternalUser],
	);

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

	// "Retrigger Email" row action → POST /vendor-onboarding/:id/resend-link.
	// The row action is only rendered while the vendor hasn't submitted
	// (see getVendorRowPermissions → canRetrigger), and the backend rejects
	// anything that isn't AWAITING_VENDOR, so a stale row can't resend.
	const { mutateAsync: resendVendorLink, isPending: isResending } =
		resendLinkMutation;

	const handleRetriggerRow = useCallback(
		async (row: VendorOnboardingListingRow) => {
			// Guards a double click while the first request is in flight.
			if (isResending) return;

			try {
				await resendVendorLink(row.id);

				showSuccessToast(
					showToast,
					row.email
						? formatVendorMessage(
								retriggerToast.retriggerSuccessDescriptionWithEmail,
								{ email: row.email },
							)
						: retriggerToast.retriggerSuccessDescription,
					retriggerToast.retriggerSuccessTitle,
				);
			} catch (error) {
				showApiErrorToast(
					showToast,
					error,
					retriggerToast.retriggerErrorFallback,
					retriggerToast.retriggerErrorTitle,
				);
			}
		},
		[isResending, resendVendorLink, showToast],
	);

	return (
		<PageSectionLayout>
			<PageHeader
				headerText={pageContent.title}
				headerChildren={
					!isExternalUser && (
						<Button
							path="/vendor-onboarding/initiate"
							text={vendorContent.buttons.initiate}
							appearance="standard"
							variant="brand"
							Icon={Plus}
							size="sm"
							iconSize={18}
						/>
					)
				}
				navigation={{
					variant: "breadcrumbs",
					ariaLabel: pageContent.ariaLabel,
					breadcrumbs: [
						{
							label: breadcrumbs.home,
							href: "/",
						},
						{
							label: breadcrumbs.vendorsListing,
							href: "/vendor-onboarding/listing?tab=onboarding",
						},
					],
					separator: vendorContent.common.breadcrumbSeparator,
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
