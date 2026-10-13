import type {
  AccessSession,
  User,
  Permission,
  PermissionAction,
} from "./Auth/AuthContext";

export type { AccessSession, Permission, PermissionAction };

export type ApiErrorResponse = {
  success: false;
  statusCode: number;
  message: string;
};

export type LoginSuccessResponse = {
  message: string;
  requiresPasswordReset: boolean;
  user: User;
  accessToken?: string; // absent in the password-reset flow
  permissions?: AccessSession;
  workspaceId: string;
};

export type ResetPwdSuccessResponse = {
  message: string;
};

export type LogOutSuccessResponse = {
  message: string;
};
