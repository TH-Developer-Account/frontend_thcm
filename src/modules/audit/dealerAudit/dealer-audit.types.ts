// ─────────────────────────────────────────────────────────────────────
// Dealer Audit
// ─────────────────────────────────────────────────────────────────────

// ── Roles ─────────────────────────────────────────────────────────────

export type DealerAuditRole =
	| "ADMIN"
	| "DEALER"
	| "REVIEWER"
	| "REVIEWER_MANAGER"
	| "APPROVER"
	| "AUDIT_MANAGER"
	| "READ_ONLY";

// ── Checklist Status / Filters ────────────────────────────────────────

export type ChecklistStatus = "PENDING" | "COMPLETED";

export type ChecklistFilter = "ALL" | ChecklistStatus;

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

// ── Reviewer Decision ─────────────────────────────────────────────────

export type ReviewerItemDecision =
	| "PENDING"
	| "ACCEPTED"
	| "CLARIFICATION_REQUIRED"
	| "DEFICIENT"
	| "NOT_APPLICABLE";

// ── Checklist Item ────────────────────────────────────────────────────

export type AuditChecklistItem = {
	id: string;
	code: string;
	sequence: number;

	categoryId: string;
	categoryName: string;

	title: string;
	description: string;
	parameter: string;
	criteria: string[];

	status: ChecklistStatus;

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
	 * Temporarily retained while older checklist components
	 * are migrated to the dual-score model.
	 */
	score: number | null;

	/**
	 * @deprecated
	 * Use selfRemarks.
	 *
	 * Temporarily retained while older checklist components
	 * are migrated to the dual-score model.
	 */
	remarks: string;
};

// ── Checklist Category ────────────────────────────────────────────────

export type AuditChecklistCategory = {
	id: string;
	name: string;
	items: AuditChecklistItem[];
};

// ── Dealer Audit Checklist ────────────────────────────────────────────

export type DealerAuditChecklist = {
	auditId: string;
	dealerName: string;
	location: string;
	categories: AuditChecklistCategory[];
};

// ─────────────────────────────────────────────────────────────────────
// Checklist Item Forms / Mutations
// ─────────────────────────────────────────────────────────────────────

export type ChecklistItemFormValues = {
	score: number | null;
	remarks: string;
	evidence: AuditEvidence[];
};

export type UpdateChecklistItemPayload = ChecklistItemFormValues & {
	status: ChecklistStatus;
};

// ─────────────────────────────────────────────────────────────────────
// Checklist Template Builder
// ─────────────────────────────────────────────────────────────────────

export type TemplateParameterDraft = {
	id: string;
	title: string;
	criteria: string[];
	tags: string[];

	requiresPhoto: boolean;
	requiresRemarks: boolean;

	minScore: number;
	maxScore: number;
	weight: number;
};

export type TemplateSectionDraft = {
	id: string;
	name: string;
	parameters: TemplateParameterDraft[];
};

export type ChecklistTemplateStatus = "draft" | "published" | "archived";

export interface ChecklistTemplateParameter {
	id: string;
	order: number;
	title: string; // "parameter"
	description: string; // "criteria"
	scoreMin: number; // default 0
	scoreMax: number; // default 5
	weight: number; // default 1, used for scoring math later
	evidenceRequired: boolean;
	minEvidenceCount: number | null; // only relevant if evidenceRequired
	maxEvidenceCount: number | null;
	// Remarks are always available at execution time and never mandatory —
	// intentionally no `remarksMandatory` flag here.
}
export interface ChecklistTemplateSection {
	id: string;
	order: number;
	name: string;
	parameters: ChecklistTemplateParameter[];
}
export interface ChecklistTemplate {
	id: string;
	name: string;
	description: string;
	auditCategory: string; // e.g. "Dealer audit", "Factory audit"
	facilityType?: string; // ties to facility-type checklist mapping
	status: ChecklistTemplateStatus;
	version: number;
	sections: ChecklistTemplateSection[];
	updatedAt: string;
	updatedBy?: { id: string; name: string };
}

// ---- Derived summary (drives the sticky outline / summary view) ----
export interface ChecklistTemplateSummary {
	sectionCount: number;
	parameterCount: number;
	totalPoints: number; // sum of scoreMax * weight across all parameters
	perSection: Array<{
		sectionId: string;
		name: string;
		parameterCount: number;
		points: number;
	}>;
}

// ---- Form / draft values (builder-local, pre-save) ----
export interface ChecklistTemplateFormValues {
	name: string;
	description: string;
	auditCategory: string;
	facilityType?: string;
	sections: ChecklistTemplateSection[];
}

// ---- Request payloads ----
export interface CreateChecklistTemplatePayload {
	name: string;
	description: string;
	auditCategory: string;
	facilityType?: string;
	sections: Omit<ChecklistTemplateSection, "id">[];
}

export interface UpdateChecklistTemplatePayload extends Partial<CreateChecklistTemplatePayload> {
	id: string;
}

export interface ChecklistTemplateListParams {
	search?: string;
	status?: ChecklistTemplateStatus | "all";
	page?: number;
	pageSize?: number;
}
