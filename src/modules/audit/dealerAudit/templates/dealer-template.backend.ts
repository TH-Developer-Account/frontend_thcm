// modules/audit/dealerAudit/templates/dealer-template.backend.ts
//
// Adapter between the REAL backend contract (Express + Prisma, camelCase,
// flat `items[]`) and the frontend domain model (sections → parameters).
// The rest of the UI never sees backend shapes.
//
// ASSUMPTIONS (confirm with backend):
//  - Read responses are the Prisma rows: { id, name, officeType, status,
//    version, isActive, createdAt, updatedAt, items[] }.
//  - Item fields are exactly the ItemInput fields plus `id`.
//  - function_area, score levels (beyond max score + guidance) and evidence
//    min/max are NOT persisted yet — they arrive with the scoring-matrix
//    change. Until then they are not round-tripped.

import { TEMPLATE_DEFAULT_MAX_EVIDENCE, TEMPLATE_DEFAULT_MIN_EVIDENCE } from "../../shared/templates/audit-template.constants";
import type { TemplateLifecycleStatus } from "../../shared/templates/audit.template.types";
import type {
	CreateDealerChecklistTemplatePayload,
	DealerChecklistParameter,
	DealerChecklistSection,
	DealerChecklistTemplate,
	DealerChecklistTemplateListItem,
	DealerChecklistTemplateListParams,
	DealerFacilityType,
	DealerParameterCategory,
	PaginatedResult,
} from "./dealer-template.types";

// ── Backend contract ──────────────────────────────────────────────────

export interface BackendChecklistItemResponse {
	id: string;
	order: number;
	sectionName: string | null;
	label: string;
	checkPoint: string | null;
	category: DealerParameterCategory | null;
	requiresScore: boolean | null;
	requiresEvidence: boolean | null;
	maxScore: number | null;
	scoringGuidance: string | null;
}

export interface BackendChecklistTemplateResponse {
	id: string;
	name: string;
	officeType: DealerFacilityType | null;
	status: "DRAFT" | "PUBLISHED";
	version: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	items?: BackendChecklistItemResponse[] | null;
}

export interface BackendItemInput {
	order: number;
	sectionName: string;
	label: string;
	checkPoint: string;
	category?: DealerParameterCategory;
	requiresScore: boolean;
	requiresEvidence: boolean;
	maxScore?: number;
	scoringGuidance?: string;
}

export interface BackendCreateTemplateBody {
	name: string;
	officeType: DealerFacilityType;
	items: BackendItemInput[];
}

export interface BackendUpdateTemplateBody {
	name?: string;
	items?: BackendItemInput[];
}

// ── Placeholder item ──────────────────────────────────────────────────
//
// TEMPORARY: POST /templates rejects an empty `items` array, but the
// Details step only has name + facility type. A draft with no parameters
// yet carries ONE placeholder item, hidden again on read. Remove this
// (and the filter below) once the backend accepts empty drafts.

export const DRAFT_PLACEHOLDER_MARKER = "__DRAFT_PLACEHOLDER__";

const PLACEHOLDER_ITEM: BackendItemInput = {
	order: 1,
	sectionName: DRAFT_PLACEHOLDER_MARKER,
	label: DRAFT_PLACEHOLDER_MARKER,
	checkPoint: DRAFT_PLACEHOLDER_MARKER,
	requiresScore: false,
	requiresEvidence: false,
};

const isPlaceholderItem = (item: BackendChecklistItemResponse) =>
	item.sectionName === DRAFT_PLACEHOLDER_MARKER ||
	item.label === DRAFT_PLACEHOLDER_MARKER;

// ── Response → domain ─────────────────────────────────────────────────

const UNSECTIONED = "General";

const mapStatus = (
	template: BackendChecklistTemplateResponse,
): TemplateLifecycleStatus => {
	if (template.status === "DRAFT") return "DRAFT";
	return template.isActive ? "PUBLISHED" : "ARCHIVED";
};

const mapItemToParameter = (
	item: BackendChecklistItemResponse,
	sequence: number,
): DealerChecklistParameter => {
	const isScored = Boolean(item.requiresScore);
	const checkPoint = item.checkPoint ?? "";
	return {
		id: item.id,
		sequence,
		title: item.label,
		// checkPoint is mandatory server-side; when it merely mirrors the
		// label (no guidance was entered) show an empty guidance field.
		guidance: checkPoint === item.label ? "" : checkPoint,
		functionArea: null,
		category: item.category ?? null,
		isScored,
		// Only the max score + guidance are stored today; surface them as the
		// single top level so a re-save does not lose them.
		scoreLevels:
			isScored && item.maxScore != null
				? [{ score: item.maxScore, criteria: item.scoringGuidance ?? "" }]
				: [],
		evidenceRequired: Boolean(item.requiresEvidence),
		minEvidenceCount: item.requiresEvidence
			? TEMPLATE_DEFAULT_MIN_EVIDENCE
			: null,
		maxEvidenceCount: item.requiresEvidence
			? TEMPLATE_DEFAULT_MAX_EVIDENCE
			: null,
	};
};

