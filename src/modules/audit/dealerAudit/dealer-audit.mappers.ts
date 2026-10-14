// modules/audit/dealerAudit/dealer-audit.mappers.ts
//
// Explicit shape conversion (instruction §7):
//   response → domain      mapXResponse
//   domain   → form        mapXToFormValues
//   form     → payload     mapFormToXPayload
//   params   → query       normalizeAuditListParams / toAuditListQuery
//
// Mappers normalise nulls, apply safe array defaults, keep ids exactly as
// received and never invent business data.

import type { LivePhotoValue } from "../shared/checklist/evidence.types";
import { mapEvidenceToPhoto } from "../shared/execution/audit-execution.mappers";
import { DEALER_AUDIT_RULES } from "./dealer-audit.config";
import type {
	ApiPaginatedEnvelope,
	ChecklistItemFormValues,
	CreateDealerAuditFormValues,
	CreateDealerAuditPayload,
	DealerAudit,
	DealerAuditChecklist,
	DealerAuditChecklistItem,
	DealerAuditChecklistItemResponse,
	DealerAuditChecklistResponse,
	DealerAuditDealerOption,
	DealerAuditDealerOptionResponse,
	DealerAuditEvidence,
	DealerAuditEvidenceResponse,
	DealerAuditHistoryEntry,
	DealerAuditHistoryEntryResponse,
	DealerAuditItemClarification,
	DealerAuditItemClarificationResponse,
	DealerAuditItemReview,
	DealerAuditItemReviewResponse,
	DealerAuditItemSelf,
	DealerAuditItemSelfResponse,
	DealerAuditListItem,
	DealerAuditListItemResponse,
	DealerAuditListParams,
	DealerAuditPeriod,
	DealerAuditQuarter,
	DealerAuditReport,
	DealerAuditReportResponse,
	DealerAuditResponse,
	DealerAuditReviewerOption,
	DealerAuditReviewerOptionResponse,
	DealerAuditScoreLevel,
	DealerAuditScoreLevelResponse,
	DealerAuditSection,
	DealerAuditSectionResponse,
	DealerAuditUserRef,
	DealerAuditUserRefResponse,
	PaginatedResult,
	ReAuditPayload,
	ReAuditVariables,
	ReassignReviewerPayload,
	ReassignReviewerVariables,
	ReviewAuditItemPayload,
	ReviewItemFormValues,
	SaveAuditItemPayload,
	SaveAuditItemResponse,
	SaveAuditItemResult,
	UploadEvidenceMeta,
} from "./dealer-audit.types";

const EMPTY_LOCATION = "";

// ── Small helpers ─────────────────────────────────────────────────────

const mapPeriod = (source: {
	period_type: DealerAuditPeriod["type"];
	period_year: number;
	period_quarter: DealerAuditQuarter | null;
}): DealerAuditPeriod => ({
	type: source.period_type,
	year: source.period_year,
	quarter: source.period_type === "YEARLY" ? null : source.period_quarter,
});

const mapUserRef = (
	response: DealerAuditUserRefResponse | null,
): DealerAuditUserRef | null =>
	response ? { id: response.id, name: response.name } : null;

// ── Evidence ──────────────────────────────────────────────────────────

export const mapEvidenceResponse = (
	response: DealerAuditEvidenceResponse,
): DealerAuditEvidence => ({
	id: response.id,
	url: response.url,
	thumbnailUrl: response.thumbnail_url ?? null,
	fileName: response.file_name,
	sizeBytes: response.size_bytes ?? null,
	mimeType: response.mime_type ?? null,
	capturedAt: response.captured_at,
	latitude: response.latitude,
	longitude: response.longitude,
	accuracyMeters: response.accuracy_m ?? null,
});

// ── Checklist ─────────────────────────────────────────────────────────

const mapScoreLevel = (
	response: DealerAuditScoreLevelResponse,
): DealerAuditScoreLevel => ({
	score: response.score,
	criteria: response.criteria,
});

