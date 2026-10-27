import { useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import { PageHeader } from "../../../components/ui/PageHeader";
import { vendorContent } from "../../../content/vendor.content";
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
import { VENDOR_ONBOARDING_FILTER_TABS } from "../utils/vendor.constant";
import { toOnboardingRow } from "../utils/vendorListingRowMapper";

// Copy for the "Retrigger Email" row action. Kept here because
// content/vendor.content(.en.json) isn't in the project files — move these
// into vendorContent.toast.initiation when convenient.
const RETRIGGER_TOAST = {
	successTitle: "Email sent",
	successDescription: "A fresh link has been emailed to the vendor.",
	errorTitle: "Couldn't resend the email",
	errorFallback: "The email could not be resent. Please try again.",
} as const;

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
	const { showToast } = useToast();
	const resendLinkMutation = useResendVendorLinkMutation();

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
						? `A fresh link has been emailed to ${row.email}.`
						: RETRIGGER_TOAST.successDescription,
					RETRIGGER_TOAST.successTitle,
				);
			} catch (error) {
				showApiErrorToast(
					showToast,
					error,
					RETRIGGER_TOAST.errorFallback,
					RETRIGGER_TOAST.errorTitle,
				);
			}
		},
		[isResending, resendVendorLink, showToast],
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