const groupItemsIntoSections = (
	items: readonly BackendChecklistItemResponse[],
): DealerChecklistSection[] => {
	const sections: DealerChecklistSection[] = [];
	const byName = new Map<string, DealerChecklistSection>();

	[...items]
		.filter((item) => !isPlaceholderItem(item))
		.sort((a, b) => a.order - b.order)
		.forEach((item) => {
			const name = item.sectionName?.trim() || UNSECTIONED;
			let section = byName.get(name);
			if (!section) {
				section = {
					// Sections are not entities server-side; the name is the key.
					id: `section:${name}`,
					sequence: sections.length + 1,
					name,
					parameters: [],
				};
				byName.set(name, section);
				sections.push(section);
			}
			section.parameters.push(
				mapItemToParameter(item, section.parameters.length + 1),
			);
		});

	return sections;
};

export const mapBackendTemplateToDomain = (
	response: BackendChecklistTemplateResponse,
): DealerChecklistTemplate => ({
	id: response.id,
	name: response.name,
	description: "",
	facilityType: response.officeType ?? null,
	status: mapStatus(response),
	version: response.version,
	createdAt: response.createdAt,
	updatedAt: response.updatedAt ?? null,
	updatedByName: null,
	sections: groupItemsIntoSections(response.items ?? []),
});

export const mapBackendTemplateToListItem = (
	response: BackendChecklistTemplateResponse,
): DealerChecklistTemplateListItem => {
	const template = mapBackendTemplateToDomain(response);
	const parameters = template.sections.flatMap((section) => section.parameters);
	return {
		id: template.id,
		name: template.name,
		description: template.description,
		facilityType: template.facilityType,
		status: template.status,
		version: template.version,
		sectionCount: template.sections.length,
		parameterCount: parameters.length,
		totalPoints: parameters.reduce(
			(sum, parameter) =>
				sum + Math.max(0, ...parameter.scoreLevels.map((level) => level.score)),
			0,
		),
		updatedAt: template.updatedAt,
		updatedByName: null,
	};
};

// ── Domain payload → backend body ─────────────────────────────────────

const flattenToItems = (
	payload: CreateDealerChecklistTemplatePayload,
): BackendItemInput[] => {
	const items: BackendItemInput[] = [];

	payload.sections.forEach((section) => {
		section.parameters.forEach((parameter) => {
			const topLevel = [...parameter.score_levels].sort(
				(a, b) => b.score - a.score,
			)[0];
			items.push({
				order: items.length + 1,
				sectionName: section.name || UNSECTIONED,
				label: parameter.title,
				checkPoint: parameter.guidance ?? parameter.title,
				...(parameter.category ? { category: parameter.category } : {}),
				requiresScore: parameter.is_scored,
				requiresEvidence: parameter.evidence_required,
				...(parameter.is_scored && topLevel
					? {
							maxScore: topLevel.score,
							...(topLevel.criteria
								? { scoringGuidance: topLevel.criteria }
								: {}),
						}
					: {}),
			});
		});
	});

	return items.length ? items : [PLACEHOLDER_ITEM];
};

export const mapCreatePayloadToBackendBody = (
	payload: CreateDealerChecklistTemplatePayload,
): BackendCreateTemplateBody => {
	if (!payload.facility_type) {
		// The Details step validates this; fail loudly rather than send junk.
		throw new Error("Facility type is required to save a checklist draft.");
	}
	return {
		name: payload.name,
		officeType: payload.facility_type,
		items: flattenToItems(payload),
	};
};

export const mapUpdatePayloadToBackendBody = (
	payload: CreateDealerChecklistTemplatePayload,
): BackendUpdateTemplateBody => ({
	name: payload.name,
	items: flattenToItems(payload),
});

// ── List: backend returns a plain array, so page/search/sort client-side ──

const SORTERS: Record<
	DealerChecklistTemplateListParams["sortBy"],
	(a: DealerChecklistTemplateListItem, b: DealerChecklistTemplateListItem) => number
> = {
	name: (a, b) => a.name.localeCompare(b.name),
	status: (a, b) => a.status.localeCompare(b.status),
	version: (a, b) => a.version - b.version,
	updatedAt: (a, b) => (a.updatedAt ?? "").localeCompare(b.updatedAt ?? ""),
};

export const paginateBackendTemplates = (
	rows: readonly BackendChecklistTemplateResponse[],
	params: DealerChecklistTemplateListParams,
): PaginatedResult<DealerChecklistTemplateListItem> => {
	const search = params.search.toLowerCase();
	const filtered = rows
		.map(mapBackendTemplateToListItem)
		.filter(
			(row) =>
				(!search || row.name.toLowerCase().includes(search)) &&
				(!params.statuses.length || params.statuses.includes(row.status)) &&
				(!params.facilityTypes.length ||
					(row.facilityType !== null &&
						params.facilityTypes.includes(row.facilityType))),
		)
		.sort(SORTERS[params.sortBy]);

	if (params.sortOrder === "desc") filtered.reverse();

	const start = (params.page - 1) * params.pageSize;
	return {
		items: filtered.slice(start, start + params.pageSize),
		page: params.page,
		pageSize: params.pageSize,
		totalItems: filtered.length,
		totalPages: Math.ceil(filtered.length / params.pageSize),
	};
};
