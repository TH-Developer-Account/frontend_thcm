// usePermissionMatrix.ts
// -----------------------------------------------------------------
// Custom hook that manages ALL permission state logic.
// Keeps component clean and reusable.
// Syncs permissions when editing an existing profile.
// -----------------------------------------------------------------

import { useState, useEffect } from "react";
import { apps } from "../constant";
import { buildPermStateFromApi } from "../utils/permissions";
import {
	getEmptyPermFlags,
	areAllEnabled,
	areAllActionEnabled,
	areSomeActionEnabled,
} from "../utils/permission.utils";

import type {
	Permission,
	PermissionFlag,
	PermState,
	WorkspacePermission,
} from "../types/profile.types";

/** --------------------------------------------------------
 * Build base permission matrix from app configuration
 * -------------------------------------------------------- */
const buildBasePermState = (): PermState =>
	Object.fromEntries(
		apps.map((app) => [
			app.key,
			Object.fromEntries(
				app.modules.map((mod) => [mod.key, getEmptyPermFlags()]),
			),
		]),
	);

/** --------------------------------------------------------
 * Merge API permissions into base matrix
 * -------------------------------------------------------- */
const initializePermState = (
	existingPermissions: WorkspacePermission[],
): PermState => {
	const base = buildBasePermState();

	if (!existingPermissions?.length) return base;

	const fromApi = buildPermStateFromApi(existingPermissions);

	for (const appKey in fromApi) {
		if (!base[appKey]) continue;

		for (const modKey in fromApi[appKey]) {
			if (!base[appKey][modKey]) continue;

			base[appKey][modKey] = fromApi[appKey][modKey];
		}
	}

	return base;
};

/** =========================================================
 * MAIN HOOK
 * ========================================================= */
export const usePermissionMatrix = (permissions: WorkspacePermission[]) => {
	/** --------------------------------------------------------
	 * Permission Matrix State
	 * -------------------------------------------------------- */
	const [permState, setPermState] = useState<PermState>(() =>
		initializePermState(permissions),
	);

	/** --------------------------------------------------------
	 * 🔥 Sync permissions when editing profile
	 * -------------------------------------------------------- */
	useEffect(() => {
		if (!permissions) return;

		const updated = initializePermState(permissions);
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setPermState(updated);
	}, [permissions]);

	/** --------------------------------------------------------
	 * Toggle Single Permission (read / write)
	 * -------------------------------------------------------- */
	const togglePerm = (app: string, mod: string, action: Permission) => {
		if (!permState?.[app]?.[mod]) return;

		setPermState((prev) => {
			const current = prev[app][mod];

			let updated = { ...current };

			/** Write requires read */
			if (action === "write") {
				const nextWrite = !current.write;

				updated = {
					read: nextWrite ? true : current.read,
					write: nextWrite,
				};
			}

			/** Removing read removes write */
			if (action === "read") {
				const nextRead = !current.read;

				updated = {
					read: nextRead,
					write: nextRead ? current.write : false,
				};
			}

			return {
				...prev,
				[app]: {
					...prev[app],
					[mod]: updated,
				},
			};
		});
	};

	/** --------------------------------------------------------
	 * Toggle Entire App (all modules)
	 * -------------------------------------------------------- */
	const toggleAppAll = (app: string) => {
		setPermState((prev) => {
			const modules = prev[app];
			if (!modules) return prev;

			const next = !areAllEnabled(modules);

			const updated = Object.fromEntries(
				Object.keys(modules).map((m) => [m, { read: next, write: next }]),
			);

			return { ...prev, [app]: updated };
		});
	};

	/** --------------------------------------------------------
	 * Toggle App by Permission Column (all read / all write)
	 * -------------------------------------------------------- */
	const toggleAppAction = (app: string, action: Permission) => {
		const modules = permState[app];
		if (!modules) return;

		const next = !Object.values(modules).every((p) => p[action]);

		const updated: Record<string, PermissionFlag> = {};

		Object.keys(modules).forEach((m) => {
			if (action === "write") {
				updated[m] = {
					read: next ? true : modules[m].read,
					write: next,
				};
			} else {
				updated[m] = {
					read: next,
					write: next ? modules[m].write : false,
				};
			}
		});

		setPermState((prev) => ({
			...prev,
			[app]: updated,
		}));
	};

	/** --------------------------------------------------------
	 * Derived UI State (Checkbox states)
	 * -------------------------------------------------------- */
	const appActionState = (app: string, action: Permission) => {
		const modules = permState?.[app];
		if (!modules) return { all: false, some: false };

		return {
			all: areAllActionEnabled(modules, action),
			some: areSomeActionEnabled(modules, action),
		};
	};

	/** --------------------------------------------------------
	 * Expose Hook API
	 * -------------------------------------------------------- */
	return {
		permState,
		togglePerm,
		toggleAppAll,
		toggleAppAction,
		appActionState,
	};
};

// -----------------------------------------------------
// Filter profiles
// -----------------------------------------------------
