// modules/audit/dealerAudit/templates/dealer-template.api.ts
//
// Dealer checklist-template HTTP operations. Typed in, typed (domain) out.
// No toasts, navigation or cache updates here — hooks own that.
//
// Talks to the real backend (camelCase, `{ success, data }` envelope) via
// dealer-template.backend.ts. Set VITE_DEALER_AUDIT_USE_MOCK=true to run the
// UI against the isolated in-memory adapter instead.
//
// ASSUMPTION: the dealer-audit router is mounted at /dealer-audit.

import { ServerAxios } from "../../../../services/ServerAxios";
import {
	mapBackendTemplateToDomain,
	mapCreatePayloadToBackendBody,
	mapUpdatePayloadToBackendBody,
	paginateBackendTemplates,
	type BackendChecklistTemplateResponse,
	type BackendCreateTemplateBody,
	type BackendUpdateTemplateBody,
} from "./dealer-template.backend";
import { mockDealerTemplateApi } from "./dealer-template.mock";
import type {
	ApiEnvelope,
	CreateDealerChecklistTemplatePayload,
	DealerChecklistTemplate,
	DealerChecklistTemplateListItem,
	DealerChecklistTemplateListParams,
	PaginatedResult,
	UpdateDealerChecklistTemplateVariables,
} from "./dealer-template.types";

const TEMPLATE_BASE_PATH = "/dealer-audit/templates";

const templatePath = (templateId: string) =>
	`${TEMPLATE_BASE_PATH}/${encodeURIComponent(templateId)}`;

export interface DealerTemplateApi {
	getTemplates: (
		params: DealerChecklistTemplateListParams,
		signal?: AbortSignal,
	) => Promise<PaginatedResult<DealerChecklistTemplateListItem>>;
	getTemplate: (
		templateId: string,
		signal?: AbortSignal,
	) => Promise<DealerChecklistTemplate>;
	createTemplate: (
		payload: CreateDealerChecklistTemplatePayload,
	) => Promise<DealerChecklistTemplate>;
	updateTemplate: (
		variables: UpdateDealerChecklistTemplateVariables,
	) => Promise<DealerChecklistTemplate>;
	publishTemplate: (templateId: string) => Promise<DealerChecklistTemplate>;
	deleteTemplate: (templateId: string) => Promise<void>;
}

const httpDealerTemplateApi: DealerTemplateApi = {
	getTemplates: async (params, signal) => {
		// Backend filters only by officeType/isActive and returns a plain
		// array, so search / status / paging / sort are applied client-side.
		const response = await ServerAxios.get<
			ApiEnvelope<BackendChecklistTemplateResponse[]>
		>(TEMPLATE_BASE_PATH, { signal });
		return paginateBackendTemplates(response.data.data ?? [], params);
	},

	getTemplate: async (templateId, signal) => {
		const response = await ServerAxios.get<
			ApiEnvelope<BackendChecklistTemplateResponse>
		>(templatePath(templateId), { signal });
		return mapBackendTemplateToDomain(response.data.data);
	},

	// POST /templates — creates DRAFT v1.
	createTemplate: async (payload) => {
		const body = mapCreatePayloadToBackendBody(payload);
		const response = await ServerAxios.post<
			ApiEnvelope<BackendChecklistTemplateResponse>,
			BackendCreateTemplateBody
		>(TEMPLATE_BASE_PATH, body);
		return mapBackendTemplateToDomain(response.data.data);
	},

	// PATCH /templates/:id — draft only; items are replaced wholesale.
	// `payload.version` is not sent: the backend has no version guard yet.
	updateTemplate: async ({ templateId, payload }) => {
		const response = await ServerAxios.patch<
			ApiEnvelope<BackendChecklistTemplateResponse>,
			BackendUpdateTemplateBody
		>(templatePath(templateId), mapUpdatePayloadToBackendBody(payload));
		return mapBackendTemplateToDomain(response.data.data);
	},

	publishTemplate: async (templateId) => {
		const response = await ServerAxios.post<
			ApiEnvelope<BackendChecklistTemplateResponse>
		>(`${templatePath(templateId)}/publish`);
		return mapBackendTemplateToDomain(response.data.data);
	},

	deleteTemplate: async () => {
		// No DELETE route exists on the backend yet.
		throw new Error("Deleting checklist templates is not supported yet.");
	},
};

const shouldUseMock = import.meta.env.VITE_DEALER_AUDIT_USE_MOCK === "true";

export const dealerTemplateApi: DealerTemplateApi = shouldUseMock
	? mockDealerTemplateApi
	: httpDealerTemplateApi;
