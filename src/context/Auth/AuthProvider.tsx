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

// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [isSuperAdmin, setSuperAdmin] = useState(false);

	const { showToast } = useToast();

	const hydrateSession = useCallback(async () => {
		const { data } = await ServerAxios.get("/users/me");

		setUser(data.user);
		setWorkspaceId(data.workspaceId);
		setSuperAdmin(data.permissions?.isSuperAdmin ?? false);
		setPermissions(data.permissions?.permissions ?? []);
	}, []);

	// ── On mount: restore session if token exists ──────────────────────────
	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem("authToken");
			if (token) {
				try {
					await hydrateSession();
				} catch (error) {
					localStorage.removeItem("authToken");
					console.log("ERROR====>", error);
				} finally {
					setIsLoading(false);
				}
			}
		};

		checkAuth();
	}, [hydrateSession]);

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

			setSuperAdmin(data.permissions?.isSuperAdmin ?? false);
			setPermissions(data.permissions?.permissions ?? []);

			showToast({
				type: "success",
				title: "Success",
				description: data.message || "Successfully logged in",
			});

			return { requiresPasswordReset: false };
		} catch (err) {
			const { title, description } = resolveAuthError(err, "Login failed");

			showToast({
				type: "error",
				title,
				description,
			});

			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── resetPassword (unchanged control flow — error messaging updated) ────

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

			const { title, description } = resolveAuthError(
				err,
				"Unable to reset password",
			);

			showToast({
				type: "error",
				title,
				description,
			});
		}
	};

	// ── Logout (unchanged + clears permissions) ─────────────────────────────

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

			showToast({
				type: "error",
				title,
				description,
			});

			console.error("Logout error", error);
		} finally {
			localStorage.removeItem("authToken");
			setUser(null);
			setPermissions([]);
			setSuperAdmin(false);
			window.location.href = "/web/login";
		}
	};

	// ── Permission functions (memoised) ─────────────────────────────────────

	const can = useCallback(
		(action: "read" | "write", appKey: string, moduleKey: string) =>
			resolvePermission(permissions, isSuperAdmin, action, appKey, moduleKey),
		[permissions, isSuperAdmin],
	);

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
				user,
				login,
				logout,
				isLoading,
				resetPassword,
				setUser,
				isSuperAdmin,
				permissions,
				adminApps,
				can,
				canReadApp,
				canWriteApp,
				canManageApp,
				workspaceId,
				hydrateSession,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
