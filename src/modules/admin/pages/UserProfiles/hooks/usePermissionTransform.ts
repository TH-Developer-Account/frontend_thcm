import type { PermissionState } from "../types/permission.types";
import type { BackendPermissionsResponse } from "../types/permission.types";

export const backendToUI = (
	backend: BackendPermissionsResponse,
): PermissionState => {
	const state: PermissionState = {};

	backend.permissions.forEach((perm) => {
		if (!state[perm.appKey]) state[perm.appKey] = {};

		if (!state[perm.appKey][perm.moduleKey]) {
			state[perm.appKey][perm.moduleKey] = { read: false, write: false };
		}

		state[perm.appKey][perm.moduleKey][perm.action] = true;
	});

	return state;
};
export const uiToPayload = (state: PermissionState) => {
	const result: any[] = [];

	Object.entries(state).forEach(([appKey, modules]) => {
		Object.entries(modules).forEach(([moduleKey, actions]) => {
			if (actions.read) result.push({ action: "read", appKey, moduleKey });

			if (actions.write) result.push({ action: "write", appKey, moduleKey });
		});
	});

	return result;
};
