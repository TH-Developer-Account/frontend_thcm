// modules/audit/dealerAudit/dealer-audit.queries.ts
//
// Centralized query-key factory for Dealer Audit. Nothing in this module
// builds a query key inline. List params are normalized BEFORE they reach
// a key so equivalent filters share one cache entry.

import { normalizeDealerTemplateListParams } from "./templates/dealer-template.mappers";
import type { DealerChecklistTemplateListParams } from "./templates/dealer-template.types";

export const dealerAuditKeys = {
	all: ["dealer-audit"] as const,

	// ── Checklist templates ──
	templates: () => [...dealerAuditKeys.all, "templates"] as const,
	templateLists: () => [...dealerAuditKeys.templates(), "list"] as const,
	templateList: (params: DealerChecklistTemplateListParams) =>
		[
			...dealerAuditKeys.templateLists(),
			normalizeDealerTemplateListParams(params),
		] as const,
	templateDetails: () => [...dealerAuditKeys.templates(), "detail"] as const,
	templateDetail: (templateId: string) =>
		[...dealerAuditKeys.templateDetails(), templateId] as const,

	// ── Audit instances (Day 13+) ──
	// lists / detail / checklist / history / evidence keys go here.
};
