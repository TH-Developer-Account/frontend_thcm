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
