export type BusinessPartnerOfficeType = "HEAD_OFFICE" | "BRANCH_OFFICE";

type SelectOption<T extends string> = {
	label: string;
	value: T;
};

export const BUSINESS_PARTNER_TYPE_OPTIONS: SelectOption<BusinessPartnerType>[] =
	[
		{ label: "Dealer", value: "DEALER" },
		{ label: "Customer", value: "CUSTOMER" },
		{ label: "Employee", value: "EMPLOYEE" },
	];
export const OFFICE_TYPE_OPTIONS: SelectOption<BusinessPartnerOfficeType>[] = [
	{ label: "Head Office", value: "HEAD_OFFICE" },
	{ label: "Branch Office", value: "BRANCH_OFFICE" },
];

export const ENTITY_TYPE_OPTIONS: SelectOption<BusinessPartnerEntityType>[] = [
	{ label: "Company", value: "COMPANY" },
	{ label: "Partnership", value: "PARTNERSHIP" },
	{ label: "Proprietorship", value: "PROPRIETORSHIP" },
	{ label: "Individual", value: "INDIVIDUAL" },
	{ label: "Other", value: "OTHER" },
];
export type BusinessPartnerStatus = "Active" | "Inactive";
export type BusinessPartnerType = "DEALER" | "CUSTOMER" | "EMPLOYEE";

export type BusinessPartnerEntityType =
	| "COMPANY"
	| "PARTNERSHIP"
	| "PROPRIETORSHIP"
	| "INDIVIDUAL"
	| "OTHER";

export type BPAddressPermissions = {
	canCreateAddress: boolean;
	canUpdateAddress: boolean;
	canDeleteAddress: boolean;
	canSetDefaultAddress: boolean;
};

export type BPPeoplePermissions = {
	canAddPeople: boolean;
	canSetMainContact: boolean;
	canRemovePeople: boolean;
};

export type BusinessPartnerPermissions = {
	canCreateBusinessPartner: boolean;
	canUpdateBusinessPartner: boolean;
	canDeleteBusinessPartner: boolean;

	address: BPAddressPermissions;
	people: BPPeoplePermissions;
};

export const DEFAULT_BUSINESS_PARTNER_PERMISSIONS: BusinessPartnerPermissions =
	{
		canCreateBusinessPartner: true,
		canUpdateBusinessPartner: true,
		canDeleteBusinessPartner: true,

		address: {
			canCreateAddress: true,
			canUpdateAddress: true,
			canDeleteAddress: true,
			canSetDefaultAddress: true,
		},

		people: {
			canAddPeople: true,
			canSetMainContact: true,
			canRemovePeople: true,
		},
	};

export type BusinessPartnerAddressType =
	| "HEAD_OFFICE"
	| "BRANCH_OFFICE"
	| "PLANT"
	| "BILLING_ADDRESS"
	| "SHIPPING_ADDRESS"
	| "WAREHOUSE";

export type BPFormTab =
	| "general"
	| "organization"
	| "contact"
	| "address"
	| "branches"
	| "people";

export type BusinessPartnerAddress = {
	id: string;
	businessPartnerId: string;
	label?: string | null;

	/*
	 * Keep nullable temporarily if older API rows do not yet
	 * return addressType. Once the backend always supplies it,
	 * this can become BusinessPartnerAddressType.
	 */
	addressType: BusinessPartnerAddressType | null;

	address: string;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	pincode?: string | null;
	region?: string | null;
	zone: string | null;
	branch: string | null;

	latitude?: number | null;
	longitude?: number | null;

	email?: string | null;
	phoneNo?: string | null;
	website?: string | null;

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
	bpType: BusinessPartnerType;
	entityType: BusinessPartnerEntityType | null;
	vendorCode: string | null;

	isActive: boolean;
	joinedOn: string | null;
	parentId: string | null;

	createdAt: string;
	updatedAt: string;

	// Contact Information
	mobileNumber: string | null;
	email: string | null;
	fax: string | null;
	telephone: string | null;
	// mainContactName: string | null;
	// mainContactNumber: string | null;

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
	status?: BusinessPartnerStatus;
	bpId?: string | null;
	s4Id?: string | null;
	vendorId?: string | null;
};

