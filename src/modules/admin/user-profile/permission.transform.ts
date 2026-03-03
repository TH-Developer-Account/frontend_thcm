import type { Profile } from "./profile.types";
import type { PermissionDTO } from "./profile.types";

export function transformProfileToDTO(profile: Profile) {
	const permissions: PermissionDTO[] = [];

	Object.entries(profile.permissions).forEach(([moduleId, value]) => {
		if (value.read) {
			permissions.push({
				action: "read",
				scopeType: "MODULE",
				moduleKey: moduleId,
			});
		}

		if (value.write) {
			permissions.push({
				action: "write",
				scopeType: "MODULE",
				moduleKey: moduleId,
			});
		}
	});

	return {
		name: profile.name,
		description: profile.description,
		permissions,
	};
}
