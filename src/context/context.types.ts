import type { User } from "./Auth/AuthContext";

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
};

export type PermissionAction = "read" | "write";
export type ScopeType = "WORKSPACE" | "APP" | "MODULE";

export interface Permission {
  action: PermissionAction;
  scopeType: ScopeType;
  appKey: string;
  moduleKey: string;
}

export type LoginSuccessResponse = {
  message: string;
  requiresPasswordReset: boolean;
  user: User;
  accessToken?: string; // may be absent in reset flow
  permissions?: {
    isSuperAdmin: boolean;
    permissions: Array<{
      scopeType: ScopeType;
      appKey: string;
      moduleKey: string;
      action: PermissionAction;
    }>;
  };
  workspace: {
    id: string;
    isSuperAdmin: boolean;
  };
};

export type ResetPwdSuccessResponse = {
  message: string;
};

export type LogOutSuccessResponse = {
  message: string;
};
