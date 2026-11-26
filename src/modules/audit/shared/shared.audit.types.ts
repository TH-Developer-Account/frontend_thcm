// modules/audit/shared/AuditTemplate.types.ts

export type AuditModuleKey = "DEALER_AUDIT" | "FACTORY_AUDIT";
export type AuditTemplateCategory = "INFRA" | "PROCESS";

export type ReviewerItemDecision =
	| "PENDING"
	| "ACCEPTED"
	| "CLARIFICATION_REQUIRED"
	| "DEFICIENT"
	| "NOT_APPLICABLE";

export interface AuditTemplateEvidence {
	id: string;
	url: string;
	name: string;
	size?: number;
	caption?: string;
	isLocal?: boolean;
	geoLat?: number;
	geoLng?: number;
	capturedAt?: string;
}

/**
 * One shape for a parameter — used as-is for the API response, the
 * template-builder draft, and the execution-time answer. Execution-only
 * fields are optional so a template-builder parameter (no answer yet)
 * and an API parameter (fully answered) both satisfy this interface.
 * Do not fork this into ParameterResponse / ParameterFormValues /
 * ParameterPayload — mappers narrow at the boundary, not the type system.
 */
export interface AuditTemplateParameter {
	id: string;
	sectionId?: string;
	order: number;

	title: string;
	description?: string;
	criteria?: string;
	category?: AuditTemplateCategory;

	scoreMin?: number;
	scoreMax?: number;
	weight?: number;

	evidenceRequired?: boolean;
	minEvidenceCount?: number | null;
	maxEvidenceCount?: number | null;

	// Execution-time only — undefined on a template parameter.
	selfScore?: number | null;
	selfRemarks?: string;
	evidence?: AuditTemplateEvidence[];

	// Reviewer-time only.
	reviewerScore?: number | null;
	reviewerRemarks?: string;
	reviewerDecision?: ReviewerItemDecision;
	scoreChangeReason?: string | null;
}

export interface AuditTemplateSection {
	id: string;
	order: number;
	name: string;
	parameters: AuditTemplateParameter[];
}

export interface AuditTemplate {
	id: string;
	name: string;
	description: string;
	auditModule: AuditModuleKey;
	facilityType?: string;
	status: "draft" | "published" | "archived";
	version: number;
	sections: AuditTemplateSection[];
	updatedAt: string;
}

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

export interface AuditInstance {
	id: string;
	auditModule: AuditModuleKey;
	dealerId?: string; // present only for DEALER_AUDIT
	templateId: string;
	templateVersion: number;
	status: AuditInstanceStatus;
	periodLabel: string;
	sections: AuditTemplateSection[];
	createdAt: string;
	dueAt?: string | null;
}

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

// ── AuditTemplate Status / Filters ────────────────────────────────────────

export type AuditTemplateStatus = "PENDING" | "COMPLETED";

export type AuditTemplateFilter = "ALL" | AuditTemplateStatus;

// ── Evidence ──────────────────────────────────────────────────────────

export type AuditEvidence = {
	id: string;
	name: string;
	url: string;
	size?: number;
	sizeLabel?: string;
	type?: string;
	isLocal?: boolean;
	caption?: string;
};

// ── AuditTemplate Item ────────────────────────────────────────────────────

export type AuditTemplateItem = {
	id: string;
	code: string;
	sequence: number;

	categoryId: string;
	categoryName: string;

	title: string;
	description: string;
	parameter: string;
	criteria: string[];

	status: AuditTemplateStatus;

	// Dealer self-assessment
	selfScore: number | null;
	selfRemarks: string;
	evidence: AuditEvidence[];

	// Reviewer assessment
	reviewerScore: number | null;
	reviewerRemarks: string;
	reviewerDecision: ReviewerItemDecision;

	/**
	 * Required when reviewerScore differs from selfScore.
	 */
	scoreChangeReason: string | null;

	/**
	 * @deprecated
	 * Use selfScore.
	 *
	 * Temporarily retained while older AuditTemplate components
	 * are migrated to the dual-score model.
	 */
	score: number | null;

	/**
	 * @deprecated
	 * Use selfRemarks.
	 *
	 * Temporarily retained while older AuditTemplate components
	 * are migrated to the dual-score model.
	 */
	remarks: string;
};

// ─────────────────────────────────────────────────────────────────────
// AuditTemplate Item Forms / Mutations
// ─────────────────────────────────────────────────────────────────────

export type AuditTemplateItemFormValues = {
	score: number | null;
	remarks: string;
	evidence: AuditEvidence[];
};

export type UpdateAuditTemplateItemPayload = AuditTemplateItemFormValues & {
	status: AuditTemplateStatus;
};

export const AuditTemplate_FILTER_TABS: Array<{
	label: string;
	value: AuditTemplateFilter;
}> = [
	{ label: "All", value: "ALL" },
	{ label: "Published", value: "COMPLETED" },
	{ label: "Drafts", value: "PENDING" },
];
