// modules/audit/dealerAudit/templates/dealer-template.mock.ts
//
// TEMPORARY in-memory adapter — enabled only when
// VITE_DEALER_AUDIT_USE_MOCK=true. Implements the same DealerTemplateApi
// contract as the HTTP adapter and speaks the RAW response shape, so the
// real mappers are exercised. Delete this file once the API is live.

import type { DealerTemplateApi } from "./dealer-template.api";
import {
	mapDealerChecklistTemplateListResponse,
	mapDealerChecklistTemplateResponse,
} from "./dealer-template.mappers";
import type {
	CreateDealerChecklistTemplatePayload,
	DealerChecklistParameterResponse,
	DealerChecklistSectionResponse,
	DealerChecklistTemplateListItemResponse,
	DealerChecklistTemplateResponse,
} from "./dealer-template.types";

const MOCK_LATENCY_MS = 450;

const wait = (signal?: AbortSignal) =>
	new Promise<void>((resolve, reject) => {
		const timer = window.setTimeout(resolve, MOCK_LATENCY_MS);
		signal?.addEventListener("abort", () => {
			window.clearTimeout(timer);
			reject(new DOMException("Aborted", "AbortError"));
		});
	});

/** Mirrors the axios error shape the shared API-error helper reads. */
const httpError = (status: number, message: string) => ({
	response: { status, data: { success: false, statusCode: status, message } },
	message,
});

const nowIso = () => new Date().toISOString();

// ── Seed data (from Format-HO Audit.xlsx, trimmed) ────────────────────

const yesNo = [
	{ score: 5, criteria: "Yes" },
	{ score: 0, criteria: "No" },
];
const dimThreeStep = [
	{ score: 5, criteria: "As per DIM" },
	{ score: 3, criteria: "With branding (not as per DIM)" },
	{ score: 0, criteria: "Else" },
];

const param = (
	id: string,
	sequence: number,
	title: string,
	guidance: string,
	functionArea: DealerChecklistParameterResponse["function_area"],
	category: DealerChecklistParameterResponse["category"],
	scoreLevels: DealerChecklistParameterResponse["score_levels"],
	evidence = true,
): DealerChecklistParameterResponse => ({
	id,
	sequence,
	title,
	guidance,
	function_area: functionArea,
	category,
	is_scored: Boolean(scoreLevels?.length),
	score_levels: scoreLevels,
	evidence_required: evidence,
	min_evidence_count: evidence ? 1 : null,
	max_evidence_count: evidence ? 3 : null,
});

const store = new Map<string, DealerChecklistTemplateResponse>();

const seed = (template: DealerChecklistTemplateResponse) =>
	store.set(template.id, template);

seed({
	id: "tpl-ho-infra",
	name: "Head Office — Facility & Infrastructure",
	description: "Standard assessment for dealer head office customer and parts areas.",
	facility_type: "HEAD_OFFICE",
	audit_category: "FACILITY",
	status: "PUBLISHED",
	version: 3,
	created_at: "2026-06-02T09:00:00.000Z",
	updated_at: "2026-09-14T10:30:00.000Z",
	updated_by_name: "Riya Shah",
	sections: [
		{
			id: "sec-ho-common",
			sequence: 1,
			name: "Common Areas",
			parameters: [
				param("p-ho-1", 1, "Reception Counter", "Reception table & Tata Hitachi backdrop", "COMMON", "INFRA", dimThreeStep),
				param("p-ho-2", 2, "Managers Area", "Clearly demarcated area for each function", "COMMON", "INFRA", yesNo),
				param("p-ho-3", 3, "Workstation for Sales & Service personnel", "As per employees based at location", "COMMON", "INFRA", [
					{ score: 5, criteria: "50%" },
					{ score: 4, criteria: "40–49%" },
					{ score: 3, criteria: "30–39%" },
					{ score: 0, criteria: "Else" },
				]),
				param("p-ho-4", 4, "Cleanliness outside entrance", "Visual appeal", "COMMON", "PROCESS", yesNo, false),
			],
		},
		{
			id: "sec-ho-parts",
			sequence: 2,
			name: "Parts",
			parameters: [
				param("p-ho-5", 1, "Steel Racks", "Parts segregated in bins with the same pigeon hole", "PARTS", "INFRA", yesNo),
				param("p-ho-6", 2, "Storage location for Lubes", "Demarcated location", "PARTS", "INFRA", yesNo),
			],
		},
	],
});

