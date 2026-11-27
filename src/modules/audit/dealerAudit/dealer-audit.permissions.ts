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

	// ── Which PAGES the user can open ──
	canViewMyAudits: boolean;
	canViewAllAudits: boolean;
	canViewTracker: boolean;
	canViewReviewQueue: boolean;
	canViewApprovals: boolean;
	canViewChecklists: boolean;
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
	canViewMyAudits: false,
	canViewAllAudits: false,
	canViewTracker: false,
	canViewReviewQueue: false,
	canViewApprovals: false,
	canViewChecklists: false,
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
	canViewAllAudits: true,
	canViewTracker: true,
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
		canViewReviewQueue: true,
		canViewApprovals: true,
		canViewChecklists: true,
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
		canViewMyAudits: true,
	},

	REVIEWER: {
		...INTERNAL_VIEWER,
		canReview: true,
		canRaiseClarification: true,
		canSubmitReview: true,
		canViewReviewQueue: true,
	},

	REVIEWER_MANAGER: {
		...INTERNAL_VIEWER,
		canReview: true,
		canRaiseClarification: true,
		canSubmitReview: true,
		canReassignReviewer: true,
		canViewReviewQueue: true,
	},

	APPROVER: {
		...INTERNAL_VIEWER,
		canRaiseClarification: true, // send back instead of approving
		canApprove: true,
		canReject: true,
		canViewApprovals: true,
	},

	AUDIT_MANAGER: {
		...INTERNAL_VIEWER,
		canCreateAudit: true,
		canAssignAudit: true,
		canReassignReviewer: true,
		canReAudit: true,
	},

	// Approvers without another grant land here.
	READ_ONLY: { ...INTERNAL_VIEWER, canViewApprovals: true },
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
	/** Reviewer has submitted but not yet sent the audit for approval. */
	reviewSubmitted?: boolean;
	/** Server: this user is a pending approver on the current stage. */
	viewerCanApprove?: boolean;
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
	const isApprover = audit.viewerCanApprove === true;
	if (role === "REVIEWER" && isForeignReviewer && !isApprover) {
		return NO_PERMISSIONS;
	}

	const { status } = audit;
	const noOpenClarifications = audit.openClarificationCount === 0;

	// 2 ── Terminal audits are read-only. Closed audits can never be edited.
	const isTerminal = isTerminalAuditStatus(status);

	// Internal users preview the report before approval; dealers only after.
	const canPreview =
		base.canViewReviewerAssessment &&
		(isAwaitingApprovalStatus(status) ||
			(status === "UNDER_REVIEW" && audit.reviewSubmitted === true));
	const canReport =
		base.canDownloadReport && (isReportAvailableStatus(status) || canPreview);

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

		// Only the reviewer asks the dealer, and only while reviewing.
		canRaiseClarification:
			base.canReview &&
			base.canRaiseClarification &&
			!isForeignReviewer &&
			status === "UNDER_REVIEW",

		canSubmitReview:
			base.canSubmitReview &&
			!isForeignReviewer &&
			status === "UNDER_REVIEW" &&
			noOpenClarifications,

		// An open clarification blocks final approval (server rule too).
		// Who may approve comes from the workflow (viewerCanApprove).
		canApprove:
			(base.canApprove || isApprover) &&
			isAwaitingApprovalStatus(status) &&
			noOpenClarifications,
		canReject:
			(base.canReject || isApprover) && isAwaitingApprovalStatus(status),

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
