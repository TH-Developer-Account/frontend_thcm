export const USERS_URL = "/users";

export type User = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	designation?: string;
	department?: string;
	manager?: string;
	profilePictureUrl?: string;
	fullName?: string;
};
