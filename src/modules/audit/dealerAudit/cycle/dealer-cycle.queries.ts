// modules/audit/dealerAudit/cycle/dealer-cycle.queries.ts
//
// Query keys for the cycle screens. They live UNDER dealerAuditKeys.all so a
// single invalidate on dealerAuditKeys.audits() still refreshes everything.

import { dealerAuditKeys } from "../dealer-audit.queries";
import { normalizeSummaryParams } from "./dealer-cycle.mappers";
import type { AuditTrackerSummaryParams } from "./dealer-cycle.types";

export const dealerCycleKeys = {
	all: [...dealerAuditKeys.all, "cycle"] as const,
	summary: (params: Partial<AuditTrackerSummaryParams>) =>
		[...dealerCycleKeys.all, "summary", normalizeSummaryParams(params)] as const,
	queueCounts: () => [...dealerCycleKeys.all, "queue-counts"] as const,
	eligibility: (templateId: string, periodKey: string) =>
		[...dealerCycleKeys.all, "eligibility", templateId, periodKey] as const,
	workload: () => [...dealerCycleKeys.all, "workload"] as const,
};
