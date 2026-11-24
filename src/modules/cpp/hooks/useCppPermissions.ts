// hooks/useCppPermissions.ts — the signed-in user's rights on ONE CPP request.
// The rules live in utils/cpp.permissions.ts; this hook only supplies the current user.
import { useMemo } from "react";

import { useAuth } from "../../../context/Auth/useAuth";
import {
	getCppOwnerId,
	getCppPermissions,
	type CppOwnerRecord,
	type CppPermissions,
} from "../helpers/cpp.permissions";

export type CppPermissionRecord = CppOwnerRecord & { status?: string | null };

export function useCppPermissions(
	record: CppPermissionRecord | null | undefined,
): CppPermissions {
	const { user } = useAuth();
	const ownerId = getCppOwnerId(record);
	const status = record?.status ?? null;
	const currentUserId = user?.id ?? null;

	return useMemo(
		() => getCppPermissions({ ownerId, status, currentUserId }),
		[ownerId, status, currentUserId],
	);
}
