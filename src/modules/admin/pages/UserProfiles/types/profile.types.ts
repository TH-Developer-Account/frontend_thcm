import { type WorkspaceApp } from "./permission.types";

export interface Profile {
	id: string;
	name: string;
	description: string;
}

export interface WorkspacePayload {
	workSpaceName: string;
	apps: WorkspaceApp[];
	profiles: ProfilePayload[];
}

export interface ProfilePayload {
	name: string;
	description: string;
	permissions: PermissionDTO[];
}

export interface PermissionDTO {
	action: "read" | "write";
	scopeType: "WORKSPACE" | "APP";
	appKey?: string;
}
