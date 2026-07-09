export type TableUserStatus = "Active" | "Blocked" | "Inactive";

export interface TableUser {
	id: number;
	name: string;
	email: string;
	phone: string;
	company: string;
	role: string;
	status: string;
	avatar: string;
}
export const statusStyles: Record<TableUserStatus, string> = {
	Active: "bg-green-100 text-green-700",
	// active: "bg-green-100 text-green-700",
	Inactive: "bg-amber-100 text-amber-700",
	// inactive: "bg-amber-100 text-amber-700",
	Blocked: "bg-red-100 text-red-600",
	// blocked: "bg-red-100 text-red-600",
};
// utils/types/api.types.ts

export type ApiErrorResponse = {
	success: boolean;
	statusCode: number;
	message: string;
	errors?: Record<string, string[]>;
};