const mapItemSelf = (
	response: DealerAuditItemSelfResponse | null,
): DealerAuditItemSelf => ({
	score: response?.score ?? null,
	remarks: response?.remarks ?? "",
	evidence: (response?.evidence ?? []).map(mapEvidenceResponse),
	answeredAt: response?.answered_at ?? null,
	isComplete: response?.is_complete ?? false,
});

const mapItemReview = (
	response: DealerAuditItemReviewResponse | null,
): DealerAuditItemReview | null =>
	response
		? {
				score: response.score ?? null,
				remarks: response.remarks ?? "",
				decision: response.decision,
				scoreChangeReason: response.score_change_reason ?? null,
				reviewedAt: response.reviewed_at ?? null,
			}
		: null;

const mapClarification = (
	response: DealerAuditItemClarificationResponse | null,
): DealerAuditItemClarification | null =>
	response
		? {
				id: response.id,
				status: response.status,
				remarks: response.remarks,
				raisedAt: response.raised_at,
				dueAt: response.due_at ?? null,
				response: response.response ?? null,
				respondedAt: response.responded_at ?? null,
			}
		: null;

const uniqueAscending = (values: number[]): number[] =>
	[...new Set(values)].sort((a, b) => a - b);

export const mapChecklistItemResponse = (
	response: DealerAuditChecklistItemResponse,
): DealerAuditChecklistItem => {
	const scoreLevels = (response.score_levels ?? []).map(mapScoreLevel);
	const allowedScores = uniqueAscending(scoreLevels.map((l) => l.score));

	// Per-parameter min / max win; levels are the fallback; never invented.
	const minScore =
		response.min_score ?? (allowedScores.length ? allowedScores[0] : 0);
	const maxScore =
		response.max_score ??
		(allowedScores.length ? allowedScores[allowedScores.length - 1] : 0);

	const rules = DEALER_AUDIT_RULES.evidence;
	const evidenceRequired = response.evidence_required;
	const minEvidenceCount = evidenceRequired
		? (response.min_evidence_count ?? rules.defaultMinCount)
		: 0;
	const maxEvidenceCount = Math.max(
		minEvidenceCount,
		response.max_evidence_count ?? rules.defaultMaxCount,
	);

	return {
		id: response.id,
		sequence: response.sequence,
		sectionId: response.section_id,
		sectionName: response.section_name,
		title: response.title,
		guidance: response.guidance ?? "",
		criteria: response.criteria ?? [],
		category: response.category ?? null,
		functionArea: response.function_area ?? null,
		isScored: response.is_scored,
		scoreLevels,
		allowedScores,
		minScore,
		maxScore,
		evidenceRequired,
		minEvidenceCount,
		maxEvidenceCount,
		self: mapItemSelf(response.self),
		review: mapItemReview(response.review),
		clarification: mapClarification(response.clarification),
	};
};

const mapSectionResponse = (
	response: DealerAuditSectionResponse,
): DealerAuditSection => ({
	id: response.id,
	sequence: response.sequence,
	name: response.name,
	items: (response.items ?? []).map(mapChecklistItemResponse),
});

export const mapChecklistResponse = (
	response: DealerAuditChecklistResponse,
): DealerAuditChecklist => ({
	auditId: response.audit_id,
	dealerName: response.dealer_name,
	dealerCode: response.dealer_code ?? null,
	location: response.location ?? EMPTY_LOCATION,
	status: response.status,
	version: response.version,
	sections: (response.sections ?? []).map(mapSectionResponse),
});

// ── Audit ─────────────────────────────────────────────────────────────

export const mapAuditListItemResponse = (
	response: DealerAuditListItemResponse,
): DealerAuditListItem => ({
	id: response.id,
	auditNumber: response.audit_number,
	dealerId: response.dealer_id,
	dealerCode: response.dealer_code ?? null,
	dealerName: response.dealer_name,
	location: response.location ?? EMPTY_LOCATION,
	facilityType: response.facility_type ?? null,
	templateName: response.template_name,
	templateVersion: response.template_version,
	period: mapPeriod(response),
	status: response.status,
	assignedReviewer: mapUserRef(response.assigned_reviewer),
	dueAt: response.due_at ?? null,
	completedItems: response.completed_items,
	totalItems: response.total_items,
	selfScore: response.self_score ?? null,
	finalScore: response.final_score ?? null,
	maxScore: response.max_score,
	finalScoreSource: response.final_score_source,
	openClarificationCount: response.open_clarification_count,
	updatedAt: response.updated_at,
});

