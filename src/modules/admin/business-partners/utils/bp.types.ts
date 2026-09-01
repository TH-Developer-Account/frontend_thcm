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
