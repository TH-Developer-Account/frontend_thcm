import type { User } from "./Auth/AuthContext";

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
};

export type ResetPwdSuccessResponse = {
  message: string;
};

export type LogOutSuccessResponse = {
  message: string;
};
