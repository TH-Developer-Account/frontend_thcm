// modules/audit/dealerAudit/templates/dealer-template.types.ts
//
// Dealer Audit checklist-template contracts. Deliberately NOT shared with
// Factory Audit — the two modules persist templates in different tables
// with different columns. Only the builder form shape is shared.
//
// ASSUMPTION: field names below follow the snake_case convention used by
// other MAP endpoints. Align with the backend contract when it lands —
// only this file and dealer-template.mappers.ts should need to change.

import type {
	AuditTemplateSortField,
	SortOrder,
	TemplateLifecycleStatus,
} from "../../shared/templates/audit.template.types";

export type DealerFacilityType = "HEAD_OFFICE" | "BRANCH_OFFICE";
export type DealerParameterFunction = "COMMON" | "SALES" | "SERVICE" | "PARTS";
export type DealerParameterCategory = "INFRA" | "PROCESS";

// ── Raw API responses ─────────────────────────────────────────────────

export interface DealerScoreLevelResponse {
	score: number;
	criteria: string;
}

export interface DealerChecklistParameterResponse {
	id: string;
	sequence: number;
	title: string;
	guidance: string | null;
	function_area: DealerParameterFunction | null;
	category: DealerParameterCategory | null;
	is_scored: boolean;
	score_levels: DealerScoreLevelResponse[] | null;
	evidence_required: boolean;
	min_evidence_count: number | null;
	max_evidence_count: number | null;
}

export interface DealerChecklistSectionResponse {
	id: string;
	sequence: number;
	name: string;
	parameters: DealerChecklistParameterResponse[] | null;
}

export interface DealerChecklistTemplateResponse {
	id: string;
	name: string;
	description: string | null;
	facility_type: DealerFacilityType | null;
	audit_category: string | null;
	status: TemplateLifecycleStatus;
	version: number;
	created_at: string;
	updated_at: string | null;
	updated_by_name: string | null;
	sections: DealerChecklistSectionResponse[] | null;
}

export interface DealerChecklistTemplateListItemResponse {
	id: string;
	name: string;
	description: string | null;
	facility_type: DealerFacilityType | null;
	audit_category: string | null;
	status: TemplateLifecycleStatus;
	version: number;
	section_count: number;
	parameter_count: number;
	total_points: number;
	updated_at: string | null;
	updated_by_name: string | null;
}

export interface ApiPaginationMeta {
	page: number;
	page_size: number;
	total_items: number;
	total_pages: number;
}

export interface ApiEnvelope<T> {
	success?: boolean;
	message?: string;
	data: T;
}

export interface ApiPaginatedEnvelope<T> extends ApiEnvelope<T[]> {
	meta: ApiPaginationMeta;
}

// ── Normalized domain models ──────────────────────────────────────────

export interface DealerScoreLevel {
	score: number;
	criteria: string;
}

export interface DealerChecklistParameter {
	id: string;
	sequence: number;
	title: string;
	guidance: string;
	functionArea: DealerParameterFunction | null;
	category: DealerParameterCategory | null;
	isScored: boolean;
	scoreLevels: DealerScoreLevel[];
	evidenceRequired: boolean;
	minEvidenceCount: number | null;
	maxEvidenceCount: number | null;
}

export interface DealerChecklistSection {
	id: string;
	sequence: number;
	name: string;
	parameters: DealerChecklistParameter[];
}

export interface DealerChecklistTemplate {
	id: string;
	name: string;
	description: string;
	facilityType: DealerFacilityType | null;
	auditCategory: string | null;
	status: TemplateLifecycleStatus;
	version: number;
	createdAt: string;
	updatedAt: string | null;
	updatedByName: string | null;
	sections: DealerChecklistSection[];
}

export interface DealerChecklistTemplateListItem {
	id: string;
	name: string;
	description: string;
	facilityType: DealerFacilityType | null;
	auditCategory: string | null;
	status: TemplateLifecycleStatus;
	version: number;
	sectionCount: number;
	parameterCount: number;
	totalPoints: number;
	updatedAt: string | null;
	updatedByName: string | null;
}

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
}

// ── Request payloads ──────────────────────────────────────────────────

export interface DealerChecklistParameterPayload {
	/** Present only for parameters that already exist on the server. */
	id?: string;
	sequence: number;
	title: string;
	guidance: string | null;
	function_area: DealerParameterFunction | null;
	category: DealerParameterCategory | null;
	is_scored: boolean;
	score_levels: DealerScoreLevelResponse[];
	evidence_required: boolean;
	min_evidence_count: number | null;
	max_evidence_count: number | null;
}

export interface DealerChecklistSectionPayload {
	id?: string;
	sequence: number;
	name: string;
	parameters: DealerChecklistParameterPayload[];
}

export interface CreateDealerChecklistTemplatePayload {
	name: string;
	description: string | null;
	facility_type: DealerFacilityType | null;
	audit_category: string | null;
	sections: DealerChecklistSectionPayload[];
}

export interface UpdateDealerChecklistTemplatePayload
	extends CreateDealerChecklistTemplatePayload {
	/** Optimistic-concurrency guard — server returns 409 on mismatch. */
	version: number;
}

// ── Query params / mutation variables ─────────────────────────────────

export interface DealerChecklistTemplateListParams {
	page: number;
	pageSize: number;
	search: string;
	statuses: TemplateLifecycleStatus[];
	facilityTypes: DealerFacilityType[];
	auditCategories: string[];
	sortBy: AuditTemplateSortField;
	sortOrder: SortOrder;
}

export interface UpdateDealerChecklistTemplateVariables {
	templateId: string;
	payload: UpdateDealerChecklistTemplatePayload;
}

/** FilterDropdown state for the library (string[] keys only). */
export interface DealerChecklistLibraryFilters {
	facilityTypes: string[];
	auditCategories: string[];
}
