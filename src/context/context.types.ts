import type { User, Permission, PermissionAction } from "./Auth/AuthContext";

export type { Permission, PermissionAction };

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
};

export type LoginSuccessResponse = {
  message: string;
  requiresPasswordReset: boolean;
  user: User;
  accessToken?: string; // may be absent in reset flow
  permissions?: {
    isSuperAdmin: boolean;
    permissions: Permission[]; // ✅ reuses the canonical type — no more duplicated inline shape
  };
  workspaceId: string;
};

export type ResetPwdSuccessResponse = {
  message: string;
};

export type LogOutSuccessResponse = {
  message: string;
};