seed({
	id: "tpl-bo-infra",
	name: "Branch Office — Facility & Infrastructure",
	description: "Branch office variant with residential / commercial checks.",
	facility_type: "BRANCH_OFFICE",
	audit_category: "FACILITY",
	status: "DRAFT",
	version: 1,
	created_at: "2026-09-20T09:00:00.000Z",
	updated_at: "2026-09-29T08:15:00.000Z",
	updated_by_name: "Pranav Das",
	sections: [
		{
			id: "sec-bo-common",
			sequence: 1,
			name: "Common Areas",
			parameters: [
				param("p-bo-1", 1, "Branch Office Category", "Commercial complex or residential", "COMMON", "PROCESS", [
					{ score: 5, criteria: "Commercial building" },
					{ score: 0, criteria: "Residential building" },
				], false),
				param("p-bo-2", 2, "Availability of Letter head", "Inspect", "COMMON", "PROCESS", null, false),
			],
		},
	],
});

seed({
	id: "tpl-workshop",
	name: "Service Workshop Operations",
	description: "Tools, bay discipline, PPE and technician process checks.",
	facility_type: "BRANCH_OFFICE",
	audit_category: "WORKSHOP",
	status: "ARCHIVED",
	version: 2,
	created_at: "2026-03-10T09:00:00.000Z",
	updated_at: "2026-08-01T12:00:00.000Z",
	updated_by_name: "Priya Mehta",
	sections: [
		{
			id: "sec-ws-tools",
			sequence: 1,
			name: "Tools & Equipment",
			parameters: [
				param("p-ws-1", 1, "Calibrated tools within validity", "Check calibration stickers on torque wrenches", "SERVICE", "PROCESS", [
					{ score: 5, criteria: "All tools calibrated" },
					{ score: 3, criteria: "Minor lapses" },
					{ score: 1, criteria: "Major lapses" },
				]),
			],
		},
	],
});

// ── Helpers ───────────────────────────────────────────────────────────

const sectionsFromPayload = (
	templateId: string,
	payload: CreateDealerChecklistTemplatePayload,
): DealerChecklistSectionResponse[] =>
	payload.sections.map((section, sectionIndex) => ({
		id: section.id ?? `${templateId}-sec-${crypto.randomUUID()}`,
		sequence: section.sequence ?? sectionIndex + 1,
		name: section.name,
		parameters: section.parameters.map((parameter) => ({
			id: parameter.id ?? `${templateId}-par-${crypto.randomUUID()}`,
			sequence: parameter.sequence,
			title: parameter.title,
			guidance: parameter.guidance,
			function_area: parameter.function_area,
			category: parameter.category,
			is_scored: parameter.is_scored,
			score_levels: parameter.score_levels,
			evidence_required: parameter.evidence_required,
			min_evidence_count: parameter.min_evidence_count,
			max_evidence_count: parameter.max_evidence_count,
		})),
	}));

const toListItem = (
	template: DealerChecklistTemplateResponse,
): DealerChecklistTemplateListItemResponse => {
	const parameters = (template.sections ?? []).flatMap(
		(section) => section.parameters ?? [],
	);
	return {
		id: template.id,
		name: template.name,
		description: template.description,
		facility_type: template.facility_type,
		audit_category: template.audit_category,
		status: template.status,
		version: template.version,
		section_count: template.sections?.length ?? 0,
		parameter_count: parameters.length,
		total_points: parameters.reduce(
			(sum, parameter) =>
				sum +
				(parameter.is_scored && parameter.score_levels?.length
					? Math.max(...parameter.score_levels.map((level) => level.score))
					: 0),
			0,
		),
		updated_at: template.updated_at,
		updated_by_name: template.updated_by_name,
	};
};

