import type { VendorListingFilter } from "../types/vendorListing.types";

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
// Error message extraction
// ─────────────────────────────────────────────────────────────────────────────

export const getErrorMessage = (error: unknown, fallback: string): string => {
	if (
		typeof error === "object" &&
		error !== null &&
		"response" in error &&
		typeof error.response === "object" &&
		error.response !== null &&
		"data" in error.response &&
		typeof error.response.data === "object" &&
		error.response.data !== null &&
		"message" in error.response.data &&
		typeof error.response.data.message === "string"
	) {
		return error.response.data.message;
	}
	return error instanceof Error ? error.message : fallback;
};

// ─────────────────────────────────────────────────────────────────────────────
// Listing UI text (search placeholders + empty states)
// ─────────────────────────────────────────────────────────────────────────────

export const getOnboardingSearchPlaceholder = (
	filter: VendorListingFilter,
): string => {
	switch (filter) {
		case "createdByMe":
			return "Search vendor requests created by me";

		case "pendingOnMe":
			return "Search approvals pending on me";

		case "approvedByMe":
			return "Search vendor requests approved by me";

		default:
			return "Search vendor onboarding records";
	}
};

export const getInitiationSearchPlaceholder = (
	filter: VendorListingFilter,
): string => {
	switch (filter) {
		case "createdByMe":
			return "Search initiation requests created by me";

		case "pendingOnMe":
			return "Search initiation requests pending on me";

		case "approvedByMe":
			return "Search initiation requests approved by me";
		default:
			return "No vendor initiation requests found";
	}
};

export const getInitiationEmptyContent = (
	filter: VendorListingFilter,
): {
	title: string;
	description: string;
} => {
	switch (filter) {
		case "createdByMe":
			return {
				title: "No initiation requests created by you",
				description: "Vendor initiation requests you create will appear here.",
			};

		case "pendingOnMe":
			return {
				title: "No initiation requests are pending on you",
				description:
					"Vendor initiation requests requiring your action will appear here.",
			};

		case "approvedByMe":
			return {
				title: "No initiation requests approved by you",
				description: "Vendor initiation requests you approve will appear here.",
			};
		default:
			return {
				title: "No vendor initiation requests found",
				description: "Vendor initiation form entries will appear here.",
			};
	}
};

export const getOnboardingEmptyContent = (
	filter: VendorListingFilter,
): {
	title: string;
	description: string;
} => {
	switch (filter) {
		case "createdByMe":
			return {
				title: "No vendor requests created by you",
				description: "Vendor onboarding requests you create will appear here.",
			};

		case "pendingOnMe":
			return {
				title: "No approvals are pending on you",
				description:
					"Vendor onboarding requests requiring your approval will appear here.",
			};

		case "approvedByMe":
			return {
				title: "No vendor requests approved by you",
				description: "Vendor onboarding requests you approve will appear here.",
			};

		default:
			return {
				title: "No vendor onboarding records found",
				description: "Vendor onboarding records will appear here.",
			};
	}
};
