import { useCallback, useMemo } from "react";

import type { Permission } from "../context/Auth/AuthContext";
import { useAuth } from "../context/Auth/useAuth";

export type AppInfo = Pick<Permission, "appId" | "appName" | "appKey">;

/**
 * Collapse permission rows into one entry per app.
 *
 * The backend returns a row per action × module, so the same appId shows up
 * many times. The first row seen for an app wins (name/key are identical
 * across rows for the same app anyway).
 */
export const buildAppLookup = (
	permissions: Permission[] = [],
): Map<string, AppInfo> => {
	const lookup = new Map<string, AppInfo>();

	for (const { appId, appName, appKey } of permissions) {
		if (!appId || lookup.has(appId)) continue;
		lookup.set(appId, { appId, appName, appKey });
	}

	return lookup;
};

/** Find the app entry for an appId, or undefined if the user has no access to it. */
export const findAppById = (
	permissions: Permission[] = [],
	appId?: string | null,
): AppInfo | undefined => {
	if (!appId) return undefined;

	const match = permissions.find((permission) => permission.appId === appId);
	return match
		? { appId: match.appId, appName: match.appName, appKey: match.appKey }
		: undefined;
};

/** Resolve an app's display name from its id. */
export const getAppNameById = (
	permissions: Permission[] = [],
	appId?: string | null,
	fallback = "",
): string => findAppById(permissions, appId)?.appName ?? fallback;

/** Resolve an app's key (e.g. "MAP") from its id. */
export const getAppKeyById = (
	permissions: Permission[] = [],
	appId?: string | null,
	fallback = "",
): string => findAppById(permissions, appId)?.appKey ?? fallback;

/**
 * Hook version — reads permissions from useAuth and memoises the lookup,
 * so repeated calls (e.g. per table row) are O(1).
 */
export const useAppLookup = () => {
	const { permissions } = useAuth();

	const lookup = useMemo(() => buildAppLookup(permissions), [permissions]);

	const getApp = useCallback(
		(appId?: string | null) => (appId ? lookup.get(appId) : undefined),
		[lookup],
	);

	const getAppName = useCallback(
		(appId?: string | null, fallback = "") =>
			getApp(appId)?.appName ?? fallback,
		[getApp],
	);

	const getAppKey = useCallback(
		(appId?: string | null, fallback = "") => getApp(appId)?.appKey ?? fallback,
		[getApp],
	);

	return { lookup, getApp, getAppName, getAppKey };
};
