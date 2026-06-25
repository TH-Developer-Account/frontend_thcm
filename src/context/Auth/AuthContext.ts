import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ToastInput } from "../../components/common/Toast/toast.types";

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	role?: "ADMIN" | "DEALER" | "EMPLOYEE" | undefined;
	profile_image?: string;
}

export interface ToastContextType {
	showToast: ShowToastFn;
}

// ── NEW: Permission types ─────────────────────────────────────────────────────

export type PermissionAction = "read" | "write";

// No ScopeType needed — every permission is always module-scoped.
// appKey and moduleKey are always present, never null.
export interface Permission {
	action: PermissionAction;
	appKey: string;
	moduleKey: string;
	appId?: string;
}

// ── Updated AuthContextType ───────────────────────────────────────────────────
// Everything from before is unchanged.
// Three permission-related fields added at the bottom.

export interface AuthContextType {
	// ── Existing (untouched) ──────────────────────────────────────────
	user: User | null;
	login: (
		email: string,
		password: string,
	) => Promise<{ requiresPasswordReset: boolean }>;
	logout: () => void;
	resetPassword: (currentPassword: string, newPassword: string) => void;
	isLoading: boolean;
	setUser: Dispatch<SetStateAction<User | null>>;

	// ── New ───────────────────────────────────────────────────────────
	isSuperAdmin: boolean;
	permissions: Permission[];

	// can("write", "MAP", "EPC") → true / false
	can: (action: PermissionAction, appKey: string, moduleKey: string) => boolean;

	// canReadApp / canWriteApp → used in sidebar to show/hide app tabs
	canReadApp: (appKey: string) => boolean;
	canWriteApp: (appKey: string) => boolean;
	workspaceId: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────

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

// ── NEW: useAuth hook ─────────────────────────────────────────────────────────
// Centralised here so every component imports from one place.
// Before this you may have been accessing AuthContext directly —
// replace those with useAuth() going forward.

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
};