const getOrThrow = (templateId: string) => {
	const template = store.get(templateId);
	if (!template) throw httpError(404, "Template not found");
	return template;
};

// ── Adapter ───────────────────────────────────────────────────────────

export const mockDealerTemplateApi: DealerTemplateApi = {
	getTemplates: async (params, signal) => {
		await wait(signal);
		const search = params.search.toLowerCase();

		const filtered = Array.from(store.values())
			.filter((template) => !params.statuses.length || params.statuses.includes(template.status))
			.filter(
				(template) =>
					!params.facilityTypes.length ||
					(template.facility_type !== null &&
						params.facilityTypes.includes(template.facility_type)),
			)
			.filter(
				(template) =>
					!params.auditCategories.length ||
					(template.audit_category !== null &&
						params.auditCategories.includes(template.audit_category)),
			)
			.filter(
				(template) =>
					!search ||
					`${template.name} ${template.description ?? ""}`
						.toLowerCase()
						.includes(search),
			)
			.map(toListItem);

		const direction = params.sortOrder === "asc" ? 1 : -1;
		filtered.sort((a, b) => {
			switch (params.sortBy) {
				case "name":
					return a.name.localeCompare(b.name) * direction;
				case "status":
					return a.status.localeCompare(b.status) * direction;
				case "version":
					return (a.version - b.version) * direction;
				case "updatedAt":
					return (a.updated_at ?? "").localeCompare(b.updated_at ?? "") * direction;
				default:
					return 0;
			}
		});

		const totalItems = filtered.length;
		const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
		const start = (params.page - 1) * params.pageSize;

		return mapDealerChecklistTemplateListResponse({
			data: filtered.slice(start, start + params.pageSize),
			meta: {
				page: params.page,
				page_size: params.pageSize,
				total_items: totalItems,
				total_pages: totalPages,
			},
		});
	},

	getTemplate: async (templateId, signal) => {
		await wait(signal);
		return mapDealerChecklistTemplateResponse(structuredClone(getOrThrow(templateId)));
	},

	createTemplate: async (payload) => {
		await wait();
		const id = `tpl-${crypto.randomUUID()}`;
		const template: DealerChecklistTemplateResponse = {
			id,
			name: payload.name,
			description: payload.description,
			facility_type: payload.facility_type,
			audit_category: payload.audit_category,
			status: "DRAFT",
			version: 1,
			created_at: nowIso(),
			updated_at: nowIso(),
			updated_by_name: "You",
			sections: sectionsFromPayload(id, payload),
		};
		store.set(id, template);
		return mapDealerChecklistTemplateResponse(structuredClone(template));
	},

	updateTemplate: async ({ templateId, payload }) => {
		await wait();
		const existing = getOrThrow(templateId);
		if (existing.version !== payload.version) {
			throw httpError(409, "This template was updated by another user.");
		}

		// Published versions are immutable: editing one starts the next draft version.
		const nextVersion =
			existing.status === "PUBLISHED" ? existing.version + 1 : existing.version;

		const updated: DealerChecklistTemplateResponse = {
			...existing,
			name: payload.name,
			description: payload.description,
			facility_type: payload.facility_type,
			audit_category: payload.audit_category,
			status: "DRAFT",
			version: nextVersion,
			updated_at: nowIso(),
			updated_by_name: "You",
			sections: sectionsFromPayload(templateId, payload),
		};
		store.set(templateId, updated);
		return mapDealerChecklistTemplateResponse(structuredClone(updated));
	},

	publishTemplate: async (templateId) => {
		await wait();
		const existing = getOrThrow(templateId);
		const parameterCount = (existing.sections ?? []).reduce(
			(sum, section) => sum + (section.parameters?.length ?? 0),
			0,
		);
		if (parameterCount === 0) {
			throw httpError(422, "Add at least one parameter before publishing.");
		}
		const published = { ...existing, status: "PUBLISHED" as const, updated_at: nowIso() };
		store.set(templateId, published);
		return mapDealerChecklistTemplateResponse(structuredClone(published));
	},

	deleteTemplate: async (templateId) => {
		await wait();
		getOrThrow(templateId);
		store.delete(templateId);
	},
};
