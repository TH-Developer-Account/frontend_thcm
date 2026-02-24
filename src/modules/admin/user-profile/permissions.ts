import { type PermissionMap } from "./profile.types";

export const createEmptyPermissions = (
	modules: { id: string }[],
): PermissionMap =>
	Object.fromEntries(modules.map((m) => [m.id, { read: false, write: false }]));

export const togglePermission = (
	permissions: PermissionMap,
	moduleId: string,
	type: "read" | "write",
): PermissionMap => {
	const current = permissions[moduleId];

	if (!current) return permissions;

	const updated = { ...current };

	if (type === "read") {
		updated.read = !updated.read;
		if (!updated.read) updated.write = false;
	} else {
		updated.write = !updated.write;
		if (updated.write) updated.read = true;
	}

	return {
		...permissions,
		[moduleId]: updated,
	};
};