export const mapDealerAuditResponse = (
	response: DealerAuditResponse,
): DealerAudit => ({
	...mapAuditListItemResponse(response),
	templateId: response.template_id,
	createdAt: response.created_at,
	submittedAt: response.submitted_at ?? null,
	closedAt: response.closed_at ?? null,
	version: response.version,
	autoFinalizeAt: response.auto_finalize_at ?? null,
});

export const mapHistoryEntryResponse = (
	response: DealerAuditHistoryEntryResponse,
): DealerAuditHistoryEntry => ({
	id: response.id,
	action: response.action,
	actorName: response.actor_name,
	actorRole: response.actor_role ?? null,
	occurredAt: response.occurred_at,
	fromStatus: response.from_status ?? null,
	toStatus: response.to_status ?? null,
	comment: response.comment ?? null,
});

export const mapReportResponse = (
	response: DealerAuditReportResponse,
): DealerAuditReport => ({
	auditId: response.audit_id,
	auditNumber: response.audit_number,
	dealerName: response.dealer_name,
	dealerCode: response.dealer_code ?? null,
	location: response.location ?? EMPTY_LOCATION,
	period: mapPeriod(response),
	status: response.status,
	selfScore: response.self_score ?? null,
	finalScore: response.final_score ?? null,
	maxScore: response.max_score,
	finalScoreSource: response.final_score_source,
	sections: (response.sections ?? []).map((section) => ({
		sectionId: section.section_id,
		name: section.name,
		score: section.score,
		maxScore: section.max_score,
	})),
	generatedAt: response.generated_at,
	downloadUrl: response.download_url ?? null,
});

export const mapDealerOptionResponse = (
	response: DealerAuditDealerOptionResponse,
): DealerAuditDealerOption => ({
	id: response.id,
	code: response.code ?? null,
	name: response.name,
	location: response.location ?? EMPTY_LOCATION,
	facilityType: response.facility_type ?? null,
});

export const mapReviewerOptionResponse = (
	response: DealerAuditReviewerOptionResponse,
): DealerAuditReviewerOption => ({
	id: response.id,
	name: response.name,
	designation: response.designation ?? null,
});

export const mapAuditListResponse = (
	envelope: ApiPaginatedEnvelope<DealerAuditListItemResponse>,
): PaginatedResult<DealerAuditListItem> => ({
	items: (envelope.data ?? []).map(mapAuditListItemResponse),
	page: envelope.meta.page,
	pageSize: envelope.meta.page_size,
	totalItems: envelope.meta.total_items,
	totalPages: envelope.meta.total_pages,
});

export const mapSaveAuditItemResponse = (
	response: SaveAuditItemResponse,
): SaveAuditItemResult => ({
	item: mapChecklistItemResponse(response.item),
	auditStatus: response.audit_status,
	auditVersion: response.audit_version,
	completedItems: response.completed_items,
	totalItems: response.total_items,
});

// ── Domain → form ─────────────────────────────────────────────────────

export const mapItemToFormValues = (
	item: DealerAuditChecklistItem,
): ChecklistItemFormValues => ({
	score: item.self.score,
	remarks: item.self.remarks,
	evidence: item.self.evidence.map(mapEvidenceToPhoto),
});

/**
 * Reviewer starts from the dealer's score so an unchanged score needs no
 * reason; a stored review always wins.
 */
export const mapItemToReviewFormValues = (
	item: DealerAuditChecklistItem,
): ReviewItemFormValues => ({
	score: item.review?.score ?? item.self.score,
	remarks: item.review?.remarks ?? "",
	decision: item.review?.decision ?? "PENDING",
	scoreChangeReason: item.review?.scoreChangeReason ?? "",
});

// ── Form → payload ────────────────────────────────────────────────────

