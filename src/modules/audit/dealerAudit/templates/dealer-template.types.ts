// modules/audit/dealerAudit/templates/dealer-template.types.ts
//
// Dealer Audit checklist-template contracts (domain + request payloads).
// Deliberately NOT shared with Factory Audit — the two modules persist
// templates in different tables. Only the builder form shape is shared.
//
// Raw backend shapes live in dealer-template.backend.ts.

import type {
	AuditTemplateSortField,
	SortOrder,
	TemplateLifecycleStatus,
} from "../../shared/templates/audit.template.types";

export type DealerFacilityType = "HEAD_OFFICE" | "BRANCH_OFFICE";

// Function and Category are plain text on the server. The allowed values
// are maintained in dealer-template.config.ts.
export type DealerParameterFunction = string;
export type DealerParameterCategory = string;

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
	referencePhotoKey: string | null;
	referencePhotoUrl: string | null;
}

export interface DealerChecklistTemplate {
	id: string;
	name: string;
	description: string;
	facilityType: DealerFacilityType | null;
	status: TemplateLifecycleStatus;
	version: number;
	totalScore: number;
	/** Also the optimistic-concurrency token sent back on save. */
	updatedAt: string | null;
	updatedByName: string | null;
	parameters: DealerChecklistParameter[];
}

export interface DealerChecklistTemplateListItem {
	id: string;
	name: string;
	description: string;
	facilityType: DealerFacilityType | null;
	status: TemplateLifecycleStatus;
	version: number;
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
	functionName: string | null;
	categoryName: string | null;
	title: string;
	checkPoint: string;
	isScored: boolean;
	scoreLevels: DealerScoreLevel[];
	evidenceRequired: boolean;
	minEvidenceCount: number | null;
	maxEvidenceCount: number | null;
	referencePhotoKey: string | null;
}

export interface CreateDealerChecklistTemplatePayload {
	name: string;
	description: string | null;
	facilityType: DealerFacilityType | null;
	parameters: DealerChecklistParameterPayload[];
}

export interface UpdateDealerChecklistTemplatePayload
	extends CreateDealerChecklistTemplatePayload {
	/** Optimistic-concurrency guard — server returns 409 when stale. */
	expectedUpdatedAt: string | null;
}

// ── Query params / mutation variables ─────────────────────────────────

export interface DealerChecklistTemplateListParams {
	page: number;
	pageSize: number;
	search: string;
	statuses: TemplateLifecycleStatus[];
	facilityTypes: DealerFacilityType[];
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
}