export type BPAddressViewModel = {
	id: string;
	businessPartnerId: string;

	label: string;
	addressType: BusinessPartnerAddressType;
	address: string;

	city?: string;
	state?: string;
	country?: string;
	pincode?: string;
	region?: string;
	zone?: string;
	branch?: string;

	latitude?: number | null;
	longitude?: number | null;

	email?: string;
	phoneNumber?: string;
	website?: string;

	isDefault: boolean;
};

export type BPContactViewModel = {
	id: string;
	userId: string;
	businessPartnerId: string;

	name: string;
	email: string;
	phoneNumber: string;
	panNumber: string;

	role: "Owner" | "Main Contact" | "Contact";

	isOwner: boolean;
	isMainContact: boolean;
};

export type BPBranchViewModel = {
	id: string;
	name: string;
	status: BusinessPartnerStatus;
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
	addressType: BusinessPartnerAddressType | "";

	/*
	 * UI-only field. Do not include it in the API payload.
	 */
	copyFromAddressId: string;

	address: string;
	city?: string;
	state?: string;
	country?: string;
	pincode?: string;
	region?: string;
	zone?: string;
	branch?: string;

	latitude?: string;
	longitude?: string;

	email?: string;
	phoneNumber?: string;
	website?: string;

	isDefault: boolean;
};

export type BusinessPartnerAddressPayload = {
	addressType: BusinessPartnerAddressType;
	address: string;
	label?: string | null;
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

export type BusinessPartnerFormState = {
	internalId: string;
	vendorId: string;
	bpId: string;
	s4Id: string;
	bydId: string;
	c4cId: string;

	bpName: string;
	bpShortName: string;
	legalTradeName: string;

	gst: string;
	panNumber: string;
	vendorCode: string;

	officeType: BusinessPartnerOfficeType | "";
	bpType: BusinessPartnerType | "";
	entityType: BusinessPartnerEntityType | "";

	isKeyAccount: boolean;
	isActive: boolean;

	joinedOn: string;
	parentId: string;

	// Contact Information
	mobileNumber: string;
	email: string;
	fax: string;
	telephone: string;
	// mainContactName: string;
	// mainContactNumber: string;
};

export type CreateBusinessPartnerPayload = {
	internalId: string;
	vendorId: string | null;
	bpId: string | null;
	s4Id: string | null;
	bydId: string | null;
	c4cId: string | null;

	bpName: string;
	bpShortName: string | null;
	legalTradeName: string | null;

	gst: string | null;
	panNumber: string | null;
	vendorCode: string | null;

	officeType: BusinessPartnerOfficeType;
	bpType: BusinessPartnerType;
	entityType: BusinessPartnerEntityType | null;

	isKeyAccount: boolean;
	isActive: boolean;

	joinedOn: string | null;
	parentId: string | null;

	// Contact Information
	mobileNumber: string | null;
	email: string | null;
	fax: string | null;
	telephone: string | null;
	// mainContactName: string | null;
	// mainContactNumber: string | null;
};

export type UpdateBusinessPartnerPayload =
	Partial<CreateBusinessPartnerPayload>;

export type BusinessPartnerGeneralInfoFormState = {
	internalId?: string;
	vendorId?: string;
	bpId?: string;
	s4Id?: string;
	bydId?: string;
	c4cId?: string;
	bpName: string;
	bpShortName: string;
	officeType: BusinessPartnerOfficeType | "";
	bpType: BusinessPartnerType | "";
	isKeyAccount: boolean;
	isActive: boolean;
	parentId: string;
};

export type BusinessPartnerOrganizationInfoFormState = {
	legalTradeName: string;
	gst: string;
	panNumber: string;
	vendorCode: string;
	entityType: BusinessPartnerEntityType | "";
	joinedOn: string;
};
