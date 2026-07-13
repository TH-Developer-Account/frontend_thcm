export type VendorListingFilter = "initiation" | "onboarding";

export type VendorTableStatus =
	| "PENDING"
	| "APPROVED"
	| "CLARIFICATION"
	| "CLOSED";

export type VendorInitiationListingRow = {
	id: string;
	vendorName: string;
	vendorEmail: string;
	vendorPhone: string;
	createdBy?: string | null;
	createdAt?: string | null;
	status?: VendorTableStatus;
};

export type VendorOnboardingListingRow = {
	id: string;
	vendorName: string;

	vendorCode?: string | null;
	vendorType?: string | null;
	companyCode?: string | null;
	purchaseOrg?: string | null;
	region?: string | null;

	createdBy?: string | null;
	createdDate?: string | null;
	updatedAt?: string | null;

	status?: VendorTableStatus;
};
