// modules/audit/shared/execution/audit-execution.format.ts
//
// Display formatting only. Domain objects never carry UI strings.

import {
	auditExecutionContent as content,
	formatCount,
} from "./audit-execution.content";

const LOCALE = "en-IN";

const toValidDate = (iso: string | null | undefined): Date | null => {
	if (!iso) return null;
	const date = new Date(iso);
	return Number.isNaN(date.getTime()) ? null : date;
};

/** 12 Sep 2026 — or the fallback when the value is missing/invalid. */
export const formatAuditDate = (
	iso: string | null | undefined,
	fallback = "—",
): string => {
	const date = toValidDate(iso);
	return date
		? date.toLocaleDateString(LOCALE, {
				day: "2-digit",
				month: "short",
				year: "numeric",
			})
		: fallback;
};

/** 12 Sep 2026, 03:45 pm */
export const formatAuditDateTime = (
	iso: string | null | undefined,
	fallback = "—",
): string => {
	const date = toValidDate(iso);
	return date
		? date.toLocaleString(LOCALE, {
				day: "2-digit",
				month: "short",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: fallback;
};

/** yyyy-mm-dd in LOCAL time — the value format the due-date forms store. */
export const toDateInputValue = (date: Date): string => {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Inverse of toDateInputValue: yyyy-mm-dd → local Date (midnight), or
 * undefined for empty / malformed input. Used to feed the DatePickerInput.
 */
export const fromDateInputValue = (value: string): Date | undefined => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return undefined;
	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return Number.isNaN(date.getTime()) ? undefined : date;
};

export const formatPercent = (value: number): string =>
	`${Number.isInteger(value) ? value : value.toFixed(1)}%`;

/** "today" / "1 day" / "3 days" — sign is ignored, callers add the wording. */
export const formatDaysDistance = (days: number): string => {
	if (days === 0) return content.sla.today;
	return formatCount(Math.abs(days), content.sla.day, content.sla.days);
};
