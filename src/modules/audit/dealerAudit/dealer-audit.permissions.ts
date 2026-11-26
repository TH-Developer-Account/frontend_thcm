// modules/audit/dealerAudit/dealer-audit.permissions.ts
//
// Action-level permissions. Two layers:
//
//   1. getDealerAuditPermissions(role)        what a ROLE may ever do
//   2. resolveAuditPermissions(role, user, audit)  narrowed by scope
//      (own dealer / assigned reviewer) and the audit's current status
//
// Visibility rules agreed with product:
//   • DEALER   sees only their own audit and report. No workflow history,
//              no audit messages/comments, no reviewer assessment.
//   • REVIEWER sees the dealer, their info, approval comments and history.
//   • ADMIN    sees everything but can NOT review, approve or reject.
//
// Frontend checks improve usability only — the backend must enforce every
// one of these rules.

import {
	isAwaitingApprovalStatus,
	isClarificationStatus,
	isDealerSubmittableStatus,
	isReportAvailableStatus,
	isReviewOpenStatus,
	isSelfAssessmentOpenStatus,
	isTerminalAuditStatus,
} from "./dealer-audit.status";
import type {
	AssessmentMode,
	DealerAuditRole,
	DealerAuditStatus,
} from "./dealer-audit.types";

export interface DealerAuditPermissions {
	canView: boolean;
	canCreateAudit: boolean;
	canAssignAudit: boolean;
	canEditSelfAssessment: boolean;
	canSubmitSelfAssessment: boolean;
	canReview: boolean;
	canRaiseClarification: boolean;
	canRespondToClarification: boolean;
	canSubmitReview: boolean;
	canApprove: boolean;
	canReject: boolean;
	canReassignReviewer: boolean;
	canManageTemplates: boolean; // create/update/publish checklist templates
	canReAudit: boolean;
	canDownloadReport: boolean;

	// ── What the user is allowed to SEE ──
	canViewHistory: boolean;
	canViewWorkflow: boolean; // status trail, assignee, SLA, approval state
	canViewComments: boolean; // audit messages / approval comments
	canViewReviewerAssessment: boolean;
	canViewDealerInfo: boolean;
}

const NO_PERMISSIONS: DealerAuditPermissions = {
	canView: false,
	canCreateAudit: false,
	canAssignAudit: false,
	canEditSelfAssessment: false,
	canSubmitSelfAssessment: false,
	canReview: false,
	canRaiseClarification: false,
	canRespondToClarification: false,
	canSubmitReview: false,
	canApprove: false,
	canReject: false,
	canReassignReviewer: false,
	canManageTemplates: false,
	canReAudit: false,
	canDownloadReport: false,
	canViewHistory: false,
	canViewWorkflow: false,
	canViewComments: false,
	canViewReviewerAssessment: false,
	canViewDealerInfo: false,
};

/** Internal staff who may inspect an audit without acting on it. */
const INTERNAL_VIEWER: DealerAuditPermissions = {
	...NO_PERMISSIONS,
	canView: true,
	canViewHistory: true,
	canViewWorkflow: true,
	canViewComments: true,
	canViewReviewerAssessment: true,
	canViewDealerInfo: true,
	canDownloadReport: true,
};

const ROLE_PERMISSIONS: Record<DealerAuditRole, DealerAuditPermissions> = {
	// Admin: full visibility + setup, never a participant in the verdict.
	ADMIN: {
		...INTERNAL_VIEWER,
		canCreateAudit: true,
		canAssignAudit: true,
		canReassignReviewer: true,
		canManageTemplates: true,
		canReAudit: true,
	},

	// Dealer: own part only.
	DEALER: {
		...NO_PERMISSIONS,
		canView: true,
		canEditSelfAssessment: true,
		canSubmitSelfAssessment: true,
		canRespondToClarification: true,
		canViewDealerInfo: true, // their own profile
		canDownloadReport: true,
	},

	REVIEWER: {
		...INTERNAL_VIEWER,
		canReview: true,
		canRaiseClarification: true,
		canSubmitReview: true,
	},

	REVIEWER_MANAGER: {
		...INTERNAL_VIEWER,
		canReview: true,
		canRaiseClarification: true,
		canSubmitReview: true,
		canReassignReviewer: true,
	},

	APPROVER: {
		...INTERNAL_VIEWER,
		canRaiseClarification: true, // send back instead of approving
		canApprove: true,
		canReject: true,
	},

	AUDIT_MANAGER: {
		...INTERNAL_VIEWER,
		canCreateAudit: true,
		canAssignAudit: true,
		canReassignReviewer: true,
		canReAudit: true,
	},

	READ_ONLY: INTERNAL_VIEWER,
};

