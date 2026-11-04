import { useCallback } from "react";

import { useMasterData } from "../../../hooks/useMasterData";

type MasterKey = "regions" | "branches" | "departments";

type MasterLike = { value: string; code?: string; label: string };

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Same matching rule as CreateUserForm / useUserInfo: id, code or label.
const matchMaster = <T extends MasterLike>(
	options: T[] | undefined,
	stored: string,
): T | undefined =>
	(options ?? []).find(
		(option) =>
			option.value === stored ||
			option.code === stored ||
			option.label === stored,
	);

/**
 * Resolves a stored zone / branch / department value to its master label,
 * for any row (not just the logged-in user).
 *
 * - Resolved value -> the master label.
 * - Unresolved UUID (masters still loading, or record deactivated) -> fallback,
 *   so a raw UUID is never shown to users.
 * - Unresolved non-UUID text (legacy free-text, custom branch) -> shown as-is.
 *
 * `getLabel` changes identity once the masters load, so include it in the
 * dependency array of any memoised table columns.
 */
export const useMasterLabels = () => {
	const { data: masters, isLoading } = useMasterData();

	const getLabel = useCallback(
		(key: MasterKey, stored?: string | null, fallback = "--"): string => {
			const value = stored?.trim();
			if (!value) return fallback;

			const match = matchMaster(masters?.[key], value);
			if (match) return match.label;

			return UUID_PATTERN.test(value) ? fallback : value;
		},
		[masters],
	);

	return { getLabel, isLoading };
};
