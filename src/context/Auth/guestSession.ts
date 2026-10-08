import type { Guest } from "./GuestAuthContext";

/*
 * Guest session storage + helpers. Pure functions (no React) so the
 * provider, the protected route and the tests share one implementation.
 *
 * The guest JWT lives 24h with no refresh token (backend guest.auth.ts):
 * once it expires the guest logs in again with OTP or password.
 */

export const GUEST_TOKEN_KEY = "guestAuthToken";
export const GUEST_PROFILE_KEY = "guestAuthProfile";

export const GUEST_LOGIN_PATH = "/guest/login";
export const GUEST_HOME_PATH = "/guest/medi-claim/listing";

/** Clock-skew allowance so a token isn't used in its last seconds. */
const EXPIRY_SKEW_MS = 30_000;

// localStorage can throw (private mode, blocked storage) — never crash on it.
const safeGet = (key: string): string | null => {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
};
const safeSet = (key: string, value: string) => {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		/* ignore */
	}
};
const safeRemove = (key: string) => {
	try {
		window.localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
};

/** `exp` (ms) from a JWT, or null if it can't be read. No signature check — the API does that. */
export function getTokenExpiry(token: string | null | undefined): number | null {
	if (!token) return null;
	const payload = token.split(".")[1];
	if (!payload) return null;
	try {
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
		const json = JSON.parse(atob(padded)) as { exp?: number; type?: string };
		return typeof json.exp === "number" ? json.exp * 1000 : null;
	} catch {
		return null;
	}
}

/** A token is usable when present and not (about to be) expired. Tokens without exp are trusted. */
export function isTokenUsable(token: string | null | undefined, now = Date.now()): boolean {
	if (!token) return false;
	const expiry = getTokenExpiry(token);
	return expiry === null ? true : expiry - EXPIRY_SKEW_MS > now;
}

export const readGuestToken = () => safeGet(GUEST_TOKEN_KEY);

export function readGuestSession(): { token: string; guest: Guest } | null {
	const token = safeGet(GUEST_TOKEN_KEY);
	const rawGuest = safeGet(GUEST_PROFILE_KEY);
	if (!token || !rawGuest || !isTokenUsable(token)) return null;
	try {
		const guest = JSON.parse(rawGuest) as Guest;
		return guest?.id ? { token, guest } : null;
	} catch {
		return null;
	}
}

export function writeGuestSession(token: string, guest: Guest) {
	safeSet(GUEST_TOKEN_KEY, token);
	safeSet(GUEST_PROFILE_KEY, JSON.stringify(guest));
}

export function clearGuestSession() {
	safeRemove(GUEST_TOKEN_KEY);
	safeRemove(GUEST_PROFILE_KEY);
}

/**
 * Only same-app guest paths may be used as a post-login redirect — never an
 * absolute URL or a staff route (open-redirect protection).
 */
export function sanitizeGuestRedirect(value: string | null | undefined): string {
	if (!value) return GUEST_HOME_PATH;
	let decoded = value;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		return GUEST_HOME_PATH;
	}
	if (!decoded.startsWith("/guest/") || decoded.startsWith("//")) return GUEST_HOME_PATH;
	if (decoded.startsWith(GUEST_LOGIN_PATH)) return GUEST_HOME_PATH;
	if (/[\\\s]|:\/\//.test(decoded)) return GUEST_HOME_PATH;
	return decoded;
}

/** `/guest/login?redirect=<current path>` */
export const buildGuestLoginUrl = (redirectTo?: string, reason?: "expired") => {
	const params = new URLSearchParams();
	if (redirectTo && sanitizeGuestRedirect(redirectTo) !== GUEST_HOME_PATH) {
		params.set("redirect", redirectTo);
	}
	if (reason) params.set("reason", reason);
	const query = params.toString();
	return query ? `${GUEST_LOGIN_PATH}?${query}` : GUEST_LOGIN_PATH;
};

/** Display name for the header / greeting. */
export const getGuestDisplayName = (guest: Guest | null | undefined): string => {
	if (!guest) return "";
	const full = guest.name?.trim();
	if (full) return full;
	const parts = [guest.first_name ?? guest.firstName, guest.last_name ?? guest.lastName]
		.filter(Boolean)
		.join(" ")
		.trim();
	return parts || guest.email || guest.mobile || "";
};
