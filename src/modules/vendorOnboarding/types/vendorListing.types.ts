// import type { PendingOn } from "../../../utils/statusAlert.helper";

import type { PendingOn } from "../../../utils/statusAlert.helper";

export type VendorListingFilter =
	| "createdByMe"
	| "pendingOnMe"
	| "onboarding"
	| "initiation"
	| "approvedByMe";

// Matches the actual VendorOnboarding.status values used by the backend
// (vendorOnboarding_controller.ts / schema.prisma default), not the
// previous placeholder set which never matched real data.
export type VendorTableStatus =
	| "AWAITING_VENDOR"
	| "VENDOR_SUBMITTED"
	| "IN_REVIEW"
	| "IN_PROGRESS"
	| "CLOSED";

export type VendorOnboardingListingRow = {
	id: string;
	vendorName: string;
	email: string;
	mobile: string;
	vendorCode?: string | null;
	vendorType?: string | null;
	companyCode?: string | null;
	purchaseOrg?: string | null;
	region?: string | null;
	initiatedBy: {
		id?: string | null;
		first_name: string;
		last_name: string;
	};
	createdDate?: string | null;
	updatedAt?: string | null;

	status?: VendorTableStatus;
	referenceNumber?: string;
	vendorReferenceName?: string;
	pendingOn?: PendingOn;
};

// What the current user may do on one listing row. Computed by
// helpers/vendor.permissions.ts → getVendorRowPermissions.
export type VendorRowPermissions = {
	canView: boolean;
	canEdit: boolean;
	canRetrigger: boolean;
};

export type VendorOnboardingColumnsParams = {
	onView: (row: VendorOnboardingListingRow) => void;
	onEdit?: (row: VendorOnboardingListingRow) => void;
	onRetrigger?: (row: VendorOnboardingListingRow) => void;

	// Single source of truth for row actions. Replaces the old per-action
	// canView/canEdit callbacks and the status rules hard-coded in columns.
	getRowPermissions: (row: VendorOnboardingListingRow) => VendorRowPermissions;

	basePath?: string;

	getViewPath?: (row: VendorOnboardingListingRow) => string;
};

export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	vendorReferenceName?: string;
	email: string;
	mobile: string;
	status?: string;
};
