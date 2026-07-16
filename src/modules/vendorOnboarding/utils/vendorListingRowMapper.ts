import type {
	VendorInitiationListingRow,
	VendorOnboardingListingRow,
	VendorTableStatus,
} from "../types/vendorListing.types";
import type { VendorListingRow } from "../api/vendorOnboarding.api";

export const toInitiationRow = (
	row: VendorListingRow,
): VendorInitiationListingRow => ({
	id: row.id,
	vendorName: row.vendorName ?? "",
	email: row.email ?? "",
	mobile: row.mobile ?? "",
	initiatedBy: row.initiatedBy,
	created_at: row.created_at,
	status: row.status as VendorTableStatus,
});

export const toOnboardingRow = (
	row: VendorListingRow,
): VendorOnboardingListingRow => ({
	id: row.id,
	vendorName: row.vendorName ?? "",
	vendorCode: row.vendorCode,
	vendorType: row.vendorType,
	companyCode: row.companyCode,
	purchaseOrg: null, // not returned by the list endpoint — only on single-record fetch
	region: null, // no backing schema field; kept for prop-shape compatibility only
	initiatedBy: row.initiatedBy,
	createdDate: row.created_at,
	updatedAt: row.updated_at,
	status: row.status as VendorTableStatus,
});
