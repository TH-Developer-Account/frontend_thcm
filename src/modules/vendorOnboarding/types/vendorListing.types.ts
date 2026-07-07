export type VendorListingFilter = "pending" | "approvedByMe" | "createdByMe";

export type VendorListingStatus =
	| "PENDING"
	| "APPROVED"
	| "CLARIFICATION"
	| "CLOSED";

export type VendorListingRow = {
	id: string;
	vendorCode: string;
	vendorName: string;
	vendorType: string;
	companyCode: string;
	region: string;
	status: VendorListingStatus;
	createdBy: string;
	approvedBy?: string;
	createdDate: string;
};
