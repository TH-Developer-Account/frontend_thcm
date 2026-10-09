import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ToastInput } from "../Toast/toast.types";

export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	role?: "ADMIN" | "DEALER" | "EMPLOYEE" | undefined;
	profile_image?: string;
	designation?: string;
	department?: string;
}

export interface ToastContextType {
	showToast: ShowToastFn;
}

export type PermissionAction = "read" | "write";

export type AppSummary = {
	appId: string;
	appKey: string;
	appName: string;
};

// One module grant from the user's profile in that app. Admin rights are not
// a permission row; they arrive separately as administeredApps.
export type Permission = AppSummary & {
	action: PermissionAction;
	moduleKey: string;
};

// Mirrors the backend's AccessActor, so the same rules can run on both sides.
export type AccessSession = {
	isSuperAdmin: boolean;
	administeredApps: AppSummary[];
	permissions: Permission[];
};

export interface AuthContextType {
	user: User | null;
	login: (
		email: string,
		password: string,
	) => Promise<{ requiresPasswordReset: boolean }>;
	logout: () => void;
	resetPassword: (currentPassword: string, newPassword: string) => void;
	isLoading: boolean;
	setUser: Dispatch<SetStateAction<User | null>>;
	workspaceId: string | null;
	hydrateSession: () => Promise<void>;

	isSuperAdmin: boolean;
	permissions: Permission[];
	administeredApps: AppSummary[];
	accessibleApps: AppSummary[];

	can: (action: PermissionAction, appKey: string, moduleKey: string) => boolean;
	canReadApp: (appKey: string) => boolean;
	canWriteApp: (appKey: string) => boolean;
	canManageApp: (appKey: string) => boolean;
	canAccessAdministration: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

export type ShowToastFn = (toast: ToastInput) => void;

export const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error("useToast must be used inside ToastProvider");
	return ctx;
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
};
