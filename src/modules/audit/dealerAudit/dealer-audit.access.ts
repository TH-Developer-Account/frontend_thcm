// modules/audit/dealerAudit/dealer-audit.access.ts
//
// Pure role resolution: turns the app's generic auth facts into one
// DealerAuditRole. Kept separate from the hook so it is unit-testable.
//
// The app's permission system only knows read / write per module, so the
// finer roles (reviewer vs approver vs audit manager) need an extra signal.
//
// TODO(roles): fill DESIGNATION_ROLE_MAP once the role definitions are
// agreed (keys are the lower-cased `user.designation`). Until then:
//   user.role === "DEALER"            → DEALER   (needs a module grant)
//   super admin / MAP app manager     → ADMIN
//   module "write"                    → REVIEWER
//   module "read"                     → READ_ONLY

import type { DealerAuditRole } from "./dealer-audit.types";

export const DESIGNATION_ROLE_MAP: Readonly<Record<string, DealerAuditRole>> =
	{};

export interface RoleResolutionInput {
	userRole: "ADMIN" | "DEALER" | "EMPLOYEE" | undefined;
	designation: string | undefined;
	isSuperAdmin: boolean;
	canManageApp: boolean;
	canWrite: boolean;
	canRead: boolean;
}

export function resolveDealerAuditRole(
	input: RoleResolutionInput,
): DealerAuditRole | undefined {
	const hasGrant = input.canRead || input.canWrite;

	if (input.userRole === "DEALER") return hasGrant ? "DEALER" : undefined;

	const designation = input.designation?.trim().toLowerCase();
	const byDesignation = designation
		? DESIGNATION_ROLE_MAP[designation]
		: undefined;
	if (byDesignation && hasGrant) return byDesignation;

	if (input.isSuperAdmin || input.canManageApp) return "ADMIN";
	if (input.canWrite) return "REVIEWER";
	if (input.canRead) return "READ_ONLY";
	return undefined;
}
