import type { VendorListingFilter } from "../types/vendorListing.types";
import { vendorContent } from "../../../content/vendor.content";

// ─────────────────────────────────────────────────────────────────────────────
// Boolean / string conversion primitives
// ─────────────────────────────────────────────────────────────────────────────

export const toYesNo = (value: boolean | string | null | undefined): string => {
	if (typeof value === "boolean") return value ? "Yes" : "No";
	const normalized = value?.trim().toLowerCase();
	if (normalized === "yes" || normalized === "true") return "Yes";
	if (normalized === "no" || normalized === "false") return "No";
	return "";
};

export const toNullableBoolean = (
	value: string | boolean | null | undefined,
): boolean | null => {
	if (typeof value === "boolean") return value;
	const normalized = value?.trim().toLowerCase();
	if (normalized === "yes" || normalized === "true") return true;
	if (normalized === "no" || normalized === "false") return false;
	return null;
};

export const toNullableString = (value?: string): string | null =>
	value?.trim() || null;

// ─────────────────────────────────────────────────────────────────────────────
// API-boundary sanitizers
// ─────────────────────────────────────────────────────────────────────────────
// Defense-in-depth: the form UI already sanitizes most of these as the
// vendor types (e.g. FormOne uppercases gstin/pan on change, and
// sanitizeAccountNumber strips non-alphanumerics from the account number
// fields), but that's per-input JSX behavior. These run again at the
// mapper → payload boundary so a value reaching the API is normalized
// regardless of which code path produced it — a resubmission, a future
// new entry point, or a field the JSX sanitization ever misses.
//
// Per project convention: never applied to passwords, tokens, file
// contents, or confirmAccountNumber (which never leaves the frontend at
// all — see buildVendorUpdatePayload's comment on that field).

export const toNullableEmail = (value?: string): string | null => {
	const trimmed = value?.trim().toLowerCase() ?? "";
	return trimmed || null;
};

export const toNullableMobileDigits = (value?: string): string | null => {
	const digitsOnly = value?.replace(/\D/g, "") ?? "";
	return digitsOnly || null;
};

export const toNullableUpperCase = (value?: string): string | null => {
	const trimmed = value?.trim().toUpperCase() ?? "";
	return trimmed || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Listing UI text (search placeholders + empty states)
// ─────────────────────────────────────────────────────────────────────────────
// Copy lives in src/content/vendor.content.en.json (listing.onboarding /
// listing.initiation) — this stays a plain function so callers don't need
// to know the content shape, only the filter they're on.

export const getOnboardingSearchPlaceholder = (
	filter: VendorListingFilter,
): string => {
	const { searchPlaceholder } = vendorContent.listing.onboarding;

	switch (filter) {
		case "createdByMe":
			return searchPlaceholder.createdByMe;
		case "pendingOnMe":
			return searchPlaceholder.pendingOnMe;
		case "approvedByMe":
			return searchPlaceholder.approvedByMe;
		default:
			return searchPlaceholder.default;
	}
};

export const getInitiationSearchPlaceholder = (
	filter: VendorListingFilter,
): string => {
	const { searchPlaceholder } = vendorContent.listing.initiation;

	switch (filter) {
		case "createdByMe":
			return searchPlaceholder.createdByMe;
		case "pendingOnMe":
			return searchPlaceholder.pendingOnMe;
		case "approvedByMe":
			return searchPlaceholder.approvedByMe;
		default:
			return searchPlaceholder.default;
	}
};

export const getInitiationEmptyContent = (
	filter: VendorListingFilter,
): {
	title: string;
	description: string;
} => {
	const { empty } = vendorContent.listing.initiation;

	switch (filter) {
		case "createdByMe":
			return empty.createdByMe;
		case "pendingOnMe":
			return empty.pendingOnMe;
		case "approvedByMe":
			return empty.approvedByMe;
		default:
			return empty.default;
	}
};

export const getOnboardingEmptyContent = (
	filter: VendorListingFilter,
): {
	title: string;
	description: string;
} => {
	const { empty } = vendorContent.listing.onboarding;

	switch (filter) {
		case "createdByMe":
			return empty.createdByMe;
		case "pendingOnMe":
			return empty.pendingOnMe;
		case "approvedByMe":
			return empty.approvedByMe;
		default:
			return empty.default;
	}
};
