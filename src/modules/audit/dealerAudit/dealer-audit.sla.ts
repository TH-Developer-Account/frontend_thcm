// modules/audit/dealerAudit/dealer-audit.sla.ts
//
// Audit periods (quarter / year), SLA state and reminder rules. Pure
// functions with an injectable `now` so every rule is unit-testable.
//
// Reminders here are the IN-APP surface only. Emails / push notifications
// and the quarter-end auto-finalisation job are backend responsibilities;
// DEALER_AUDIT_RULES documents the schedule they should follow.

import { formatDaysDistance } from "../shared/execution/audit-execution.format";
import type {
	AuditReminder,
	ReminderSeverity,
} from "../shared/execution/audit-execution.types";
import { DEALER_AUDIT_RULES } from "./dealer-audit.config";
import {
	dealerAuditContent as content,
	formatDealerAuditMessage as format,
} from "./dealer-audit.content";
import {
	isAutoFinalizableStatus,
	isClarificationStatus,
	isSelfAssessmentOpenStatus,
	isSlaTrackedStatus,
	isTerminalAuditStatus,
} from "./dealer-audit.status";
import type {
	DealerAuditPeriod,
	DealerAuditPeriodType,
	DealerAuditQuarter,
	DealerAuditStatus,
	SlaState,
} from "./dealer-audit.types";

const MS_PER_DAY = 86_400_000;

// ── Dates ─────────────────────────────────────────────────────────────

const startOfDay = (date: Date): Date =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole calendar days from `now` to `iso` (negative = in the past). */
export const getCalendarDaysUntil = (
	iso: string | null,
	now: Date = new Date(),
): number | null => {
	if (!iso) return null;
	const target = new Date(iso);
	if (Number.isNaN(target.getTime())) return null;
	return Math.round(
		(startOfDay(target).getTime() - startOfDay(now).getTime()) / MS_PER_DAY,
	);
};

export const addDaysToIso = (iso: string, days: number): string => {
	const date = new Date(iso);
	date.setDate(date.getDate() + days);
	return date.toISOString();
};

// ── Periods ───────────────────────────────────────────────────────────

const startMonthIndex = (): number => DEALER_AUDIT_RULES.fiscalYearStartMonth - 1;

export const getPeriodOf = (
	date: Date,
	type: DealerAuditPeriodType,
): DealerAuditPeriod => {
	const startMonth = startMonthIndex();
	const month = date.getMonth();
	const year = month >= startMonth ? date.getFullYear() : date.getFullYear() - 1;
	if (type === "YEARLY") return { type, year, quarter: null };

	const monthsSinceStart = (month - startMonth + 12) % 12;
	const quarter = (Math.floor(monthsSinceStart / 3) + 1) as DealerAuditQuarter;
	return { type, year, quarter };
};

/** Inclusive range: `end` is the last millisecond of the final day. */
export const getPeriodRange = (
	period: DealerAuditPeriod,
): { start: Date; end: Date } => {
	const startMonth = startMonthIndex();
	const offsetMonths = period.quarter === null ? 0 : (period.quarter - 1) * 3;
	const lengthMonths = period.type === "YEARLY" ? 12 : 3;
	const start = new Date(period.year, startMonth + offsetMonths, 1);
	const end = new Date(
		period.year,
		startMonth + offsetMonths + lengthMonths,
		1,
	);
	end.setMilliseconds(-1);
	return { start, end };
};

export const formatPeriodLabel = (period: DealerAuditPeriod): string => {
	const isFiscal = DEALER_AUDIT_RULES.fiscalYearStartMonth !== 1;
	const yearText = isFiscal
		? format(content.period.fiscalYear, {
				start: period.year,
				end: String((period.year + 1) % 100).padStart(2, "0"),
			})
		: String(period.year);

	if (period.type === "YEARLY" || period.quarter === null) return yearText;

	return format(content.period.quarter, {
		quarter: period.quarter,
		year: yearText,
	});
};

/** Selectable start years for create / filter forms. */
export const getSelectableYears = (now: Date = new Date()): number[] => {
	const current = getPeriodOf(now, "YEARLY").year;
	return [current + 1, current, current - 1, current - 2];
};

// ── SLA ───────────────────────────────────────────────────────────────

