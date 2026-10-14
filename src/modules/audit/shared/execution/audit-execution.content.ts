// modules/audit/shared/execution/audit-execution.content.ts
//
// Copy for the audit-execution UI shared by Dealer Audit and Factory Audit
// (item forms, evidence, progress, history, validation of one parameter).
// Wording is deliberately module-neutral: no "dealer" / "factory".
// Module-specific copy (statuses, reminders, toasts, dialogs, page titles)
// stays in each module's own content file.
//
// To add a language: add audit-execution.content.<locale>.json with the same
// shape and register it in CONTENT_BY_LOCALE.

import en from "./audit-execution.content.en.json";

export type AuditExecutionContent = typeof en;

const CONTENT_BY_LOCALE: Record<string, AuditExecutionContent> = { en };

export const DEFAULT_AUDIT_EXECUTION_LOCALE = "en";

export const loadAuditExecutionContent = (
	locale: string = DEFAULT_AUDIT_EXECUTION_LOCALE,
): AuditExecutionContent => CONTENT_BY_LOCALE[locale] ?? en;

export const auditExecutionContent: AuditExecutionContent =
	loadAuditExecutionContent();

/**
 * Fills `{token}` placeholders. An unknown token is left as literal text so
 * a content edit can never crash the UI.
 */
export const formatAuditMessage = (
	template: string,
	values: Record<string, string | number | null | undefined>,
): string =>
	template.replace(/\{(\w+)\}/g, (match, token: string) => {
		const value = values[token];
		return value === undefined || value === null ? match : String(value);
	});

/** "1 photo" / "3 photos" */
export const formatCount = (
	count: number,
	singular: string,
	plural: string,
): string => `${count} ${count === 1 ? singular : plural}`;
