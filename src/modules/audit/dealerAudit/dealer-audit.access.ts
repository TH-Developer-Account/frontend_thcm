// modules/audit/dealerAudit/dealer-audit.access.ts
//
// Pure role resolution: turns the app's generic auth facts into one
// DealerAuditRole. Kept separate from the hook so it is unit-testable.
//
// The app's permission system only knows read / write per module, so the
// finer roles (approver vs audit manager) need an extra signal.
//
// TODO(roles): fill DESIGNATION_ROLE_MAP once the approver roles are agreed
// (keys are the lower-cased `user.designation`). Until then:
//   user.role === "DEALER"             → DEALER   (needs the dealer grant)
//   app admin / ADMIN module "write"   → ADMIN
//   REVIEW module "write"              → REVIEWER
//   ADMIN module "read" only           → READ_ONLY

import type { DealerAuditRole } from "./dealer-audit.types";

export const DESIGNATION_ROLE_MAP: Readonly<Record<string, DealerAuditRole>> =
	{};

export interface RoleResolutionInput {
	userRole: "ADMIN" | "DEALER" | "EMPLOYEE" | undefined;
	designation: string | undefined;
	isAppAdmin: boolean;
	canAdminWrite: boolean;
	canAdminRead: boolean;
	canReviewWrite: boolean;
	canDealerRead: boolean;
}

export function resolveDealerAuditRole(
	input: RoleResolutionInput,
): DealerAuditRole | undefined {
	if (input.userRole === "DEALER")
		return input.canDealerRead ? "DEALER" : undefined;

	const designation = input.designation?.trim().toLowerCase();
	const byDesignation = designation
		? DESIGNATION_ROLE_MAP[designation]
		: undefined;
	if (byDesignation && (input.canAdminRead || input.canReviewWrite))
		return byDesignation;

	if (input.isAppAdmin || input.canAdminWrite) return "ADMIN";
	if (input.canReviewWrite) return "REVIEWER";
	if (input.canAdminRead) return "READ_ONLY";
	return undefined;
}
