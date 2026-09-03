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
	userId: string;
	name: string;
	phoneNumber: string | null;
	email: string | null;
	panNumber: string | null;
	isOwner: boolean;
	isMainContact: boolean;
	createdAt: string;
	updatedAt: string;
};
export type BPContactData = {
	name?: string;
	email?: string;
	mobile_number?: string;
	phone?: string;
	fax?: string;
	status?: string;
	mainContactPerson?: string;
	mainContactNumber?: string;
	state?: string;
	city?: string;
	country?: string;
};

export type InfoField = {
	label: string;
	value?: string;
	isLink?: boolean;
	tab?: string;
};
export type BPOrganizationData = {
	orgName?: string;
	joinedOn?: string;
	branches?: string;
	gstNo?: string;
	panNo?: string;
	bpCode?: string;
	zone?: string;
	segment?: string;
	category?: string;
	partnerType?: string;
	registrationNo?: string;
	website?: string;
	status?: string;
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

export type CreateBusinessPartnerPayload = Omit<
	BusinessPartnerDetail,
	"id" | "branches" | "parent"
>;

export type UpdateBusinessPartnerPayload =
	Partial<CreateBusinessPartnerPayload>;

export type ApiEnvelope<T> = {
	data: T;
};

export type BusinessPartnerListApiResponse = {
	data?: BusinessPartnerListItem[];
	rows?: BusinessPartnerListItem[];
	total?: number;
	totalCount?: number;
	page?: number;
	page_index?: number;
	limit?: number;
	page_size?: number;
	totalPages?: number;
	total_pages?: number;
};

export type BusinessPartnerListItem = {
	id: string;
	bpName: string;
	bpShortName?: string | null;
	officeType: BusinessPartnerDetail["officeType"];
	bpType: string;
	gst?: string | null;
	isActive: boolean;
	internalId?: string | null;
	externalId?: string | null;
	organizationName?: string | null;
	region?: string | null;
	mainContact?: string | null;
	address?: string | null;
	joinedOn?: string | null;
	status?: "Active" | "Inactive";
	bpId?: string | null;
	s4Id?: string | null;
	vendorId?: string | null;
};

export type BPAddressViewModel = {
	id: string;
	label: string;
	addressType: string;
	address: string;
	city: string;
	state: string;
	country: string;
	pincode: string;
	region: string;
	zone: string;
	branch: string;
	email: string;
	phoneNumber: string;
	website: string;
	isDefault: boolean;
};

export type BPContactViewModel = {
	id: string;
	userId: string;
	name: string;
	email: string;
	phoneNumber: string;
	panNumber: string;
	businessPartnerId: string;
	role: "Owner" | "Main Contact" | "Contact";
	isOwner: boolean;
	isMainContact: boolean;
};

export type BPBranchViewModel = {
	id: string;
	name: string;
	status: "Active" | "Inactive";
};

export type BusinessPartnerViewModel = {
	partner: BusinessPartnerDetail;
	primaryAddress: BPAddressViewModel | null;
	primaryContact: BPContactViewModel | null;
	addresses: BPAddressViewModel[];
	people: BPContactViewModel[];
	mainContacts: BPContactViewModel[];
	branches: BPBranchViewModel[];

	contact: {
		name: string;
		email: string;
		mobileNumber: string;
		phone: string;
		fax: string;
		status: string;
		mainContactPerson: string;
		mainContactNumber: string;
		state: string;
		city: string;
		country: string;
	};

	organization: {
		orgName: string;
		joinedOn: string;
		branches: string;
		gstNo: string;
		panNo: string;
		registrationNo: string;
		bpCode: string;
		zone: string;
		segment: string;
		category: string;
		partnerType: string;
		status: string;
		website: string;
	};
};

export type BPAddressFormState = {
	label: string;
	addressType: string;
	address: string;
};

// BP People Types

export type BusinessPartnerPersonPayload = {
	userId: string;
	isMainContact: boolean;
};

export type UpdateBusinessPartnerPeoplePayload = BusinessPartnerPersonPayload[];

export type RemoveBusinessPartnerContactVariables = {
	businessPartnerId: string;
	contactId: string;
};
