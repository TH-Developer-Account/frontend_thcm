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
	role: string;
	status: string;
	color: string;
	assignedUsers: string[];

	// UI permission model
	permissions: Record<
		string,
		{
			read: boolean;
			write: boolean;
		}
	>;

	createdAt: string;
	updatedAt: string;
}

export type Profiles = {
	name?: string;
	description?: string;
	status?: string;
	count?: number;
};

export type PermissionAction = "read" | "write";

export type ScopeType = "WORKSPACE" | "APP" | "MODULE";

export interface PermissionDTO {
	action: PermissionAction;
	scopeType: ScopeType;
	appKey?: string;
	moduleKey?: string;
}

export interface AppModule {
	key: string;
	name: string;
}

export interface WorkspaceApp {
	key: string;
	name: string;
	enabled: boolean;
	modules: AppModule[];
}

export interface ProfileDTO {
	name: string;
	description: string;
	permissions: PermissionDTO[];
}

export interface WorkspacePayload {
	workSpaceName: string;
	apps: WorkspaceApp[];
	profiles: ProfileDTO[];
}
