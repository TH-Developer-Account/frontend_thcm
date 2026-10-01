// modules/audit/dealerAudit/templates/dealer-template.mappers.ts
//
// Dealer template shape conversion — the ONLY place that knows both the
// Dealer API contract and the shared builder form shape.
//
//   response ──▶ domain ──▶ builder form values ──▶ create/update payload

import {
	TEMPLATE_DEFAULT_MAX_EVIDENCE,
	TEMPLATE_DEFAULT_MIN_EVIDENCE,
} from "../../shared/templates/audit-template.constants";
import type {
	AuditTemplateBuilderValues,
	AuditTemplateListRow,
	AuditTemplateParameterFormValues,
	AuditTemplateSectionFormValues,
} from "../../shared/templates/audit.template.types";
import {
	createClientId,
	createEmptySection,
	createScoreLevel,
	getFieldOptionLabel,
	sortScoreLevels,
} from "../../shared/templates/audit-template.utils";
import {
	DEALER_DETAIL_FIELD_KEYS,
	DEALER_FACILITY_TYPE_OPTIONS,
	DEALER_PARAMETER_CATEGORY_OPTIONS,
	DEALER_PARAMETER_FIELD_KEYS,
	DEALER_PARAMETER_FUNCTION_OPTIONS,
	DEALER_TEMPLATE_DETAIL_FIELDS,
	DEALER_TEMPLATE_PARAMETER_FIELDS,
} from "./dealer-template.config";
import type {
	ApiPaginatedEnvelope,
	CreateDealerChecklistTemplatePayload,
	DealerChecklistLibraryFilters,
	DealerChecklistParameter,
	DealerChecklistParameterPayload,
	DealerChecklistParameterResponse,
	DealerChecklistSection,
	DealerChecklistSectionPayload,
	DealerChecklistSectionResponse,
	DealerChecklistTemplate,
	DealerChecklistTemplateListItem,
	DealerChecklistTemplateListItemResponse,
	DealerChecklistTemplateListParams,
	DealerChecklistTemplateResponse,
	DealerFacilityType,
	DealerParameterCategory,
	DealerParameterFunction,
	PaginatedResult,
	UpdateDealerChecklistTemplatePayload,
} from "./dealer-template.types";

// ── Type guards (narrow free-form form strings to API enums) ──────────

const isDealerFacilityType = (value: string): value is DealerFacilityType =>
	DEALER_FACILITY_TYPE_OPTIONS.some((option) => option.value === value);

const isDealerParameterFunction = (
	value: string,
): value is DealerParameterFunction =>
	DEALER_PARAMETER_FUNCTION_OPTIONS.some((option) => option.value === value);

const isDealerParameterCategory = (
	value: string,
): value is DealerParameterCategory =>
	DEALER_PARAMETER_CATEGORY_OPTIONS.some((option) => option.value === value);

const bySequence = <T extends { sequence: number }>(a: T, b: T) =>
	a.sequence - b.sequence;

const toNullableText = (value: string): string | null => {
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
};

// ── Response → domain ─────────────────────────────────────────────────

export const mapDealerChecklistParameterResponse = (
	response: DealerChecklistParameterResponse,
): DealerChecklistParameter => ({
	id: response.id,
	sequence: response.sequence,
	title: response.title,
	guidance: response.guidance ?? "",
	functionArea: response.function_area ?? null,
	category: response.category ?? null,
	isScored: response.is_scored,
	scoreLevels: (response.score_levels ?? []).map((level) => ({
		score: level.score,
		criteria: level.criteria,
	})),
	evidenceRequired: response.evidence_required,
	minEvidenceCount: response.min_evidence_count ?? null,
	maxEvidenceCount: response.max_evidence_count ?? null,
});

export const mapDealerChecklistSectionResponse = (
	response: DealerChecklistSectionResponse,
): DealerChecklistSection => ({
	id: response.id,
	sequence: response.sequence,
	name: response.name,
	parameters: (response.parameters ?? [])
		.map(mapDealerChecklistParameterResponse)
		.sort(bySequence),
});

export const mapDealerChecklistTemplateResponse = (
	response: DealerChecklistTemplateResponse,
): DealerChecklistTemplate => ({
	id: response.id,
	name: response.name,
	description: response.description ?? "",
	facilityType: response.facility_type ?? null,
	auditCategory: response.audit_category ?? null,
	status: response.status,
	version: response.version,
	createdAt: response.created_at,
	updatedAt: response.updated_at ?? null,
	updatedByName: response.updated_by_name ?? null,
	sections: (response.sections ?? [])
		.map(mapDealerChecklistSectionResponse)
		.sort(bySequence),
});

