// modules/users/types.ts

export type UserStatus =
	| "Active"
	| "Inactive"
	| "Pending"
	| "Disabled"
	| "Blocked";

export interface ApiUser {
	id: string | number;
	name: string;
	email: string;
	phone: string;
	company: string;
	role: string;
	status: UserStatus;
	avatar: string;
}
export interface Dealer {
	id: number;
	dealerName: string;
	dealerCode: string;
	location: string;
	state: string;
	region: string;
	contactPerson: string;
	contactNumber: string;
	status: "Active" | "Inactive" | "Blocked";
}

export const statusStyles: Record<UserStatus, string> = {
	Active: "bg-green-100 text-green-700",
	Inactive: "bg-yellow-100 text-yellow-700",
	Pending: "bg-blue-100 text-blue-700",
	Disabled: "bg-gray-200 text-gray-600",
	Blocked: "bg-gray-200 text-gray-600",
};
