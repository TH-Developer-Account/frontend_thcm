import type {
	VendorOnboardingListingRow,
	VendorTableStatus,
} from "../types/vendorListing.types";
import type { VendorListingRow } from "../api/vendorOnboarding.api";

export const toOnboardingRow = (
	row: VendorListingRow,
): VendorOnboardingListingRow => ({
	id: row.id,
	vendorName: row.vendorName ?? "",
	email: row.email ?? "",
	mobile: row.mobile ?? "",
	vendorCode: row.vendorCode,
	vendorType: row.vendorType,
	companyCode: row.companyCode,
	purchaseOrg: null, // not returned by the list endpoint — only on single-record fetch
	region: null, // no backing schema field; kept for prop-shape compatibility only
	initiatedBy: row.initiatedBy,
	createdDate: row.created_at,
	updatedAt: row.updated_at,
	status: row.status as VendorTableStatus,
	referenceNumber: row.referenceNumber,
});
