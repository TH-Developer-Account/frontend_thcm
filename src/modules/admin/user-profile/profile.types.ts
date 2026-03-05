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

export interface WorkspaceAccess {
	id: string;
	name: string;
	apps: AppAccess[];
}

export interface AppAccess {
	key: string;
	name: string;
	enabled: boolean;
	modules: ModuleAccess[];
}

export interface ModuleAccess {
	key: string;
	name: string;
	profiles: ProfileAccess[];
}

export interface ProfileAccess {
	id: string;
	permissions: Permission[];
}

export type Permission = "read" | "write" | string;
