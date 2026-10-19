// utils/common.ts
// Value coercion + localStorage access for the Activity Planner.
// Merged from: utils/common.helper.ts, utils/common.ts

/* ========================================================================== */
/*                               Value coercion                               */
/* ========================================================================== */

export const asString = (value: unknown, fallback = ""): string => {
	if (typeof value !== "string") return fallback;
	return value.trim() || fallback;
};

/** Finite number from a number or numeric string; otherwise `fallback`. */
export const toNumber = (value: unknown, fallback = 0): number => {
	const num =
		typeof value === "number"
			? value
			: typeof value === "string" && value.trim()
				? Number(value)
				: Number.NaN;

	return Number.isFinite(num) ? num : fallback;
};

export const asBoolean = (value: unknown): boolean =>
	value === true || value === 1 || value === "1" || value === "true";

/** Epoch ms for a date string; 0 when missing or invalid. */
export const toTimestamp = (value?: string | null): number => {
	const timestamp = value ? Date.parse(value) : Number.NaN;
	return Number.isFinite(timestamp) ? timestamp : 0;
};

/* ========================================================================== */
/*                                localStorage                                */
/* ========================================================================== */

const STORAGE_KEYS = {
	epcInfo: "epcInfo",
	appId: "appId",
} as const;

export type StoredEpcInfo = {
	epcId?: string | null;
	crfId?: string | null;
	epfId?: string | null;
};

export const getStoredEpcInfo = (): StoredEpcInfo | null => {
	const stored = localStorage.getItem(STORAGE_KEYS.epcInfo);
	if (!stored) return null;

	try {
		return JSON.parse(stored) as StoredEpcInfo;
	} catch {
		return null;
	}
};

export const clearStoredEpcInfo = () => {
	localStorage.removeItem(STORAGE_KEYS.epcInfo);
};

export const getStoredAppId = () => localStorage.getItem(STORAGE_KEYS.appId);
