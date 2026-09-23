import type {
	VendorOnboardingListingRow,
	VendorTableStatus,
} from "../types/vendorListing.types";
import type { VendorListingRow } from "../api/vendorOnboarding.api";
import type { PendingOn } from "../../../utils/statusAlert.helper";

const mapVendorPendingOn = (status: string | null | undefined): PendingOn => {
	const normalized = status
		?.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, "_");

	switch (normalized) {
		case "APPROVED":
			return { role: "NONE", outcome: "APPROVED" };

		case "REJECTED":
		case "CANCELLED":
		case "CANCELED":
			return { role: "NONE", outcome: "REJECTED" };

		case "AWAITING_VENDOR":
		case "IN_PROGRESS":
			return { role: "VENDOR" };

		case "DRAFT":
		case "INITIATED":
			return { role: "PROPOSER" };

		case "VENDOR_SUBMITTED":
		case "IN_REVIEW":
			return {
				role: "APPROVER",
				approvers: [{ id: "thcm", name: "THCM Team" }],
			};

		default:
			return { role: "PROPOSER" };
	}
};

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
	purchaseOrg: null,
	region: null,
	initiatedBy: row.initiatedBy,
	createdDate: row.created_at,
	updatedAt: row.updated_at,
	status: row.status as VendorTableStatus,
	referenceNumber: row.referenceNumber,
	pendingOn: mapVendorPendingOn(row.status),
});
