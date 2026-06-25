import { useState } from "react";
import type { PermissionState, Action } from "../types/permission.types";

export const usePermissions = (initial: PermissionState) => {
	const [permissions, setPermissions] = useState(initial);

	const togglePerm = (app: string, module: string, action: Action) => {
		setPermissions((prev) => ({
			...prev,
			[app]: {
				...prev[app],
				[module]: {
					...prev[app][module],
					[action]: !prev[app][module][action],
				},
			},
		}));
	};

	const toggleModule = (app: string, module: string) => {
		const p = permissions[app][module];
		const next = !(p.read && p.write);

		setPermissions((prev) => ({
			...prev,
			[app]: {
				...prev[app],
				[module]: { read: next, write: next },
			},
		}));
	};

	const toggleApp = (app: string) => {
		const modules = permissions[app];

		const next = !Object.values(modules).every((m) => m.read && m.write);

		const updated: any = {};

		Object.keys(modules).forEach((m) => {
			updated[m] = { read: next, write: next };
		});

		setPermissions((prev) => ({
			...prev,
			[app]: updated,
		}));
	};

	return {
		permissions,
		togglePerm,
		toggleModule,
		toggleApp,
		setPermissions,
	};
};
