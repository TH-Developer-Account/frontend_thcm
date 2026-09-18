// modules/audit/dealer-audit/api/dealer-audit.queries.ts
// import type { ChecklistTemplateListParams } from "../shared/shared.audit.types";

/**
 * Centralized query-key factory — nothing in this module should build a
 * query key inline. Filter params are passed as-is into the key; callers
 * are responsible for not passing `undefined` vs omitting a key
 * inconsistently for the same logical filter (e.g. always pass
 * `{ officeType: undefined }` rather than sometimes omitting officeType
 * entirely), or equivalent filters will create separate cache entries.
 */
export const dealerAuditKeys = {
	// all: ["dealer-audit"] as const,
	// templates: () => [...dealerAuditKeys.all, "templates"] as const,
	// templateList: (params: ChecklistTemplateListParams) =>
	// 	[...dealerAuditKeys.templates(), "list", params] as const,
	// templateDetail: (templateId: string) =>
	// 	[...dealerAuditKeys.templates(), "detail", templateId] as const,
	// instances: () => [...dealerAuditKeys.all, "instances"] as const,
	// instanceList: (params: { periodLabel?: string; dealerUserId?: string }) =>
	// 	[...dealerAuditKeys.instances(), "list", params] as const,
	// instanceDetail: (instanceId: string) =>
	// 	[...dealerAuditKeys.instances(), "detail", instanceId] as const,
	// mine: () => [...dealerAuditKeys.all, "mine"] as const,
	// mineList: () => [...dealerAuditKeys.mine(), "list"] as const,
	// mineDetail: (instanceId: string) =>
	// 	[...dealerAuditKeys.mine(), "detail", instanceId] as const,
};
