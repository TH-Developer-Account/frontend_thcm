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

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export interface Profile {
  id: string;
  assignedUserCount: number;
  isSystemProfile: boolean;
  name: string;
  description: string;
  users: User[];
  permissions: ApiPermission[];
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

export type Permission = "read" | "write";

export type WorkspacePermission = {
  appKey: string;
  moduleKey: string;
  action: Permission;
};

export type WorkspacePayload = WorkspacePermission[];

export interface ApiPermission {
  appKey: string;
  moduleKey: string;
  action: Permission;
}

export type PermissionFlags = {
  read: boolean;
  write: boolean;
};

export type PermState = Record<string, Record<string, PermissionFlags>>;

export type Action = "read" | "write";

export interface Module {
  key: string;
  name: string;
}

export interface AppItem {
  key: string;
  name: string;
  modules: Module[];
}
