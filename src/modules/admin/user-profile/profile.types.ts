export type RoleType =
	| "admin"
	| "manager"
	| "analyst"
	| "executive"
	| "agent"
	| "viewer";

export type PermissionFlag = {
	read: boolean;
	write: boolean;
};

export type PermissionMap = Record<string, PermissionFlag>;

export interface Profile {
	id: string;
	name: string;
	description: string;
	role: RoleType;
	status: "active" | "inactive";
	color: string;
	assignedUsers: string[];
	permissions: PermissionMap;
	createdAt: string;
	updatedAt: string;
}
