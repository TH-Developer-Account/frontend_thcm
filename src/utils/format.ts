// utils/format.ts

/* =========================
   STRING FORMATTING
========================= */
export const getFullName = (
	user?: {
		first_name?: string | null;
		last_name?: string | null;
		email?: string | null;
	} | null,
) => {
	if (!user) return "";

	const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

	return fullName || user.email || "";
};
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

export function formatDateTime24(date?: string | Date | null) {
	if (!date) return "";

	const d = new Date(date);

	if (Number.isNaN(d.getTime())) return "";

	return d.toLocaleString("en-IN", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}
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
export const formatDateOnly = (date?: Date) => {
	if (!date) return "";

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${day}-${month}-${year}`;
};

export const formatDateOnlyAPI = (date?: string | null) => {
	if (!date) return "";
	return String(date).split("T")[0];
};
export const toPrismaDateTime = (date?: string | Date | null) => {
	if (!date) return null;

	if (date instanceof Date) {
		return date.toISOString();
	}

	// Already ISO DateTime
	if (date.includes("T")) {
		return date;
	}

	// Convert YYYY-MM-DD to full ISO DateTime
	return new Date(`${date}T00:00:00.000Z`).toISOString();
};

/**
 * Parses a single date-only string into a Date, using local
 * year/month/day components (never a bare `new Date(string)` call,
 * which is unreliable for anything but strict ISO and can drift a
 * day depending on timezone).
 *
 * Accepts every format this codebase actually produces or consumes
 * for date-only fields:
 *  - YYYY-MM-DD   (API / ISO — see epc.payload.ts's toApiDate)
 *  - DD-MM-YYYY   (this file's own formatDateOnly output)
 *  - DD/MM-style  (DD/MM/YYYY, also tolerated by toApiDate)
 * Falls back to a plain `new Date(value)` parse for anything else,
 * and returns undefined rather than an Invalid Date if that fails.
 */
const parseDateOnly = (value?: string | null): Date | undefined => {
	if (!value) return undefined;

	// YYYY-MM-DD
	const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (isoMatch) {
		const [, year, month, day] = isoMatch;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	// DD-MM-YYYY
	const dashMatch = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (dashMatch) {
		const [, day, month, year] = dashMatch;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	// DD/MM/YYYY
	const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	if (slashMatch) {
		const [, day, month, year] = slashMatch;
		return new Date(Number(year), Number(month) - 1, Number(day));
	}

	const fallback = new Date(value);
	return Number.isNaN(fallback.getTime()) ? undefined : fallback;
};

export const toDateRange = (from?: string | null, to?: string | null) => {
	if (!from && !to) return undefined;

	return {
		from: parseDateOnly(from),
		to: parseDateOnly(to),
	};
};
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

export const trimText = (value?: string | null, maxLength = 80) => {
	if (!value?.trim()) return "--";

	const text = value.trim();

	if (text.length <= maxLength) return text;

	return `${text.slice(0, maxLength).trim()}...`;
};

export const capitalizeSnakeCase = (str: string) => {
	return str
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
};

/* =========================
   SANITIZATION / NORMALIZATION
   Run these on form values right before they cross the API boundary
   (inside a form's submit mapper), never on every keystroke and never
   on the value shown back in the field. Per the project's sanitization
   standard: trim/lowercase email, digit-strip phone numbers, uppercase
   PAN/GSTIN/IFSC-style codes — and never touch passwords, tokens, or
   file contents, where exact characters (including whitespace) matter.
========================= */

/**
 * name@Company.COM  →  name@company.com
 */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

/**
 * Strips everything but digits so a pasted "+91 98765-43210" or
 * "(9876) 543-210" becomes a plain 10-digit string before validation/
 * submission. Safe to call on every keystroke (used for the live
 * mobile-number inputs) as well as at submit time.
 */
export const normalizeMobileNumber = (value: string) =>
	value.replace(/\D/g, "").slice(0, 10);

/**
 * Same digit-only stripping as normalizeMobileNumber, kept as a separate
 * named export so OTP fields aren't coupled to "this is a phone number"
 * semantics — a 6-digit OTP is a different domain concept that happens
 * to share the same sanitization rule today.
 */
export const normalizeOtp = (value: string) => value.replace(/\D/g, "");

/**
 * PAN / GSTIN / IFSC and similar bank/compliance codes are conventionally
 * upper-case; normalize casing without altering anything else about the
 * value (no digit stripping, no trimming beyond the edges).
 */
export const normalizeUpperCaseCode = (value: string) =>
	value.trim().toUpperCase();

/**
 * Generic "trim, nothing else" normalizer for free-text fields (names,
 * addresses, remarks) where the only sanitization rule is removing
 * leading/trailing whitespace. Never apply this to passwords or tokens.
 */
export const normalizeText = (value: string) => value.trim();