export const computeSlaState = (
	status: DealerAuditStatus,
	dueAt: string | null,
	now: Date = new Date(),
): SlaState => {
	if (!dueAt || !isSlaTrackedStatus(status)) return "NONE";
	const days = getCalendarDaysUntil(dueAt, now);
	if (days === null) return "NONE";
	if (days < 0) return "OVERDUE";
	if (days <= DEALER_AUDIT_RULES.dueSoonDays) return "DUE_SOON";
	return "ON_TRACK";
};

export const computeSelfAssessmentDueAt = (startedAtIso: string): string =>
	addDaysToIso(startedAtIso, DEALER_AUDIT_RULES.slaDays.selfAssessment);

export const computeClarificationDueAt = (raisedAtIso: string): string =>
	addDaysToIso(raisedAtIso, DEALER_AUDIT_RULES.slaDays.clarification);

// ── Reminders ─────────────────────────────────────────────────────────

export type { ReminderSeverity };
export type ReminderAudience = "DEALER" | "INTERNAL";

export type DealerAuditReminder = AuditReminder;

export interface ReminderSubject {
	status: DealerAuditStatus;
	dueAt: string | null;
	period: DealerAuditPeriod;
}

const severityForDays = (days: number): ReminderSeverity => {
	if (days <= 1) return "danger";
	if (days <= DEALER_AUDIT_RULES.dueSoonDays) return "warning";
	return "info";
};

const SEVERITY_RANK: Record<ReminderSeverity, number> = {
	danger: 0,
	warning: 1,
	info: 2,
};

export function getAuditReminders(
	audit: ReminderSubject,
	audience: ReminderAudience,
	now: Date = new Date(),
): DealerAuditReminder[] {
	if (isTerminalAuditStatus(audit.status)) return [];

	const reminders: DealerAuditReminder[] = [];
	const maxDueOffset = Math.max(...DEALER_AUDIT_RULES.reminderOffsetsDays);
	const maxPeriodOffset = Math.max(
		...DEALER_AUDIT_RULES.periodEndReminderOffsetsDays,
	);

	// 1 ── Deadline for whoever currently holds the ball.
	const dueDays = getCalendarDaysUntil(audit.dueAt, now);
	if (dueDays !== null && isSlaTrackedStatus(audit.status)) {
		const subject = isClarificationStatus(audit.status)
			? audience === "DEALER"
				? content.reminders.clarificationSubject
				: content.reminders.waitingClarificationSubject
			: audience === "DEALER"
				? content.reminders.selfAssessmentSubject
				: content.reminders.waitingSelfAssessmentSubject;

		if (dueDays < 0) {
			reminders.push({
				id: "due-overdue",
				severity: "danger",
				message: format(content.reminders.overdue, {
					subject,
					distance: formatDaysDistance(dueDays),
				}),
			});
		} else if (dueDays <= maxDueOffset) {
			reminders.push({
				id: "due-soon",
				severity: severityForDays(dueDays),
				message:
					dueDays === 0
						? format(content.reminders.dueToday, { subject })
						: format(content.reminders.dueIn, {
								subject,
								distance: formatDaysDistance(dueDays),
							}),
			});
		}
	}

	// 2 ── Period end: expiry for unsubmitted audits, auto-finalisation for
	//      audits waiting on review/approval.
	const { end } = getPeriodRange(audit.period);
	const periodDays = getCalendarDaysUntil(end.toISOString(), now);
	if (periodDays !== null) {
		const ended = periodDays < 0;
		const closing = !ended && periodDays <= maxPeriodOffset;

		if (isSelfAssessmentOpenStatus(audit.status) && (closing || ended)) {
			reminders.push({
				id: "period-expiry",
				severity: ended ? "danger" : severityForDays(periodDays),
				message: ended
					? content.reminders.periodEndedExpiry
					: format(content.reminders.periodEndsExpiry, {
							distance: formatDaysDistance(periodDays),
						}),
			});
		}

		if (isAutoFinalizableStatus(audit.status) && (closing || ended)) {
			const template =
				audience === "DEALER"
					? ended
						? content.reminders.periodEndedAutoFinalizeDealer
						: content.reminders.periodEndsAutoFinalizeDealer
					: ended
						? content.reminders.periodEndedAutoFinalizeInternal
						: content.reminders.periodEndsAutoFinalizeInternal;
			reminders.push({
				id: "period-auto-finalize",
				severity: ended ? "warning" : severityForDays(periodDays),
				message: format(template, {
					distance: ended ? "" : formatDaysDistance(periodDays),
				}),
			});
		}
	}

	return reminders.sort(
		(a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
	);
}
