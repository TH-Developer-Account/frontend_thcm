// modules/audit/dealer-audit/api/dealer-audit.api.ts
// import { httpClient } from "../../../../lib/httpClient"; // ← use your project's actual shared client path
import type {
	ChecklistTemplate,
	// ChecklistTemplateListParams,
	// AuditInstance,
	ChecklistParameter,
} from "../shared/shared.audit.types";

// const BASE_PATH = "/api/v1/dealer-audit";

export interface CreateChecklistTemplatePayload {
	name: string;
	description: string;
	facilityType?: string;
	sections: ChecklistTemplate["sections"];
}

export interface UpdateChecklistTemplatePayload extends Partial<CreateChecklistTemplatePayload> {
	id: string;
}

export interface SaveAuditResponsesPayload {
	responses: Array<
		Pick<ChecklistParameter, "id"> & Partial<ChecklistParameter>
	>;
}

/**
 * All Dealer Audit HTTP calls live here — typed in, typed out, no toasts,
 * no navigation, no cache updates. Hooks (useDealerChecklistTemplates,
 * useAuditExecution, etc.) own that orchestration.
 */
export const dealerAuditApi = {
	// ── Templates (Admin) ──
	// getTemplates: (params: ChecklistTemplateListParams) =>
	// 	httpClient
	// 		.get<{ data: ChecklistTemplate[] }>(`${BASE_PATH}/templates`, { params })
	// 		.then((res) => res.data.data),
	// getTemplate: (templateId: string) =>
	// 	httpClient
	// 		.get<{ data: ChecklistTemplate }>(`${BASE_PATH}/templates/${templateId}`)
	// 		.then((res) => res.data.data),
	// createTemplate: (payload: CreateChecklistTemplatePayload) =>
	// 	httpClient
	// 		.post<{ data: ChecklistTemplate }>(`${BASE_PATH}/templates`, payload)
	// 		.then((res) => res.data.data),
	// updateTemplateDraft: ({ id, ...payload }: UpdateChecklistTemplatePayload) =>
	// 	httpClient
	// 		.patch<{
	// 			data: ChecklistTemplate;
	// 		}>(`${BASE_PATH}/templates/${id}`, payload)
	// 		.then((res) => res.data.data),
	// publishTemplate: (templateId: string) =>
	// 	httpClient
	// 		.post<{
	// 			data: ChecklistTemplate;
	// 		}>(`${BASE_PATH}/templates/${templateId}/publish`)
	// 		.then((res) => res.data.data),
	// // ── Dealer surface: own instances only ──
	// getMyInstances: () =>
	// 	httpClient
	// 		.get<{ data: AuditInstance[] }>(`${BASE_PATH}/mine`)
	// 		.then((res) => res.data.data),
	// getMyInstanceById: (instanceId: string) =>
	// 	httpClient
	// 		.get<{ data: AuditInstance }>(`${BASE_PATH}/mine/${instanceId}`)
	// 		.then((res) => res.data.data),
	// saveMyResponses: (instanceId: string, payload: SaveAuditResponsesPayload) =>
	// 	httpClient.patch(`${BASE_PATH}/mine/${instanceId}/responses`, payload),
	// submitMyInstance: (instanceId: string) =>
	// 	httpClient.post(`${BASE_PATH}/mine/${instanceId}/submit`),
	// resubmitMyInstance: (
	// 	instanceId: string,
	// 	payload: SaveAuditResponsesPayload,
	// ) => httpClient.post(`${BASE_PATH}/mine/${instanceId}/resubmit`, payload),
	// uploadMyItemEvidence: (
	// 	instanceId: string,
	// 	itemId: string,
	// 	formData: FormData,
	// ) =>
	// 	httpClient
	// 		.post<{
	// 			data: unknown;
	// 		}>(`${BASE_PATH}/mine/${instanceId}/items/${itemId}/evidence`, formData, { headers: { "Content-Type": "multipart/form-data" } })
	// 		.then((res) => res.data.data),
};
