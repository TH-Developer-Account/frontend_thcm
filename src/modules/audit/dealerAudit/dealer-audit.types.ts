// modules/audit/dealerAudit/dealer-audit.types.ts
//
// Execution-side contracts for Dealer Audit (audit INSTANCES). Checklist
// TEMPLATE contracts live in ./templates/dealer-template.types.ts.
//
// Layers are kept apart on purpose (see mappers):
//   *Response      raw backend (snake_case, nullable)
//   domain models  normalized camelCase, safe defaults
//   *FormValues    editable drafts
//   *Payload       request bodies (snake_case)
//   *Params / *Variables  query params / mutation variables
//
// ASSUMPTION: backend field names follow the snake_case convention already
// used by the template endpoints. Only this file and dealer-audit.mappers.ts
// should need to change when the real contract lands.

import type {
	AuditInstanceStatus,
	ReviewerItemDecision,
} from "../shared/shared.audit.types";
import type {
	DealerFacilityType,
	DealerParameterCategory,
	DealerParameterFunction,
} from "./templates/dealer-template.types";
import type { LivePhotoValue } from "../shared/checklist/evidence.types";

export type {
	ApiEnvelope,
	ApiPaginatedEnvelope,
	ApiPaginationMeta,
	PaginatedResult,
} from "./templates/dealer-template.types";

// ── Shared execution shapes ───────────────────────────────────────────
// The item / evidence / section / form shapes are identical for Dealer and
// Factory Audit and live in shared/execution. The Dealer* names are kept so
// dealer code reads naturally.

import type {
	AssessmentMode,
	AuditChecklistItem,
	AuditChecklistSection,
	AuditItemClarification,
	AuditItemEvidence,
	AuditItemReview,
	AuditItemSelf,
	AuditScoreLevel,
	ChecklistItemFormValues,
	ClarificationStatus,
	FinalScoreSource,
	ReviewItemFormValues,
	SlaState,
} from "../shared/execution/audit-execution.types";

export type {
	AssessmentMode,
	ChecklistItemFormValues,
	ClarificationStatus,
	FinalScoreSource,
	ReviewItemFormValues,
	SlaState,
};

export type DealerAuditEvidence = AuditItemEvidence;
export type DealerAuditScoreLevel = AuditScoreLevel;
export type DealerAuditItemSelf = AuditItemSelf;
export type DealerAuditItemReview = AuditItemReview;
export type DealerAuditItemClarification = AuditItemClarification;
export type DealerAuditChecklistItem = AuditChecklistItem;
export type DealerAuditSection = AuditChecklistSection;

// ── Roles ─────────────────────────────────────────────────────────────

export type DealerAuditRole =
	| "ADMIN"
	| "DEALER"
	| "REVIEWER"
	| "REVIEWER_MANAGER"
	| "APPROVER"
	| "AUDIT_MANAGER"
	| "READ_ONLY";

// ── Stable domain values ──────────────────────────────────────────────

/** One status vocabulary for the whole audit module. */
export type DealerAuditStatus = AuditInstanceStatus;

export type DealerAuditPeriodType = "QUARTERLY" | "YEARLY";
export type DealerAuditQuarter = 1 | 2 | 3 | 4;

/**
 * `year` is the YEAR THE FISCAL YEAR STARTS (FY 2026-27 → 2026) when the
 * fiscal start month in dealer-audit.config.ts is not January.
 */
export interface DealerAuditPeriod {
	type: DealerAuditPeriodType;
	year: number;
	quarter: DealerAuditQuarter | null;
}

export type DealerAuditHistoryAction =
	| "CREATED"
	| "ASSIGNED"
	| "REASSIGNED"
	| "STARTED"
	| "SUBMITTED"
	| "REVIEW_STARTED"
	| "ITEM_REVIEWED"
	| "CLARIFICATION_RAISED"
	| "CLARIFICATION_RESPONDED"
	| "RESUBMITTED"
	| "REVIEW_SUBMITTED"
	| "APPROVED"
	| "REJECTED"
	| "AUTO_FINALIZED"
	| "CLOSED"
	| "RE_AUDIT_CREATED"
	| "EXPIRED"
	| "CANCELLED";

// ── Raw API responses ─────────────────────────────────────────────────

export interface DealerAuditUserRefResponse {
	id: string;
	name: string;
}

export interface DealerAuditEvidenceResponse {
	id: string;
	url: string;
	thumbnail_url: string | null;
	file_name: string;
	size_bytes: number | null;
	mime_type: string | null;
	captured_at: string;
	latitude: number;
	longitude: number;
	accuracy_m: number | null;
}

export interface DealerAuditScoreLevelResponse {
	score: number;
	criteria: string;
}

export interface DealerAuditItemSelfResponse {
	score: number | null;
	remarks: string | null;
	evidence: DealerAuditEvidenceResponse[] | null;
	answered_at: string | null;
	/** Server-confirmed: all mandatory fields and evidence are satisfied. */
	is_complete: boolean;
}

export interface DealerAuditItemReviewResponse {
	score: number | null;
	remarks: string | null;
	decision: ReviewerItemDecision;
	score_change_reason: string | null;
	reviewed_at: string | null;
}

