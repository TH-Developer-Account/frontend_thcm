// modules/audit/dealerAudit/dealer-audit.access.ts
//
// Pure role resolution: turns the app's generic auth facts into one
// DealerAuditRole. Kept separate from the hook so it is unit-testable.
//
//   super admin / app admin      → ADMIN
//   DESIGNATION_ROLE_MAP match   → that role
//   write on ADMIN module        → ADMIN
//   write on REVIEW module       → REVIEWER
//   any grant on DEALER module   → DEALER
//   read on ADMIN module         → READ_ONLY

import type { DealerAuditRole } from "./dealer-audit.types";

/** Must match the backend keys in dealerAudit.routes.ts. */
export const DEALER_AUDIT_APP_KEY = "DEALER_AUDIT";
export const DEALER_AUDIT_MODULES = {
	admin: "DEALER_AUDIT_ADMIN",
	review: "DEALER_AUDIT_REVIEW",
	dealer: "DEALER_AUDIT_DEALER",
} as const;

export const DESIGNATION_ROLE_MAP: Readonly<Record<string, DealerAuditRole>> =
	{};

export interface RoleResolutionInput {
	designation: string | undefined;
	isAppAdmin: boolean;
	canAdminRead: boolean;
	canAdminWrite: boolean;
	canReview: boolean;
	isDealer: boolean;
}

export function resolveDealerAuditRole(
	input: RoleResolutionInput,
): DealerAuditRole | undefined {
	// First, because admins pass every module check.
	if (input.isAppAdmin) return "ADMIN";

	const hasGrant =
		input.canAdminRead ||
		input.canAdminWrite ||
		input.canReview ||
		input.isDealer;
	const designation = input.designation?.trim().toLowerCase();
	const byDesignation = designation
		? DESIGNATION_ROLE_MAP[designation]
		: undefined;
	if (byDesignation && hasGrant) return byDesignation;

	if (input.canAdminWrite) return "ADMIN";
	if (input.canReview) return "REVIEWER";
	if (input.isDealer) return "DEALER";
	if (input.canAdminRead) return "READ_ONLY";
	return undefined;
}
