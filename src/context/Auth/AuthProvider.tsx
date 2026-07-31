import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext, useToast } from "./AuthContext";
import type { ReactNode } from "react";
import type { User } from "./AuthContext";
import type { Permission } from "../context.types";
import { ServerAxios, API_BASE_URL } from "../../services/ServerAxios";
import { api_routes } from "../../containers/Login/constant";
import {
  type ApiErrorResponse,
  type LoginSuccessResponse,
} from "../context.types";

interface AuthProviderProps {
  children: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure permission resolvers — live outside the component so they're never
// recreated. Mirror the backend's userPermission.ts functions exactly:
// hasPermission() and canManageApp() respectively.
// ─────────────────────────────────────────────────────────────────────────────

function resolvePermission(
  permissions: Permission[],
  isSuperAdmin: boolean,
  action: "read" | "write",
  appKey: string,
  moduleKey: string,
): boolean {
  if (isSuperAdmin) return true;

  const hasExactModuleGrant = permissions.some(
    (p) =>
      p.scope === "MODULE" &&
      p.action === action &&
      p.appKey === appKey &&
      p.moduleKey === moduleKey,
  );
  if (hasExactModuleGrant) return true;

  // App-admin fallback — a "write" app-scope grant covers every module
  // under that app, same as the backend's hasPermission().
  return permissions.some(
    (p) => p.scope === "APP" && p.appKey === appKey && p.action === "write",
  );
}

function resolveCanManageApp(
  permissions: Permission[],
  isSuperAdmin: boolean,
  appKey: string,
): boolean {
  if (isSuperAdmin) return true;

  return permissions.some(
    (p) => p.scope === "APP" && p.appKey === appKey && p.action === "write",
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── NEW state ─────────────────────────────────────────────────────────────
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isSuperAdmin, setSuperAdmin] = useState(false);

  const { showToast } = useToast();

  // ── On mount: restore session if token exists (unchanged logic) ───────────
  // The only addition: applyPermissions() is also called on success.
  // Your /users/me response must include permissions — see note below.
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          const { data } = await ServerAxios.get("/users/me");
          setUser(data.user);
          setWorkspaceId(data.workspaceId);

          // ── NEW: apply permissions from /users/me response ──────────────
          // Your /users/me endpoint should return the same permissions shape
          // as /auth/login. If it currently only returns { user }, add this
          // to the backend response:
          //   permissions: { isSuperAdmin: bool, permissions: [...] }
          setSuperAdmin(data.permissions?.isSuperAdmin ?? false);
          setPermissions(data.permissions?.permissions ?? []);
        } catch (error) {
          localStorage.removeItem("authToken");
          console.log("ERROR====>", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, []);

  // ── Login (existing logic untouched, permissions added at the end) ─────────

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

      // 🔐 Password reset required (unchanged)
      if (data.requiresPasswordReset) {
        setUser(data.user);

        showToast({
          type: "warning",
          title: "Action required",
          description: data.message || "Please reset your password to log in",
        });

        return { requiresPasswordReset: true };
      }

      // ✅ Normal successful login (unchanged)
      if (data.accessToken) {
        localStorage.setItem("authToken", data.accessToken);
      }

      setUser(data.user);
      setWorkspaceId(data.workspaceId);

      // ── NEW: store permissions from login response ──────────────────────
      setSuperAdmin(data.permissions?.isSuperAdmin ?? false);
      setPermissions(data.permissions?.permissions ?? []);

      showToast({
        type: "success",
        title: "Success",
        description: data.message || "Successfully logged in",
      });

      return { requiresPasswordReset: false };
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        showToast({
          type: "error",
          title: "Login failed",
          description: err.response?.data?.message || "",
        });
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ── resetPassword (completely unchanged) ──────────────────────────────────

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
      setUser(null);
      setWorkspaceId(null);
      setPermissions([]);
    } catch (err) {
      console.log("Error while resetting password=====>", err);
      showToast({
        type: "error",
        title: "Error",
        description: "Something was wrong, try again later",
      });
    }
  };

  // ── Logout (unchanged + clears permissions) ───────────────────────────────

  const logout = async () => {
    try {
      const { data } = await ServerAxios.post("/auth/logout");
      showToast({
        type: "success",
        title: "Success",
        description: data.message || "Successfully Logged out",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        description: "Could not log out",
      });
      console.error("Logout error", error);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
      // ── NEW: clear permissions on logout ─────────────────────────────────
      setPermissions([]);
      setSuperAdmin(false);
      window.location.href = "/login";
    }
  };

  // ── NEW: permission functions (memoised — stable refs across renders) ──────

  const can = useCallback(
    (action: "read" | "write", appKey: string, moduleKey: string) =>
      resolvePermission(permissions, isSuperAdmin, action, appKey, moduleKey),
    [permissions, isSuperAdmin],
  );

  // Returns true if user has READ access to any module in the app, OR is
  // that app's admin (an app-scope write grant implies read — there's no
  // separate read-only app-scope row, so this needs its own fallback).
  // Used in sidebars to decide whether to show the app tab at all.
  const canReadApp = useCallback(
    (appKey: string) => {
      if (isSuperAdmin) return true;
      return permissions.some(
        (p) =>
          (p.scope === "MODULE" &&
            p.action === "read" &&
            p.appKey === appKey) ||
          (p.scope === "APP" && p.appKey === appKey && p.action === "write"),
      );
    },
    [permissions, isSuperAdmin],
  );

  const canWriteApp = useCallback(
    (appKey: string) => {
      if (isSuperAdmin) return true;
      // True if user has WRITE on at least one module in this app, OR is
      // that app's admin (scope APP rows already have appKey + action
      // "write" set, so this check already covers them without changes).
      return permissions.some(
        (p) => p.action === "write" && p.appKey === appKey,
      );
    },
    [permissions, isSuperAdmin],
  );

  const canManageApp = useCallback(
    (appKey: string) => resolveCanManageApp(permissions, isSuperAdmin, appKey),
    [permissions, isSuperAdmin],
  );

  // Flat list of appKeys this user administers — recomputed only when
  // permissions actually change, not on every render or per-call like
  // canManageApp(). isSuperAdmin isn't folded in here on purpose: a super
  // admin manages every app, which would mean enumerating every app key
  // that exists just to populate this array — components that need
  // "does this user manage app X" should call canManageApp(appKey)
  // (which DOES account for isSuperAdmin), not adminApps.includes(appKey).
  const adminApps = useMemo(
    () =>
      permissions
        .filter((p) => p.scope === "APP" && p.action === "write")
        .map((p) => p.appKey),
    [permissions],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        // Existing
        user,
        login,
        logout,
        isLoading,
        resetPassword,
        setUser,
        // New
        isSuperAdmin,
        permissions,
        adminApps,
        can,
        canReadApp,
        canWriteApp,
        canManageApp,
        workspaceId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