export const mapDealerChecklistTemplateListItemResponse = (
	response: DealerChecklistTemplateListItemResponse,
): DealerChecklistTemplateListItem => ({
	id: response.id,
	name: response.name,
	description: response.description ?? "",
	facilityType: response.facility_type ?? null,
	auditCategory: response.audit_category ?? null,
	status: response.status,
	version: response.version,
	sectionCount: response.section_count ?? 0,
	parameterCount: response.parameter_count ?? 0,
	totalPoints: response.total_points ?? 0,
	updatedAt: response.updated_at ?? null,
	updatedByName: response.updated_by_name ?? null,
});

export const mapDealerChecklistTemplateListResponse = (
	response: ApiPaginatedEnvelope<DealerChecklistTemplateListItemResponse>,
): PaginatedResult<DealerChecklistTemplateListItem> => ({
	items: (response.data ?? []).map(mapDealerChecklistTemplateListItemResponse),
	page: response.meta?.page ?? 1,
	pageSize: response.meta?.page_size ?? 0,
	totalItems: response.meta?.total_items ?? 0,
	totalPages: response.meta?.total_pages ?? 0,
});

// ── Domain → builder form values ──────────────────────────────────────

const mapParameterToForm = (
	parameter: DealerChecklistParameter,
): AuditTemplateParameterFormValues => ({
	id: createClientId(),
	serverId: parameter.id,
	title: parameter.title,
	guidance: parameter.guidance,
	attributes: {
		[DEALER_PARAMETER_FIELD_KEYS.functionArea]: parameter.functionArea ?? "",
		[DEALER_PARAMETER_FIELD_KEYS.category]: parameter.category ?? "",
	},
	isScored: parameter.isScored,
	scoreLevels: sortScoreLevels(parameter.scoreLevels).map((level) =>
		createScoreLevel(level.score, level.criteria),
	),
	evidenceRequired: parameter.evidenceRequired,
	minEvidenceCount: parameter.minEvidenceCount ?? TEMPLATE_DEFAULT_MIN_EVIDENCE,
	maxEvidenceCount: parameter.maxEvidenceCount ?? TEMPLATE_DEFAULT_MAX_EVIDENCE,
});

const mapSectionToForm = (
	section: DealerChecklistSection,
): AuditTemplateSectionFormValues => ({
	id: createClientId(),
	serverId: section.id,
	name: section.name,
	parameters: section.parameters.map(mapParameterToForm),
});

export const mapDealerTemplateToBuilderValues = (
	template: DealerChecklistTemplate,
): AuditTemplateBuilderValues => {
	const sections = template.sections.map(mapSectionToForm);

	return {
		details: {
			name: template.name,
			description: template.description,
			fields: {
				[DEALER_DETAIL_FIELD_KEYS.facilityType]: template.facilityType ?? "",
				[DEALER_DETAIL_FIELD_KEYS.auditCategory]: template.auditCategory ?? "",
			},
		},
		// A draft saved from the Details step has no sections yet — give the
		// Build step a blank one to start from (UI-only, never persisted blank).
		sections: sections.length
			? sections
			: [createEmptySection(DEALER_TEMPLATE_PARAMETER_FIELDS)],
	};
};

// ── Builder form values → payload ─────────────────────────────────────

const isBlankParameter = (parameter: AuditTemplateParameterFormValues) =>
	!parameter.title.trim() && !parameter.guidance.trim();

/** A section the user never touched (default blank row) is not sent. */
const isBlankSection = (section: AuditTemplateSectionFormValues) =>
	!section.name.trim() && section.parameters.every(isBlankParameter);

const mapParameterToPayload = (
	parameter: AuditTemplateParameterFormValues,
	sequence: number,
): DealerChecklistParameterPayload => {
	const functionArea =
		parameter.attributes[DEALER_PARAMETER_FIELD_KEYS.functionArea] ?? "";
	const category = parameter.attributes[DEALER_PARAMETER_FIELD_KEYS.category] ?? "";

	return {
		...(parameter.serverId ? { id: parameter.serverId } : {}),
		sequence,
		title: parameter.title.trim(),
		guidance: toNullableText(parameter.guidance),
		function_area: isDealerParameterFunction(functionArea) ? functionArea : null,
		category: isDealerParameterCategory(category) ? category : null,
		is_scored: parameter.isScored,
		score_levels: parameter.isScored
			? sortScoreLevels(parameter.scoreLevels).map((level) => ({
					score: level.score,
					criteria: level.criteria.trim(),
				}))
			: [],
		evidence_required: parameter.evidenceRequired,
		min_evidence_count: parameter.evidenceRequired
			? parameter.minEvidenceCount
			: null,
		max_evidence_count: parameter.evidenceRequired
			? parameter.maxEvidenceCount
			: null,
	};
};

const mapSectionToPayload = (
	section: AuditTemplateSectionFormValues,
	sequence: number,
): DealerChecklistSectionPayload => ({
	...(section.serverId ? { id: section.serverId } : {}),
	sequence,
	name: section.name.trim(),
	parameters: section.parameters
		.filter((parameter) => !isBlankParameter(parameter))
		.map((parameter, index) => mapParameterToPayload(parameter, index + 1)),
});

