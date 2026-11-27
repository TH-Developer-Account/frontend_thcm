// modules/audit/dealerAudit/templates/dealer-template.api.ts
//
// Dealer checklist-template HTTP operations. Typed in, typed (domain) out.
// No toasts, navigation or cache updates here — hooks own that.
//
// Contract: claude/dealer-audit-template-api-contract.md
// (camelCase, `{ success, data }` envelope, server-side list paging).

import { ServerAxios } from "../../../../services/ServerAxios";
import {
	mapBackendListToPaginated,
	mapBackendTemplateToDomain,
	mapCreatePayloadToBackendBody,
	mapListParamsToQuery,
	mapUpdatePayloadToBackendBody,
	type BackendEnvelope,
	type BackendListResponse,
	type BackendReferencePhoto,
	type BackendTemplate,
} from "./dealer-template.backend";
import type {
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

export interface DealerReferencePhoto {
	key: string;
	url: string;
}

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
	publishTemplate: (
		templateId: string,
		expectedUpdatedAt?: string | null,
	) => Promise<DealerChecklistTemplate>;
	/** Copies a PUBLISHED / ARCHIVED template into the next DRAFT version. */
	createNewDraft: (templateId: string) => Promise<DealerChecklistTemplate>;
	archiveTemplate: (templateId: string) => Promise<DealerChecklistTemplate>;
	deleteTemplate: (templateId: string) => Promise<void>;
	uploadReferencePhoto: (file: File) => Promise<DealerReferencePhoto>;
}

export const dealerTemplateApi: DealerTemplateApi = {
	getTemplates: async (params, signal) => {
		const response = await ServerAxios.get<BackendListResponse>(
			TEMPLATE_BASE_PATH,
			{ params: mapListParamsToQuery(params), signal },
		);
		return mapBackendListToPaginated(response.data);
	},

	getTemplate: async (templateId, signal) => {
		const response = await ServerAxios.get<BackendEnvelope<BackendTemplate>>(
			templatePath(templateId),
			{ signal },
		);
		return mapBackendTemplateToDomain(response.data.data);
	},

	// POST /templates — creates DRAFT v1 (parameters may be empty).
	createTemplate: async (payload) => {
		const response = await ServerAxios.post<BackendEnvelope<BackendTemplate>>(
			TEMPLATE_BASE_PATH,
			mapCreatePayloadToBackendBody(payload),
		);
		return mapBackendTemplateToDomain(response.data.data);
	},

	// PATCH /templates/:id — draft only. 409 when `expectedUpdatedAt` is stale.
	updateTemplate: async ({ templateId, payload }) => {
		const response = await ServerAxios.patch<BackendEnvelope<BackendTemplate>>(
			templatePath(templateId),
			mapUpdatePayloadToBackendBody(payload),
		);
		return mapBackendTemplateToDomain(response.data.data);
	},

	publishTemplate: async (templateId, expectedUpdatedAt) => {
		const response = await ServerAxios.post<BackendEnvelope<BackendTemplate>>(
			`${templatePath(templateId)}/publish`,
			expectedUpdatedAt ? { expectedUpdatedAt } : {},
		);
		return mapBackendTemplateToDomain(response.data.data);
	},

	createNewDraft: async (templateId) => {
		const response = await ServerAxios.post<BackendEnvelope<BackendTemplate>>(
			`${templatePath(templateId)}/new-draft`,
		);
		return mapBackendTemplateToDomain(response.data.data);
	},

	archiveTemplate: async (templateId) => {
		const response = await ServerAxios.post<BackendEnvelope<BackendTemplate>>(
			`${templatePath(templateId)}/archive`,
		);
		return mapBackendTemplateToDomain(response.data.data);
	},

	deleteTemplate: async (templateId) => {
		await ServerAxios.delete(templatePath(templateId));
	},

	uploadReferencePhoto: async (file) => {
		const formData = new FormData();
		formData.append("file", file);
		const response = await ServerAxios.post<
			BackendEnvelope<BackendReferencePhoto>
		>(`${TEMPLATE_BASE_PATH}/reference-photos`, formData);
		return response.data.data;
	},
};
