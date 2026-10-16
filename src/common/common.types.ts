export const USERS_URL = "/users";

export type UserApiResponse = {
	id: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	phone_number?: string;
};
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
export interface AuthUser {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	role?: "ADMIN" | "DEALER" | "EMPLOYEE" | undefined;
	profile_image?: string;
	designation?: string;
	department?: string;
	zone?: string;
	branch?: string;
}
