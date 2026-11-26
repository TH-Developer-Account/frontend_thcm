// modules/audit/dealerAudit/dealer-audit.queries.ts
//
// Centralized query-key factory for Dealer Audit. Nothing in this module
// builds a query key inline. List params are normalized BEFORE they reach
// a key so equivalent filters share one cache entry.

import { normalizeAuditListParams } from "./dealer-audit.mappers";
import type { DealerAuditListParams } from "./dealer-audit.types";
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

	// ── Audit instances ──
	audits: () => [...dealerAuditKeys.all, "audits"] as const,
	lists: () => [...dealerAuditKeys.audits(), "list"] as const,
	list: (params: Partial<DealerAuditListParams>) =>
		[...dealerAuditKeys.lists(), normalizeAuditListParams(params)] as const,
	details: () => [...dealerAuditKeys.audits(), "detail"] as const,
	detail: (auditId: string) =>
		[...dealerAuditKeys.details(), auditId] as const,
	checklist: (auditId: string) =>
		[...dealerAuditKeys.detail(auditId), "checklist"] as const,
	history: (auditId: string) =>
		[...dealerAuditKeys.detail(auditId), "history"] as const,
	report: (auditId: string) =>
		[...dealerAuditKeys.detail(auditId), "report"] as const,

	// ── Master data (rarely changes — long staleTime) ──
	masters: () => [...dealerAuditKeys.all, "masters"] as const,
	dealerOptions: () => [...dealerAuditKeys.masters(), "dealers"] as const,
	reviewerOptions: () => [...dealerAuditKeys.masters(), "reviewers"] as const,
};
