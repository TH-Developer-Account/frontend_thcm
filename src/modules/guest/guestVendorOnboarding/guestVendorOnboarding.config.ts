import type { VendorOnboardingStatus } from "../../vendorOnboarding/types/vendorOnboarding.types";

/** Shared cache keys for every guest/public vendor-onboarding request. */
export const guestVendorQueryKeys = {
	all: ["guest-vendor-onboarding"] as const,
	publicSession: (token: string) =>
		[...guestVendorQueryKeys.all, "public-session", token] as const,
	listing: () => [...guestVendorQueryKeys.all, "listing"] as const,
	detail: (onboardingId: string) =>
		[...guestVendorQueryKeys.all, "detail", onboardingId] as const,
};

/** Guests can edit only an initial request or a form returned by THCM. */
const GUEST_EDITABLE_STATUSES = new Set<VendorOnboardingStatus>([
	"AWAITING_VENDOR",
	"THCM_CLARIFICATION_REQUESTED",
]);

export const canGuestEditVendorOnboarding = (
	status?: VendorOnboardingStatus,
): boolean => status != null && GUEST_EDITABLE_STATUSES.has(status);
