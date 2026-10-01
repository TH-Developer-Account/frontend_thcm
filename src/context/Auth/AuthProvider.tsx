import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import type { ReactNode } from "react";

import { AuthContext, useToast } from "./AuthContext";
import type { AccessSession, User } from "./AuthContext";
import {
  EMPTY_ACCESS_SESSION,
  canAccessAdministration,
  hasAppAction,
  hasModulePermission,
  isAppAdministrator,
  listAccessibleApps,
} from "./accessPolicy";
import { ServerAxios, API_BASE_URL } from "../../services/ServerAxios";
import { api_routes } from "../../containers/Login/constant";
import type { ApiErrorResponse, LoginSuccessResponse } from "../context.types";

interface AuthProviderProps {
  children: ReactNode;
}

type ResolvedAuthError = { title: string; description: string };

function resolveAuthError(
  error: unknown,
  fallbackTitle: string,
): ResolvedAuthError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return { title: fallbackTitle, description: "Please try again." };
  }

  const status = error.response?.status;
  const backendMessage = error.response?.data?.message;

  if (!error.response) {
    return {
      title: "Network error",
      description: "Check your connection and try again.",
    };
  }

  if (status === 401) {
    return {
      title: "Invalid email or password",
      description: "Please check your email and password and try again.",
    };
  }

  if (status === 403) {
    return {
      title: "Access denied",
      description:
        backendMessage || "Your account doesn't have access to do that.",
    };
  }

  if (status === 429) {
    return {
      title: "Too many attempts",
      description:
        backendMessage || "Please wait a moment before trying again.",
    };
  }

  if (status && status >= 500) {
    return {
      title: "Server error",
      description:
        backendMessage ||
        "Something went wrong on our end. Please try again shortly.",
    };
  }

  return {
    title: fallbackTitle,
    description: backendMessage || "Please try again.",
  };
}

function toAccessSession(permissions: Partial<AccessSession> | undefined) {
  return {
    isSuperAdmin: permissions?.isSuperAdmin ?? false,
    administeredApps: permissions?.administeredApps ?? [],
    permissions: permissions?.permissions ?? [],
  };
}

const hasStoredToken = () => Boolean(localStorage.getItem("authToken"));

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [accessSession, setAccessSession] =
    useState<AccessSession>(EMPTY_ACCESS_SESSION);
  // Starts true when a token exists so route guards wait for /users/me
  // instead of redirecting to /forbidden during the first render.
  const [isLoading, setIsLoading] = useState(hasStoredToken);

  const { showToast } = useToast();

  const clearSession = useCallback(() => {
    setUser(null);
    setWorkspaceId(null);
    setAccessSession(EMPTY_ACCESS_SESSION);
  }, []);

  const hydrateSession = useCallback(async () => {
    const { data } = await ServerAxios.get("/users/me");

    setUser(data.user);
    setWorkspaceId(data.workspaceId);
    setAccessSession(toAccessSession(data.permissions));
  }, []);

  useEffect(() => {
    if (!hasStoredToken()) return;

    hydrateSession()
      .catch(() => localStorage.removeItem("authToken"))
      .finally(() => setIsLoading(false));
  }, [hydrateSession]);

  // The API rebuilds permissions on every request; refreshing on focus lets
  // the UI catch up when an admin grants or revokes access in another tab.
  useEffect(() => {
    const refreshOnFocus = () => {
      if (hasStoredToken()) hydrateSession().catch(() => undefined);
    };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [hydrateSession]);

  type LoginResult = {
    requiresPasswordReset: boolean;
  };

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      setIsLoading(true);
      const { data } = await ServerAxios.post<LoginSuccessResponse>(
        `${API_BASE_URL}${api_routes.login_api_route}`,
        { email, password },
      );

      if (data.requiresPasswordReset) {
        setUser(data.user);

        showToast({
          type: "warning",
          title: "Action required",
          description: data.message || "Please reset your password to log in",
        });

        return { requiresPasswordReset: true };
      }

      if (data.accessToken) {
        localStorage.setItem("authToken", data.accessToken);
      }

      setUser(data.user);
      setWorkspaceId(data.workspaceId);
      setAccessSession(toAccessSession(data.permissions));

      showToast({
        type: "success",
        title: "Success",
        description: data.message || "Successfully logged in",
      });

      return { requiresPasswordReset: false };
    } catch (err) {
      const { title, description } = resolveAuthError(err, "Login failed");
      showToast({ type: "error", title, description });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      await ServerAxios.post(
        `${API_BASE_URL}${api_routes.reset_password_api_route}`,
        {
          email: user?.email,
          currentPassword,
          newPassword,
        },
      );
      showToast({
        type: "success",
        title: "Success",
        description: "Password reset successfully",
      });
      clearSession();
    } catch (err) {
      const { title, description } = resolveAuthError(
        err,
        "Unable to reset password",
      );
      showToast({ type: "error", title, description });
    }
  };

  const logout = async () => {
    try {
      const { data } = await ServerAxios.post("/auth/logout");
      showToast({
        type: "success",
        title: "Success",
        description: data.message || "Successfully Logged out",
      });
    } catch (error) {
      const { title, description } = resolveAuthError(error, "Logout failed");
      showToast({ type: "error", title, description });
    } finally {
      localStorage.removeItem("authToken");
      clearSession();
      window.location.href = "/web/login";
    }
  };

  const can = useCallback(
    (action: "read" | "write", appKey: string, moduleKey: string) =>
      hasModulePermission(accessSession, action, appKey, moduleKey),
    [accessSession],
  );

  const canReadApp = useCallback(
    (appKey: string) => hasAppAction(accessSession, appKey, "read"),
    [accessSession],
  );

  const canWriteApp = useCallback(
    (appKey: string) => hasAppAction(accessSession, appKey, "write"),
    [accessSession],
  );

  const canManageApp = useCallback(
    (appKey: string) => isAppAdministrator(accessSession, appKey),
    [accessSession],
  );

  const accessibleApps = useMemo(
    () => listAccessibleApps(accessSession),
    [accessSession],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        resetPassword,
        setUser,
        workspaceId,
        hydrateSession,
        isSuperAdmin: accessSession.isSuperAdmin,
        permissions: accessSession.permissions,
        administeredApps: accessSession.administeredApps,
        accessibleApps,
        can,
        canReadApp,
        canWriteApp,
        canManageApp,
        canAccessAdministration: canAccessAdministration(accessSession),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