export const mapBuilderValuesToCreateDealerTemplatePayload = (
	values: AuditTemplateBuilderValues,
): CreateDealerChecklistTemplatePayload => {
	const facilityType =
		values.details.fields[DEALER_DETAIL_FIELD_KEYS.facilityType] ?? "";
	const auditCategory =
		values.details.fields[DEALER_DETAIL_FIELD_KEYS.auditCategory] ?? "";

	return {
		name: values.details.name.trim(),
		description: toNullableText(values.details.description),
		facility_type: isDealerFacilityType(facilityType) ? facilityType : null,
		audit_category: toNullableText(auditCategory),
		sections: values.sections
			.filter((section) => !isBlankSection(section))
			.map((section, index) => mapSectionToPayload(section, index + 1)),
	};
};

export const mapBuilderValuesToUpdateDealerTemplatePayload = (
	values: AuditTemplateBuilderValues,
	version: number,
): UpdateDealerChecklistTemplatePayload => ({
	...mapBuilderValuesToCreateDealerTemplatePayload(values),
	version,
});

// ── Listing ───────────────────────────────────────────────────────────

const facilityTypeField = DEALER_TEMPLATE_DETAIL_FIELDS.find(
	(config) => config.key === DEALER_DETAIL_FIELD_KEYS.facilityType,
);
const auditCategoryField = DEALER_TEMPLATE_DETAIL_FIELDS.find(
	(config) => config.key === DEALER_DETAIL_FIELD_KEYS.auditCategory,
);

export const mapDealerTemplateListItemToRow = (
	item: DealerChecklistTemplateListItem,
): AuditTemplateListRow => ({
	id: item.id,
	name: item.name,
	description: item.description,
	status: item.status,
	version: item.version,
	sectionCount: item.sectionCount,
	parameterCount: item.parameterCount,
	totalPoints: item.totalPoints,
	updatedAt: item.updatedAt,
	updatedByName: item.updatedByName,
	fieldLabels: {
		[DEALER_DETAIL_FIELD_KEYS.facilityType]: facilityTypeField
			? getFieldOptionLabel(facilityTypeField, item.facilityType ?? "")
			: "",
		[DEALER_DETAIL_FIELD_KEYS.auditCategory]: auditCategoryField
			? getFieldOptionLabel(auditCategoryField, item.auditCategory ?? "")
			: "",
	},
});

// ── List params (normalized so equal filters share one cache entry) ───

export const DEFAULT_DEALER_TEMPLATE_LIST_PARAMS: DealerChecklistTemplateListParams =
	{
		page: 1,
		pageSize: 10,
		search: "",
		statuses: [],
		facilityTypes: [],
		auditCategories: [],
		sortBy: "updatedAt",
		sortOrder: "desc",
	};

const uniqueSorted = <T extends string>(values: readonly T[]): T[] =>
	Array.from(new Set(values)).sort();

export const normalizeDealerTemplateListParams = (
	params: DealerChecklistTemplateListParams,
): DealerChecklistTemplateListParams => ({
	page: Math.max(1, Math.trunc(params.page) || 1),
	pageSize: Math.max(1, Math.trunc(params.pageSize) || 10),
	search: params.search.trim().replace(/\s+/g, " "),
	statuses: uniqueSorted(params.statuses),
	facilityTypes: uniqueSorted(params.facilityTypes),
	auditCategories: uniqueSorted(params.auditCategories),
	sortBy: params.sortBy,
	sortOrder: params.sortOrder,
});

export const mapFiltersToListParams = (
	filters: DealerChecklistLibraryFilters,
): Pick<DealerChecklistTemplateListParams, "facilityTypes" | "auditCategories"> => ({
	facilityTypes: filters.facilityTypes.filter(isDealerFacilityType),
	auditCategories: [...filters.auditCategories],
});

const SORT_FIELD_TO_API: Record<DealerChecklistTemplateListParams["sortBy"], string> =
	{
		name: "name",
		status: "status",
		version: "version",
		updatedAt: "updated_at",
	};

/** Query-string shape sent to GET /templates. */
export const mapDealerTemplateListParamsToQuery = (
	params: DealerChecklistTemplateListParams,
): Record<string, string | number> => {
	const query: Record<string, string | number> = {
		page: params.page,
		page_size: params.pageSize,
		sort_by: SORT_FIELD_TO_API[params.sortBy],
		sort_order: params.sortOrder,
	};
	if (params.search) query.search = params.search;
	if (params.statuses.length) query.status = params.statuses.join(",");
	if (params.facilityTypes.length)
		query.facility_type = params.facilityTypes.join(",");
	if (params.auditCategories.length)
		query.audit_category = params.auditCategories.join(",");
	return query;
};
