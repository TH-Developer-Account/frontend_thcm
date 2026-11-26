// modules/audit/dealerAudit/templates/dealer-template.backend.ts
//
// Raw backend contract (camelCase, flat `parameters[]`) and its mapping to
// the frontend domain model. See claude/dealer-audit-template-api-contract.md.
// The rest of the UI never sees these shapes.

import type { TemplateLifecycleStatus } from "../../shared/templates/audit.template.types";
import type {
	CreateDealerChecklistTemplatePayload,
	DealerChecklistParameter,
	DealerChecklistTemplate,
	DealerChecklistTemplateListItem,
	DealerChecklistTemplateListParams,
	DealerFacilityType,
	PaginatedResult,
	UpdateDealerChecklistTemplatePayload,
} from "./dealer-template.types";

// ── Backend contract ──────────────────────────────────────────────────

export interface BackendEnvelope<T> {
	success?: boolean;
	message?: string;
	data: T;
}

export interface BackendScoreLevel {
	score: number;
	criteria: string;
}

export interface BackendParameter {
	id: string;
	order: number;
	functionName: string | null;
	categoryName: string | null;
	title: string;
	checkPoint: string | null;
	isScored: boolean;
	scoreLevels: BackendScoreLevel[] | null;
	evidenceRequired: boolean;
	minEvidenceCount: number | null;
	maxEvidenceCount: number | null;
	referencePhotoKey: string | null;
	referencePhotoUrl: string | null;
}

export interface BackendTemplate {
	id: string;
	name: string;
	description: string | null;
	officeType: DealerFacilityType | null;
	status: TemplateLifecycleStatus;
	version: number;
	totalScore: number | null;
	updatedAt: string | null;
	updatedByName: string | null;
	parameters: BackendParameter[] | null;
}

export interface BackendListItem {
	id: string;
	name: string;
	description: string | null;
	officeType: DealerFacilityType | null;
	status: TemplateLifecycleStatus;
	version: number;
	parameterCount: number | null;
	totalScore: number | null;
	updatedAt: string | null;
	updatedByName: string | null;
}

export interface BackendListResponse {
	success?: boolean;
	data: BackendListItem[] | null;
	meta?: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

export interface BackendTemplateBody {
	name: string;
	description: string | null;
	officeType: DealerFacilityType;
	parameters: CreateDealerChecklistTemplatePayload["parameters"];
	expectedUpdatedAt?: string;
}

export interface BackendReferencePhoto {
	key: string;
	url: string;
}

// ── Response → domain ─────────────────────────────────────────────────

const mapParameter = (parameter: BackendParameter): DealerChecklistParameter => ({
	id: parameter.id,
	sequence: parameter.order,
	title: parameter.title,
	// checkPoint is mandatory server-side; the builder fills it with the title
	// when no guidance was typed, so show that case as an empty guidance field.
	guidance:
		parameter.checkPoint && parameter.checkPoint !== parameter.title
			? parameter.checkPoint
			: "",
	functionArea: parameter.functionName ?? null,
	category: parameter.categoryName ?? null,
	isScored: parameter.isScored,
	scoreLevels: (parameter.scoreLevels ?? []).map((level) => ({
		score: level.score,
		criteria: level.criteria,
	})),
	evidenceRequired: parameter.evidenceRequired,
	minEvidenceCount: parameter.minEvidenceCount ?? null,
	maxEvidenceCount: parameter.maxEvidenceCount ?? null,
	referencePhotoKey: parameter.referencePhotoKey ?? null,
	referencePhotoUrl: parameter.referencePhotoUrl ?? null,
});

export const mapBackendTemplateToDomain = (
	response: BackendTemplate,
): DealerChecklistTemplate => ({
	id: response.id,
	name: response.name,
	description: response.description ?? "",
	facilityType: response.officeType ?? null,
	status: response.status,
	version: response.version,
	totalScore: response.totalScore ?? 0,
	updatedAt: response.updatedAt ?? null,
	updatedByName: response.updatedByName ?? null,
	parameters: [...(response.parameters ?? [])]
		.sort((a, b) => a.order - b.order)
		.map(mapParameter),
});

const mapListItem = (item: BackendListItem): DealerChecklistTemplateListItem => ({
	id: item.id,
	name: item.name,
	description: item.description ?? "",
	facilityType: item.officeType ?? null,
	status: item.status,
	version: item.version,
	parameterCount: item.parameterCount ?? 0,
	totalPoints: item.totalScore ?? 0,
	updatedAt: item.updatedAt ?? null,
	updatedByName: item.updatedByName ?? null,
});

export const mapBackendListToPaginated = (
	response: BackendListResponse,
): PaginatedResult<DealerChecklistTemplateListItem> => ({
	items: (response.data ?? []).map(mapListItem),
	page: response.meta?.page ?? 1,
	pageSize: response.meta?.pageSize ?? 0,
	totalItems: response.meta?.total ?? 0,
	totalPages: response.meta?.totalPages ?? 0,
});

// ── Domain payload → backend body ─────────────────────────────────────

export const mapCreatePayloadToBackendBody = (
	payload: CreateDealerChecklistTemplatePayload,
): BackendTemplateBody => {
	if (!payload.facilityType) {
		// The Details step validates this; fail loudly rather than send junk.
		throw new Error("Facility type is required to save a checklist draft.");
	}
	return {
		name: payload.name,
		description: payload.description,
		officeType: payload.facilityType,
		parameters: payload.parameters,
	};
};

export const mapUpdatePayloadToBackendBody = (
	payload: UpdateDealerChecklistTemplatePayload,
): BackendTemplateBody => ({
	...mapCreatePayloadToBackendBody(payload),
	...(payload.expectedUpdatedAt
		? { expectedUpdatedAt: payload.expectedUpdatedAt }
		: {}),
});

// ── List params → query string ────────────────────────────────────────

export const mapListParamsToQuery = (
	params: DealerChecklistTemplateListParams,
): Record<string, string | number> => {
	const query: Record<string, string | number> = {
		page: params.page,
		pageSize: params.pageSize,
		sortBy: params.sortBy,
		sortOrder: params.sortOrder,
	};
	if (params.search) query.search = params.search;
	// The backend filters by ONE status / facility type. The library UI only
	// ever sends one status (tabs) and two facility types exist, so selecting
	// both is the same as no filter.
	if (params.statuses.length === 1) query.status = params.statuses[0];
	if (params.facilityTypes.length === 1)
		query.officeType = params.facilityTypes[0];
	return query;
};