export interface DealerAuditItemClarificationResponse {
	id: string;
	status: ClarificationStatus;
	remarks: string;
	raised_at: string;
	due_at: string | null;
	response: string | null;
	responded_at: string | null;
}

export interface DealerAuditChecklistItemResponse {
	id: string;
	sequence: number;
	section_id: string;
	section_name: string;
	title: string;
	guidance: string | null;
	criteria: string[] | null;
	category: DealerParameterCategory | null;
	function_area: DealerParameterFunction | null;
	is_scored: boolean;
	score_levels: DealerAuditScoreLevelResponse[] | null;
	min_score: number | null;
	max_score: number | null;
	evidence_required: boolean;
	min_evidence_count: number | null;
	max_evidence_count: number | null;
	self: DealerAuditItemSelfResponse | null;
	/** Absent for DEALER users — the backend must not send it. */
	review: DealerAuditItemReviewResponse | null;
	clarification: DealerAuditItemClarificationResponse | null;
}

export interface DealerAuditSectionResponse {
	id: string;
	sequence: number;
	name: string;
	items: DealerAuditChecklistItemResponse[] | null;
}

export interface DealerAuditChecklistResponse {
	audit_id: string;
	dealer_name: string;
	dealer_code: string | null;
	location: string | null;
	status: DealerAuditStatus;
	version: number;
	sections: DealerAuditSectionResponse[] | null;
}

export interface DealerAuditListItemResponse {
	id: string;
	audit_number: string;
	dealer_id: string;
	dealer_code: string | null;
	dealer_name: string;
	location: string | null;
	facility_type: DealerFacilityType | null;
	template_name: string;
	template_version: number;
	period_type: DealerAuditPeriodType;
	period_year: number;
	period_quarter: DealerAuditQuarter | null;
	status: DealerAuditStatus;
	assigned_reviewer: DealerAuditUserRefResponse | null;
	due_at: string | null;
	completed_items: number;
	total_items: number;
	self_score: number | null;
	final_score: number | null;
	max_score: number;
	final_score_source: FinalScoreSource;
	open_clarification_count: number;
	updated_at: string;
}

export interface DealerAuditResponse extends DealerAuditListItemResponse {
	template_id: string;
	created_at: string;
	submitted_at: string | null;
	closed_at: string | null;
	version: number;
	/** When the backend job will finalise the audit with the initial score. */
	auto_finalize_at: string | null;
}

export interface DealerAuditHistoryEntryResponse {
	id: string;
	action: DealerAuditHistoryAction;
	actor_name: string;
	actor_role: string | null;
	occurred_at: string;
	from_status: DealerAuditStatus | null;
	to_status: DealerAuditStatus | null;
	comment: string | null;
}

export interface DealerAuditReportSectionResponse {
	section_id: string;
	name: string;
	score: number;
	max_score: number;
}

export interface DealerAuditReportResponse {
	audit_id: string;
	audit_number: string;
	dealer_name: string;
	dealer_code: string | null;
	location: string | null;
	period_type: DealerAuditPeriodType;
	period_year: number;
	period_quarter: DealerAuditQuarter | null;
	status: DealerAuditStatus;
	self_score: number | null;
	final_score: number | null;
	max_score: number;
	final_score_source: FinalScoreSource;
	sections: DealerAuditReportSectionResponse[] | null;
	generated_at: string;
	download_url: string | null;
}

export interface DealerAuditDealerOptionResponse {
	id: string;
	code: string | null;
	name: string;
	location: string | null;
	facility_type: DealerFacilityType | null;
}

export interface DealerAuditReviewerOptionResponse {
	id: string;
	name: string;
	designation: string | null;
}

/** Result of saving one item (raw). */
export interface SaveAuditItemResponse {
	item: DealerAuditChecklistItemResponse;
	audit_status: DealerAuditStatus;
	audit_version: number;
	completed_items: number;
	total_items: number;
}

// ── Normalized domain models ──────────────────────────────────────────

export interface DealerAuditUserRef {
	id: string;
	name: string;
}

export interface DealerAuditChecklist {
	auditId: string;
	dealerName: string;
	dealerCode: string | null;
	location: string;
	status: DealerAuditStatus;
	/** Optimistic-concurrency token — echoed back on submit/approve. */
	version: number;
	sections: DealerAuditSection[];
}

export interface DealerAuditListItem {
	id: string;
	auditNumber: string;
	dealerId: string;
	dealerCode: string | null;
	dealerName: string;
	location: string;
	facilityType: DealerFacilityType | null;
	templateName: string;
	templateVersion: number;
	period: DealerAuditPeriod;
	status: DealerAuditStatus;
	assignedReviewer: DealerAuditUserRef | null;
	dueAt: string | null;
	completedItems: number;
	totalItems: number;
	selfScore: number | null;
	finalScore: number | null;
	maxScore: number;
	finalScoreSource: FinalScoreSource;
	openClarificationCount: number;
	updatedAt: string;
}

export interface DealerAudit extends DealerAuditListItem {
	templateId: string;
	createdAt: string;
	submittedAt: string | null;
	closedAt: string | null;
	version: number;
	autoFinalizeAt: string | null;
}

