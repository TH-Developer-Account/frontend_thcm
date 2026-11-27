import { useMemo } from "react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { resolveDealerAuditRole } from "../dealer-audit.access";
import {
	getDealerAuditPermissions,
	resolveAuditPermissions,
	type DealerAuditPermissions,
} from "../dealer-audit.permissions";
import type {
	DealerAudit,
	DealerAuditListItem,
	DealerAuditRole,
} from "../dealer-audit.types";

// Must match the app/module keys the backend's authorize() checks.
const APP_KEY = "DEALER_AUDIT";
const MODULE_ADMIN = "DEALER_AUDIT_ADMIN";
const MODULE_REVIEW = "DEALER_AUDIT_REVIEW";
const MODULE_DEALER = "DEALER_AUDIT_DEALER";

export interface DealerAuditSession {
	role: DealerAuditRole | undefined;
	/** true while the session is still being restored — do not deny yet. */
	isLoading: boolean;
	userId: string | null;
	/**
	 * TODO(dealer-id): the User object carries no dealer id yet. Until the
	 * backend adds one, dealer scoping is enforced by the API alone.
	 */
	dealerId: string | null;
	/** Role-level permissions (not yet narrowed by a specific audit). */
	permissions: DealerAuditPermissions;
}

/**
 * Bridges the app's {app, module, action} permissions onto Dealer Audit's
 * role model. See resolveDealerAuditRole for the mapping rules.
 */
export function useDealerAuditSession(): DealerAuditSession {
	const { user, isLoading, can, canManageApp } = useAuth();

	const userRole = user?.userType === "DEALER" ? "DEALER" : user?.role;
	const designation = user?.designation;
	const userId = user?.id ?? null;

	const role = useMemo(
		() =>
			resolveDealerAuditRole({
				userRole,
				designation,
				isAppAdmin: canManageApp(APP_KEY),
				canAdminWrite: can("write", APP_KEY, MODULE_ADMIN),
				canAdminRead: can("read", APP_KEY, MODULE_ADMIN),
				canReviewWrite: can("write", APP_KEY, MODULE_REVIEW),
				canDealerRead: can("read", APP_KEY, MODULE_DEALER),
			}),
		[userRole, designation, can, canManageApp],
	);

	const permissions = useMemo(() => getDealerAuditPermissions(role), [role]);

	return { role, isLoading, userId, dealerId: null, permissions };
}

/** Role-level permissions — keeps the signature existing pages rely on. */
export function useDealerAuditAccess(): DealerAuditPermissions {
	return useDealerAuditSession().permissions;
}

/** Permissions narrowed by scope and the audit's current workflow status. */
export function useAuditPermissions(
	audit:
		| (Pick<
				DealerAuditListItem,
				"status" | "dealerId" | "assignedReviewer" | "openClarificationCount"
		  > &
				Partial<Pick<DealerAudit, "reviewSubmitted" | "viewerCanApprove">>)
		| undefined,
): DealerAuditPermissions {
	const { role, userId, dealerId } = useDealerAuditSession();

	const status = audit?.status;
	const auditDealerId = audit?.dealerId;
	const assignedReviewerId = audit?.assignedReviewer?.id ?? null;
	const openClarificationCount = audit?.openClarificationCount ?? 0;
	const reviewSubmitted = audit?.reviewSubmitted ?? false;
	const viewerCanApprove = audit?.viewerCanApprove ?? false;

	return useMemo(
		() =>
			resolveAuditPermissions(
				role,
				{ userId, dealerId },
				status && auditDealerId
					? {
							status,
							dealerId: auditDealerId,
							assignedReviewerId,
							openClarificationCount,
							reviewSubmitted,
							viewerCanApprove,
						}
					: undefined,
			),
		[
			role,
			userId,
			dealerId,
			status,
			auditDealerId,
			assignedReviewerId,
			openClarificationCount,
			reviewSubmitted,
			viewerCanApprove,
		],
	);
}
