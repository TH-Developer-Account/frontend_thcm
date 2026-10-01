// modules/audit/dealerAudit/templates/dealer-template.api.ts
//
// Dealer checklist-template HTTP operations. Typed in, typed (domain) out.
// No toasts, navigation or cache updates here — hooks own that.
//
// ASSUMPTION: endpoint paths below are provisional until the backend
// contract is shared. Set VITE_DEALER_AUDIT_USE_MOCK=true to run the UI
// against the isolated in-memory adapter (dealer-template.mock.ts).

import { ServerAxios } from "../../../../services/ServerAxios";
import {
	mapDealerChecklistTemplateListResponse,
	mapDealerChecklistTemplateResponse,
	mapDealerTemplateListParamsToQuery,
} from "./dealer-template.mappers";
import { mockDealerTemplateApi } from "./dealer-template.mock";
import type {
	ApiEnvelope,
	ApiPaginatedEnvelope,
	CreateDealerChecklistTemplatePayload,
	DealerChecklistTemplate,
	DealerChecklistTemplateListItem,
	DealerChecklistTemplateListItemResponse,
	DealerChecklistTemplateListParams,
	DealerChecklistTemplateResponse,
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
		const response = await ServerAxios.get<
			ApiPaginatedEnvelope<DealerChecklistTemplateListItemResponse>
		>(TEMPLATE_BASE_PATH, {
			params: mapDealerTemplateListParamsToQuery(params),
			signal,
		});
		return mapDealerChecklistTemplateListResponse(response.data);
	},

	getTemplate: async (templateId, signal) => {
		const response = await ServerAxios.get<
			ApiEnvelope<DealerChecklistTemplateResponse>
		>(templatePath(templateId), { signal });
		return mapDealerChecklistTemplateResponse(response.data.data);
	},

	createTemplate: async (payload) => {
		const response = await ServerAxios.post<
			ApiEnvelope<DealerChecklistTemplateResponse>
		>(TEMPLATE_BASE_PATH, payload);
		return mapDealerChecklistTemplateResponse(response.data.data);
	},

	updateTemplate: async ({ templateId, payload }) => {
		const response = await ServerAxios.put<
			ApiEnvelope<DealerChecklistTemplateResponse>
		>(templatePath(templateId), payload);
		return mapDealerChecklistTemplateResponse(response.data.data);
	},

	publishTemplate: async (templateId) => {
		const response = await ServerAxios.post<
			ApiEnvelope<DealerChecklistTemplateResponse>
		>(`${templatePath(templateId)}/publish`);
		return mapDealerChecklistTemplateResponse(response.data.data);
	},

	deleteTemplate: async (templateId) => {
		await ServerAxios.delete<ApiEnvelope<null>>(templatePath(templateId));
	},
};

const shouldUseMock = import.meta.env.VITE_DEALER_AUDIT_USE_MOCK === "true";

export const dealerTemplateApi: DealerTemplateApi = shouldUseMock
	? mockDealerTemplateApi
	: httpDealerTemplateApi;
