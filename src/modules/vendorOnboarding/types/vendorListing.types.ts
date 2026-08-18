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

export type VendorInitiationListingRow = {
	id: string;
	vendorName: string;
	email: string;
	mobile: string;
	initiatedBy: {
		first_name: string;
		last_name: string;
	};
	created_at?: string | null;
	status?: VendorTableStatus;
	referenceNumber?: string;
};

export type VendorOnboardingListingRow = {
	id: string;
	vendorName: string;

	vendorCode?: string | null;
	vendorType?: string | null;
	companyCode?: string | null;
	purchaseOrg?: string | null;
	region?: string | null;
	initiatedBy: {
		first_name: string;
		last_name: string;
	};
	createdDate?: string | null;
	updatedAt?: string | null;

	status?: VendorTableStatus;
	referenceNumber?: string;
};

export type VendorInitiationColumnsParams = {
	onView: (row: VendorInitiationListingRow) => void;
};

export type VendorOnboardingColumnsParams = {
	onView: (row: VendorOnboardingListingRow) => void;
};
export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	email: string;
	mobile: string;
	status?: string;
};
