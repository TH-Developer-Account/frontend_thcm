import { useMemo } from "react";
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
import { useCurrentDealerAuditRole } from "./useCurrentDealerAuditRole";

export interface DealerAuditSession {
	role: DealerAuditRole | undefined;
	isLoading: boolean;
	userId: string | null;
	dealerId: string | null;
	/** Role-level permissions (not yet narrowed by a specific audit). */
	permissions: DealerAuditPermissions;
}

export function useDealerAuditSession(): DealerAuditSession {
	const { role, isLoading, userId, dealerId } = useCurrentDealerAuditRole();

	const permissions = useMemo(() => getDealerAuditPermissions(role), [role]);
	return { role, isLoading, userId, dealerId, permissions };
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
