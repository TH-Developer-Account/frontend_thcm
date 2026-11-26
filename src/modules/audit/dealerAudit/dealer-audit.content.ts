// modules/audit/dealerAudit/dealer-audit.content.ts
//
// Single source of truth for user-facing Dealer Audit copy (labels,
// validation messages, toasts, reminders). Components, zod schemas and
// status helpers read from here instead of hardcoding strings.
//
// To add a language: add dealer-audit.content.<locale>.json with the same
// shape as the English file and register it in CONTENT_BY_LOCALE.

import en from "./dealer-audit.content.en.json";

export type DealerAuditContent = typeof en;

const CONTENT_BY_LOCALE: Record<string, DealerAuditContent> = { en };

export const DEFAULT_DEALER_AUDIT_CONTENT_LOCALE = "en";

export const loadDealerAuditContent = (
	locale: string = DEFAULT_DEALER_AUDIT_CONTENT_LOCALE,
): DealerAuditContent => CONTENT_BY_LOCALE[locale] ?? en;

export const dealerAuditContent: DealerAuditContent = loadDealerAuditContent();

export {
	formatAuditMessage as formatDealerAuditMessage,
	formatCount,
} from "../shared/execution/audit-execution.content";
