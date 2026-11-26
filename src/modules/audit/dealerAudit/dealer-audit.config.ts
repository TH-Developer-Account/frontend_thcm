// modules/audit/dealerAudit/dealer-audit.config.ts
import { AUDIT_EXECUTION_RULES } from "../shared/execution/audit-execution.config";
import type { AuditModuleCapabilities } from "../shared/shared.audit.types";

export const DEALER_AUDIT_CAPABILITIES: AuditModuleCapabilities = {
	auditModule: "DEALER_AUDIT",
	hasSelfAssessment: true,
	hasReviewerScore: true,
	// Agreed: there is no N/A. A non-applicable parameter is scored 0.
	allowNotApplicable: false,
	evidenceCaptureMode: "LIVE_CAMERA_ONLY",
};

/**
 * Business rules the FRONTEND needs to know. The backend remains the
 * authority — these only drive hints, reminders and client-side validation.
 *
 * ASSUMPTIONS (confirm with product):
 *  - fiscalYearStartMonth: 4 → quarters follow the Indian financial year
 *    (Q1 = Apr–Jun). Set to 1 for calendar quarters.
 *  - slaDays follow the MoM of 8 Sep 2026 (7 days for submission and 7 for
 *    clarification).
 *  - evidence default 1–3 photos follows the business-logic doc and is used
 *    ONLY when a parameter does not carry its own min/max.
 */
export const DEALER_AUDIT_RULES = {
	/** Widened to `number` so it can be switched to 1 without type errors. */
	fiscalYearStartMonth: 4 as number,

	slaDays: {
		selfAssessment: 7,
		clarification: 7,
	},

	/** Within this many days of the due date an audit is "due soon". */
	dueSoonDays: 3,

	/** Days before the due date a reminder is surfaced (and emailed by the backend). */
	reminderOffsetsDays: [7, 3, 1],
	/** Days before the period ends that the quarter-end notice is surfaced. */
	periodEndReminderOffsetsDays: [14, 7, 1],

	// Evidence limits, text lengths and swipe thresholds are shared with
	// Factory Audit.
	...AUDIT_EXECUTION_RULES,

	autosaveDelayMs: 1500,

	list: {
		defaultPageSize: 10,
		masterDataStaleTimeMs: 10 * 60 * 1000,
	},
} as const;
