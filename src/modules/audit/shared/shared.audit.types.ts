// modules/audit/shared/shared.audit.types.ts
//
// Types shared by Dealer Audit and Factory Audit across templates and execution.

export type AuditModuleKey = "DEALER_AUDIT" | "FACTORY_AUDIT";

export type ReviewerItemDecision =
	| "PENDING"
	| "ACCEPTED"
	| "CLARIFICATION_REQUIRED"
	| "DEFICIENT"
	| "NOT_APPLICABLE";

export type AuditInstanceStatus =
	| "DRAFT"
	| "IN_PROGRESS"
	| "SUBMITTED"
	| "UNDER_REVIEW"
	| "CLARIFICATION_REQUIRED"
	| "RECTIFICATION_IN_PROGRESS"
	| "RESUBMITTED"
	| "PENDING_APPROVAL"
	| "APPROVED"
	| "REJECTED"
	| "IMPROVEMENT_REQUIRED"
	| "CLOSED"
	| "EXPIRED"
	| "CANCELLED";

/**
 * What differs between Dealer Audit and Factory Audit — the shared
 * components read this instead of hardcoding either module's rules.
 */
export interface AuditModuleCapabilities {
	auditModule: AuditModuleKey;
	hasSelfAssessment: boolean; // false for Factory Audit — reviewer captures directly
	hasReviewerScore: boolean;
	allowNotApplicable: boolean;
	evidenceCaptureMode: "LIVE_CAMERA_ONLY" | "LIVE_OR_GALLERY";
}
