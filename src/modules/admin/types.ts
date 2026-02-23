import type { TableUserStatus } from "../../components/common/Badge";

export interface UserProfileTableRow {
	id: number;
	name: string;
	designation: string;

	modules: {
		moduleName: string;
		permissions: Permission[];
	}[];

	status: TableUserStatus;
}

export type Permission = "read" | "write" | "delete";
export interface ModuleDTO {
	key: string;
	name: string;
}
export interface AppDTO {
	key: string;
	name: string;
	enabled: boolean;
	modules: ModuleDTO[];
}
export interface ProfilePermissionDTO {
	moduleKey: string;
	permissions: Permission[];
}
export interface CreateUserProfileRequestDTO {
	workSpaceName: string;
	apps: AppDTO[];
	profiles: ProfilePermissionDTO[];
}

export interface CreateUserProfileFormState {
	workSpaceName: string;
	selectedApps: {
		appKey: string;
		enabled: boolean;
		modules: {
			moduleKey: string;
			permissions: Permission[];
		}[];
	}[];
}
