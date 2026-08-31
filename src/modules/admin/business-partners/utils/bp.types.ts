export type User = {
	id: string;
	name: string;
	email: string;
	number: string;
	department?: string;
};

export type MainContact = User & {
	isDefault?: boolean;
};

export type BusinessPartnerFilters = {
	status: string[];
	zone: string[];
};
export type BusinessPartner = {
	id: string;
	internalId: string;
	externalId: string;
	organizationName: string;
	region: string;
	mainContact: string;
	address: string;
	joinedOn: string;
};
export type PdfUrlResponse = {
	success: boolean;
	url: string;
};
export type ApiDataResponse<T> = {
	success: boolean;
	data: T;
};

export type BusinessPartnerListingParams = {
	search?: string;
	status?: string[];
	zone?: string[];
	pageIndex?: number;
	pageSize?: number;
};

export type BusinessPartnerListingResult = {
	rows: BusinessPartner[] | [];
	totalCount: number | null;
	pageIndex: number | null;
	pageSize: number | null;
};

export type BusinessPartnerListingApiResponse = {
	success?: boolean;
	data?: BusinessPartner[];
	rows?: BusinessPartner[];
	total?: number;
	totalCount?: number;
	page_index?: number;
	page_size?: number;
};
export type BusinessPartnerListResponse =
	| BusinessPartnerListingApiResponse
	| BusinessPartner[]
	| {
			success?: boolean;
			data?: BusinessPartner[];
			rows?: BusinessPartner[];
			total?: number;
			totalCount?: number;
			page_index?: number;
			page_size?: number;
	  };
