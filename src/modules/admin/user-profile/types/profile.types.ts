export type Permission = "read" | "write";

export type PermissionFlag = {
  read: boolean;
  write: boolean;
};

// moduleKey → flags, for the single app a profile belongs to.
export type ModulePermissionState = Record<string, PermissionFlag>;

export type ModuleDefinition = {
  key: string;
  name: string;
};

export type AppDefinition = {
  appId: string;
  appKey: string;
  appName: string;
  modules: ModuleDefinition[];
};

export type ProfilePermission = {
  action: Permission;
  moduleKey: string;
  moduleName: string;
};

export type ProfilePermissionInput = {
  action: Permission;
  moduleKey: string;
};

export type ProfileAssignee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

export interface Profile {
  id: string;
  name: string;
  description: string | null;
  isSystemProfile: boolean;
  appKey: string;
  appName: string;
  assignedUserCount: number;
  users: ProfileAssignee[];
  permissions: ProfilePermission[];
}

export type ProfileFormValues = {
  appKey: string;
  name: string;
  description: string;
};

export type ProfileAssignmentResult = {
  assignedCount: number;
  replacedCount: number;
  removedCount: number;
};

// Used by workflow.api.ts for approver pickers.
export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation?: string | null;
};

export type UserResponse = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  designation?: string | null;
  phone?: string | null;
};

export const mapUser = (employee: UserResponse): User => ({
  id: employee.id,
  firstName: employee.first_name,
  lastName: employee.last_name,
  email: employee.email,
  phone: employee.phone_number,
});
