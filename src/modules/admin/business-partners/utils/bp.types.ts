export type BusinessPartnerOfficeType = "HEAD_OFFICE" | "BRANCH_OFFICE";

export type BusinessPartnerStatus = "Active" | "Inactive";

export type BusinessPartnerAddress = {
	id: string;
	businessPartnerId: string;
	address: string;
	city: string | null;
	state: string | null;
	country: string | null;
	pincode: string | null;
	region: string | null;
	zone: string | null;
	branch: string | null;
	latitude: number | null;
	longitude: number | null;
	email: string | null;
	phoneNo: string | null;
	website: string | null;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;
};

export type BusinessPartnerContact = {
	id: string;
	businessPartnerId: string;
	userId: string | null;
	name: string;
	phoneNumber: string | null;
	email: string | null;
	panNumber: string | null;
	isOwner: boolean;
	isMainContact: boolean;
	createdAt: string;
	updatedAt: string;
};

export type BusinessPartnerBranch = {
	id: string;
	bpName: string;
	isActive: boolean;
};

export type BusinessPartnerParent = {
	id: string;
	bpName: string;
	officeType: BusinessPartnerOfficeType;
};

export type BusinessPartnerDetail = {
	id: string;
	internalId: string;
	vendorId: string | null;
	bpId: string | null;
	s4Id: string | null;
	bydId: string | null;
	c4cId: string | null;

	bpName: string;
	bpShortName: string | null;
	isKeyAccount: boolean;

	gst: string | null;
	panNumber: string | null;
	legalTradeName: string | null;

	officeType: BusinessPartnerOfficeType;
	bpType: string;
	entityType: string | null;
	vendorCode: string | null;

	isActive: boolean;
	joinedOn: string | null;
	parentId: string | null;

	createdAt: string;
	updatedAt: string;

	parent: BusinessPartnerParent | null;
	branches: BusinessPartnerBranch[];
	addresses: BusinessPartnerAddress[];
	contacts: BusinessPartnerContact[];
};

export type BusinessPartner = {
	id: string;
	internalId: string;
	externalId: string;
	organizationName: string;
	region: string;
	mainContact: string;
	address: string;
	joinedOn: string | null;
	officeType: BusinessPartnerOfficeType;
	bpType: string;
	gst: string;
	status: BusinessPartnerStatus;
};

export type BusinessPartnerListingParams = {
	search?: string;
	status?: string[];
	zone?: string[];
	page?: number;
	limit?: number;
};

export type BusinessPartnerListingResult = {
	rows: BusinessPartner[];
	totalCount: number;
	page: number;
	limit: number;
	totalPages: number;
};
