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
		first_name: string;
		last_name: string;
	};
	createdDate?: string | null;
	updatedAt?: string | null;

	status?: VendorTableStatus | null;
	referenceNumber?: string;
	vendorReferenceName?: string;
};

export type VendorOnboardingColumnsParams = {
	onView: (row: VendorOnboardingListingRow) => void;
	onEdit?: (row: VendorOnboardingListingRow) => void;

	basePath?: string;

	getViewPath?: (row: VendorOnboardingListingRow) => string;

	canEdit?: (row: VendorOnboardingListingRow) => boolean;
};
export type VendorOnboardingInitiationPayload = {
	vendorName: string;
	vendorReferenceName?: string;
	email: string;
	mobile: string;
	status?: string;
};
