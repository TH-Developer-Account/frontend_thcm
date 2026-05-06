// utils/format.ts

/* =========================
   STRING FORMATTING
========================= */

export function capitalize(text?: string) {
	if (!text) return "";
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function capitalizeWords(text?: string) {
	if (!text) return "";

	return text
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * super_admin → Super Admin
 */
export function formatRole(role?: string) {
	if (!role) return "";

	return role
		.replace(/_/g, " ")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/* =========================
   STATUS FORMATTING
========================= */

export function formatStatus(status?: string) {
	if (!status) return "";
	return capitalizeWords(status.toLowerCase());
}

/**
 * Maps API status to safe UI value
 */
export function normalizeStatus<T extends string>(
	status: string,
	allowed: readonly T[],
	fallback: T,
): T {
	return allowed.includes(status as T) ? (status as T) : fallback;
}

/* =========================
   DATE FORMATTING
========================= */

export function formatDate(date?: string | Date) {
	if (!date) return "";

	const d = new Date(date);

	return d.toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * 26 Feb 2026, 3:45 PM
 */
export function formatDateTime(date?: string | Date) {
	if (!date) return "";

	const d = new Date(date);

	return d.toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/* =========================
   CURRENCY
========================= */

export function formatCurrency(amount?: number, currency = "INR") {
	if (amount == null) return "";

	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency,
		maximumFractionDigits: 2,
	}).format(amount);
}

/* =========================
   NUMBERS
========================= */

export function formatNumber(value?: number) {
	if (value == null) return "";

	return new Intl.NumberFormat("en-IN").format(value);
}

/* =========================
   USER HELPERS
========================= */

/**
 * Returns initials from name
 * "Mon Mon" → "MM"
 */
export function getInitials(name?: string) {
	if (!name) return "";

	return name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.toUpperCase();
}

/**
 * Mask phone number: 9876543210 → 9876****10
 */
export function maskPhone(phone?: string) {
	if (!phone || phone.length < 6) return phone || "";

	return phone.slice(0, 4) + "*".repeat(phone.length - 6) + phone.slice(-2);
}

/* =========================
   TABLE HELPERS
========================= */

/**
 * Safe accessor fallback
 */
export function safe(value: unknown, fallback = "-") {
	if (value === null || value === undefined || value === "") {
		return fallback;
	}
	return value;
}
