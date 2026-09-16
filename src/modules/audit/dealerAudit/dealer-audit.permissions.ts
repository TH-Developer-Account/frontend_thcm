import type { DealerAuditRole } from "./dealer-audit.types";

export interface DealerAuditPermissions {
	canView: boolean;
	canCreateAudit: boolean;
	canEditSelfAssessment: boolean;
	canSubmitSelfAssessment: boolean;
	canReview: boolean;
	canRaiseClarification: boolean;
	canRespondToClarification: boolean;
	canApprove: boolean;
	canReassignReviewer: boolean;
	canManageTemplates: boolean; // create/update/publish checklist templates
	canViewHistory: boolean;
	canDownloadReport: boolean;
}

const READ_ONLY_PERMISSIONS: DealerAuditPermissions = {
	canView: true,
	canCreateAudit: false,
	canEditSelfAssessment: false,
	canSubmitSelfAssessment: false,
	canReview: false,
	canRaiseClarification: false,
	canRespondToClarification: false,
	canApprove: false,
	canReassignReviewer: false,
	canManageTemplates: false,
	canViewHistory: true,
	canDownloadReport: true,
};

const ROLE_PERMISSIONS: Record<DealerAuditRole, DealerAuditPermissions> = {
	ADMIN: {
		canView: true,
		canCreateAudit: true,
		canEditSelfAssessment: true,
		canSubmitSelfAssessment: true,
		canReview: true,
		canRaiseClarification: true,
		canRespondToClarification: true,
		canApprove: true,
		canReassignReviewer: true,
		canManageTemplates: true,
		canViewHistory: true,
		canDownloadReport: true,
	},
	DEALER: {
		...READ_ONLY_PERMISSIONS,
		canEditSelfAssessment: true,
		canSubmitSelfAssessment: true,
		canRespondToClarification: true,
	},
	REVIEWER: {
		...READ_ONLY_PERMISSIONS,
		canReview: true,
		canRaiseClarification: true,
	},
	REVIEWER_MANAGER: {
		...READ_ONLY_PERMISSIONS,
		canReview: true,
		canRaiseClarification: true,
		canReassignReviewer: true,
	},
	APPROVER: {
		...READ_ONLY_PERMISSIONS,
		canApprove: true,
	},
	AUDIT_MANAGER: {
		...READ_ONLY_PERMISSIONS,
		canCreateAudit: true,
		canReassignReviewer: true,
	},
	READ_ONLY: READ_ONLY_PERMISSIONS,
};

/**
 * Base role permissions. Callers must further narrow by audit status and
 * assignment (e.g. a DEALER can only edit if they are the assigned appraiser
 * AND the audit is in an editable status) — see useAuditPermissions (Day 2+).
 */
export function getDealerAuditPermissions(
	role: DealerAuditRole | undefined,
): DealerAuditPermissions {
	if (!role)
		return {
			...READ_ONLY_PERMISSIONS,
			canView: false,
			canViewHistory: false,
			canDownloadReport: false,
		};
	return ROLE_PERMISSIONS[role];
}