/** Only server-confirmed (UPLOADED) evidence is ever referenced. */
export const mapFormToSaveItemPayload = (
	values: ChecklistItemFormValues,
	markComplete: boolean,
): SaveAuditItemPayload => ({
	score: values.score,
	remarks: values.remarks.trim(),
	evidence_ids: values.evidence
		.filter((photo) => photo.uploadStatus === "UPLOADED")
		.map((photo) => photo.id),
	mark_complete: markComplete,
});

export const mapPhotoToUploadMeta = (
	itemId: string,
	photo: LivePhotoValue,
): UploadEvidenceMeta | null => {
	if (!photo.location) return null; // location is mandatory
	return {
		item_id: itemId,
		latitude: photo.location.latitude,
		longitude: photo.location.longitude,
		accuracy_m: photo.location.accuracy ?? null,
		captured_at: photo.location.capturedAt,
	};
};

export const mapReviewFormToPayload = (
	values: ReviewItemFormValues,
	selfScore: number | null,
): ReviewAuditItemPayload => {
	const scoreChanged =
		values.score !== null && selfScore !== null && values.score !== selfScore;
	return {
		reviewer_score: values.score,
		reviewer_remarks: values.remarks.trim(),
		decision: values.decision,
		score_change_reason: scoreChanged
			? values.scoreChangeReason.trim() || null
			: null,
	};
};

export const mapFormToCreateAuditPayload = (
	values: CreateDealerAuditFormValues,
): CreateDealerAuditPayload => ({
	template_id: values.templateId,
	dealer_ids: [...values.dealerIds],
	reviewer_id: values.reviewerId,
	period_type: values.periodType,
	period_year: values.year,
	period_quarter: values.periodType === "YEARLY" ? null : values.quarter,
	due_date: values.dueDate,
});

export const mapReassignToPayload = (
	variables: ReassignReviewerVariables,
): ReassignReviewerPayload => ({
	reviewer_id: variables.reviewerId,
	reason: variables.reason.trim(),
});

export const mapReAuditToPayload = (
	variables: ReAuditVariables,
): ReAuditPayload => ({
	reason: variables.reason.trim(),
	due_date: variables.dueDate,
});

// ── List params ───────────────────────────────────────────────────────

export const DEFAULT_AUDIT_LIST_PARAMS: DealerAuditListParams = {
	page: 1,
	pageSize: DEALER_AUDIT_RULES.list.defaultPageSize,
	search: "",
	statuses: [],
	periodType: null,
	year: null,
	quarter: null,
	sortBy: "updatedAt",
	sortOrder: "desc",
};

/**
 * Equivalent filters must produce an identical query key: trim and
 * lower-case search, sort + de-duplicate statuses, drop a quarter that
 * does not apply to the period type.
 */
export const normalizeAuditListParams = (
	params: Partial<DealerAuditListParams> = {},
): DealerAuditListParams => {
	const merged = { ...DEFAULT_AUDIT_LIST_PARAMS, ...params };
	const periodType = merged.periodType;
	return {
		...merged,
		page: Math.max(1, Math.floor(merged.page)),
		pageSize: Math.max(1, Math.floor(merged.pageSize)),
		search: merged.search.trim().toLowerCase(),
		statuses: [...new Set(merged.statuses)].sort(),
		quarter: periodType === "YEARLY" ? null : merged.quarter,
	};
};

export type AuditListQuery = Record<string, string | number>;

/** Query-string shape for the backend (snake_case, empty values omitted). */
export const toAuditListQuery = (
	params: DealerAuditListParams,
): AuditListQuery => {
	const query: AuditListQuery = {
		page: params.page,
		page_size: params.pageSize,
		sort_by: params.sortBy,
		sort_order: params.sortOrder,
	};
	if (params.search) query.search = params.search;
	if (params.statuses.length) query.status = params.statuses.join(",");
	if (params.periodType) query.period_type = params.periodType;
	if (params.year !== null) query.period_year = params.year;
	if (params.quarter !== null) query.period_quarter = params.quarter;
	return query;
};