export interface DealerAuditHistoryEntry {
	id: string;
	action: DealerAuditHistoryAction;
	actorName: string;
	actorRole: string | null;
	occurredAt: string;
	fromStatus: DealerAuditStatus | null;
	toStatus: DealerAuditStatus | null;
	comment: string | null;
}

export interface DealerAuditReportSection {
	sectionId: string;
	name: string;
	score: number;
	maxScore: number;
}

export interface DealerAuditReport {
	auditId: string;
	auditNumber: string;
	dealerName: string;
	dealerCode: string | null;
	location: string;
	period: DealerAuditPeriod;
	status: DealerAuditStatus;
	selfScore: number | null;
	finalScore: number | null;
	maxScore: number;
	finalScoreSource: FinalScoreSource;
	sections: DealerAuditReportSection[];
	generatedAt: string;
	downloadUrl: string | null;
}

export interface DealerAuditDealerOption {
	id: string;
	code: string | null;
	name: string;
	location: string;
	facilityType: DealerFacilityType | null;
}

export interface DealerAuditReviewerOption {
	id: string;
	name: string;
	designation: string | null;
}

/** Result of saving one item — enough to patch the cache without a refetch. */
export interface SaveAuditItemResult {
	item: DealerAuditChecklistItem;
	auditStatus: DealerAuditStatus;
	auditVersion: number;
	completedItems: number;
	totalItems: number;
}

// ── Editable form values ──────────────────────────────────────────────

export interface CreateDealerAuditFormValues {
	templateId: string;
	dealerIds: string[];
	reviewerId: string;
	periodType: DealerAuditPeriodType;
	year: number;
	quarter: DealerAuditQuarter | null;
	/** yyyy-mm-dd */
	dueDate: string;
}

// ── Request payloads (snake_case) ─────────────────────────────────────

export interface CreateDealerAuditPayload {
	template_id: string;
	dealer_ids: string[];
	reviewer_id: string;
	period_type: DealerAuditPeriodType;
	period_year: number;
	period_quarter: DealerAuditQuarter | null;
	due_date: string;
}

export interface SaveAuditItemPayload {
	score: number | null;
	remarks: string;
	/** Server ids of UPLOADED evidence only. */
	evidence_ids: string[];
	/** false = autosave draft, true = "Save & Next" / mark complete. */
	mark_complete: boolean;
}

export interface UploadEvidenceMeta {
	item_id: string;
	latitude: number;
	longitude: number;
	accuracy_m: number | null;
	captured_at: string;
}

export interface SubmitAuditPayload {
	version: number;
}

export interface ReviewAuditItemPayload {
	reviewer_score: number | null;
	reviewer_remarks: string;
	decision: ReviewerItemDecision;
	score_change_reason: string | null;
}

export interface RaiseClarificationPayload {
	item_ids: string[];
	remarks: string;
	version: number;
}

export interface RespondToClarificationPayload {
	item_id: string;
	response: string;
}

export interface SubmitReviewPayload {
	version: number;
}

export interface ApproveAuditPayload {
	remarks: string;
	version: number;
}

export interface RejectAuditPayload {
	reason: string;
	version: number;
}

export interface ReassignReviewerPayload {
	reviewer_id: string;
	reason: string;
}

export interface ReAuditPayload {
	reason: string;
	due_date: string;
}

// ── Query params / mutation variables ─────────────────────────────────

export type DealerAuditSortField =
	| "dueAt"
	| "updatedAt"
	| "dealerName"
	| "status";

export interface DealerAuditListParams {
	page: number;
	pageSize: number;
	search: string;
	statuses: DealerAuditStatus[];
	periodType: DealerAuditPeriodType | null;
	year: number | null;
	quarter: DealerAuditQuarter | null;
	sortBy: DealerAuditSortField;
	sortOrder: "asc" | "desc";
}

export interface SaveAuditItemVariables {
	auditId: string;
	itemId: string;
	values: ChecklistItemFormValues;
	markComplete: boolean;
}

export interface UploadEvidenceVariables {
	auditId: string;
	itemId: string;
	photo: LivePhotoValue;
	onProgress?: (percent: number) => void;
}

export interface DeleteEvidenceVariables {
	auditId: string;
	itemId: string;
	evidenceId: string;
}

export interface ReviewAuditItemVariables {
	auditId: string;
	itemId: string;
	values: ReviewItemFormValues;
}

export interface AuditVersionVariables {
	auditId: string;
	version: number;
}

export interface RaiseClarificationVariables extends AuditVersionVariables {
	itemIds: string[];
	remarks: string;
}

export interface RespondToClarificationVariables {
	auditId: string;
	itemId: string;
	response: string;
}

export interface ApproveAuditVariables extends AuditVersionVariables {
	remarks: string;
}

export interface RejectAuditVariables extends AuditVersionVariables {
	reason: string;
}

export interface ReassignReviewerVariables {
	auditId: string;
	reviewerId: string;
	reason: string;
}

export interface ReAuditVariables {
	auditId: string;
	reason: string;
	dueDate: string;
}
