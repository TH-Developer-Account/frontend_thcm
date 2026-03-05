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

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  //   jobRole: string;
  phone: string;
};
export type UserResponse = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  //   TJOB_UUID: string;
  phone_number: string;
};
export const mapUser = (emp: UserResponse): User => ({
  id: emp.id,
  firstName: emp.first_name,
  lastName: emp.last_name,
  email: emp.email,
  //   jobRole: emp.TJOB_UUID,
  phone: emp.phone_number,
});

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
