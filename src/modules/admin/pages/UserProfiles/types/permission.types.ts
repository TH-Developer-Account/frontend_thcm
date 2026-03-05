export type Action = "read" | "write";

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

export interface BackendPermission {
	action: Action;
	appKey: string;
	moduleKey: string;
}

export interface BackendPermissionsResponse {
	isSuperAdmin: boolean;
	permissions: BackendPermission[];
}

/* UI state */

export type PermissionState = Record<
	string,
	Record<string, { read: boolean; write: boolean }>
>;