/**
 * What a role may ever do. Callers that have an audit at hand must use
 * resolveAuditPermissions() — a DEALER can only edit while the audit is in
 * an editable status and only for their own dealership.
 */
export function getDealerAuditPermissions(
	role: DealerAuditRole | undefined,
): DealerAuditPermissions {
	if (!role) return NO_PERMISSIONS;
	return ROLE_PERMISSIONS[role];
}

// ── Audit-scoped permissions ──────────────────────────────────────────

export interface DealerAuditAccessUser {
	/** null = not known to the frontend yet (backend still enforces). */
	userId: string | null;
	dealerId: string | null;
}

export interface DealerAuditAccessSubject {
	status: DealerAuditStatus;
	dealerId: string;
	assignedReviewerId: string | null;
	openClarificationCount: number;
}

/**
 * Narrows role permissions by scope and workflow stage. Order matters:
 *   scope  →  terminal state  →  per-status action gates.
 */
export function resolveAuditPermissions(
	role: DealerAuditRole | undefined,
	user: DealerAuditAccessUser,
	audit: DealerAuditAccessSubject | undefined,
): DealerAuditPermissions {
	const base = getDealerAuditPermissions(role);
	if (!audit || !role) return base;

	// 1 ── Scope. A user outside the audit's scope sees nothing.
	if (
		role === "DEALER" &&
		user.dealerId !== null &&
		audit.dealerId !== user.dealerId
	) {
		return NO_PERMISSIONS;
	}
	const isForeignReviewer =
		(role === "REVIEWER" || role === "REVIEWER_MANAGER") &&
		user.userId !== null &&
		audit.assignedReviewerId !== null &&
		audit.assignedReviewerId !== user.userId;
	if (role === "REVIEWER" && isForeignReviewer) return NO_PERMISSIONS;

	const { status } = audit;
	const noOpenClarifications = audit.openClarificationCount === 0;

	// 2 ── Terminal audits are read-only. Closed audits can never be edited.
	const isTerminal = isTerminalAuditStatus(status);

	const canReport = base.canDownloadReport && isReportAvailableStatus(status);

	const next: DealerAuditPermissions = {
		...base,

		canEditSelfAssessment:
			base.canEditSelfAssessment &&
			(isSelfAssessmentOpenStatus(status) || isClarificationStatus(status)),

		canSubmitSelfAssessment:
			base.canSubmitSelfAssessment && isDealerSubmittableStatus(status),

		canRespondToClarification:
			base.canRespondToClarification &&
			isClarificationStatus(status) &&
			!noOpenClarifications,

		canReview: base.canReview && !isForeignReviewer && isReviewOpenStatus(status),

		canRaiseClarification:
			base.canRaiseClarification &&
			(status === "UNDER_REVIEW" || isAwaitingApprovalStatus(status)),

		canSubmitReview:
			base.canSubmitReview &&
			!isForeignReviewer &&
			status === "UNDER_REVIEW" &&
			noOpenClarifications,

		// An open clarification blocks final approval (server rule too).
		canApprove:
			base.canApprove && isAwaitingApprovalStatus(status) && noOpenClarifications,
		canReject: base.canReject && isAwaitingApprovalStatus(status),

		canReassignReviewer: base.canReassignReviewer && !isTerminal,

		canReAudit:
			base.canReAudit &&
			(status === "CLOSED" ||
				status === "APPROVED" ||
				status === "IMPROVEMENT_REQUIRED"),

		canDownloadReport: canReport,
	};

	if (isTerminal) {
		return {
			...next,
			canEditSelfAssessment: false,
			canSubmitSelfAssessment: false,
			canRespondToClarification: false,
			canReview: false,
			canRaiseClarification: false,
			canSubmitReview: false,
			canApprove: false,
			canReject: false,
			canReassignReviewer: false,
		};
	}

	return next;
}

/** Which side of the item screen this user works on right now. */
export const getAssessmentMode = (
	permissions: DealerAuditPermissions,
): AssessmentMode => {
	if (permissions.canEditSelfAssessment) return "SELF";
	if (permissions.canReview) return "REVIEW";
	return "READ_ONLY";
};
