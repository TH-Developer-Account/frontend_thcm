// modules/audit/dealerAudit/cycle/dealer-cycle.types.ts
//
// Contracts for the audit-CYCLE screens: launch wizard, admin tracker,
// reviewer queue, approver queue and reports list.
//
// Layers are kept apart exactly like dealer-audit.types.ts:
//   *Response      raw backend (snake_case)
//   domain models  camelCase, safe defaults
//   *FormValues    wizard drafts
//   *Payload       request bodies
//   *Params / *Variables
//
// ASSUMPTION: backend names follow the snake_case convention already used by
// /dealer-audit/*. Only this file + dealer-cycle.mappers.ts change when the
// real contract lands.

import type {
	DealerAuditPeriodType,
	DealerAuditQuarter,
	DealerAuditStatus,
} from "../dealer-audit.types";

// ── Eligibility ───────────────────────────────────────────────────────

/** Why a dealer cannot be added to a cycle. UI copy lives in the content file. */
export type DealerIneligibleReason =
	| "ALREADY_AUDITED" // a live audit exists for dealer + period
	| "FACILITY_MISMATCH"; // dealer facility type ≠ template facility type

export interface DealerEligibility {
	dealerId: string;
	isEligible: boolean;
	reason: DealerIneligibleReason | null;
	/** Audit number that blocks the dealer (ALREADY_AUDITED only). */
	blockingAuditNumber: string | null;
}

// ── Reviewer workload (auto-assign + assignment table) ────────────────

export interface ReviewerWorkload {
	reviewerId: string;
	openAudits: number;
}

// ── Tracker KPIs ──────────────────────────────────────────────────────

export interface AuditTrackerSummary {
	total: number;
	notStarted: number;
	inProgress: number;
	awaitingReview: number;
	clarification: number;
	awaitingApproval: number;
	closed: number;
	overdue: number;
	/** Mean final score as a percentage of max; null when nothing is scored. */
	averageScorePercent: number | null;
}

export interface AuditTrackerSummaryResponse {
	total: number;
	not_started: number;
	in_progress: number;
	awaiting_review: number;
	clarification: number;
	awaiting_approval: number;
	closed: number;
	overdue: number;
	average_score_percent: number | null;
}

export interface AuditTrackerSummaryParams {
	periodType: DealerAuditPeriodType | null;
	year: number | null;
	quarter: DealerAuditQuarter | null;
}

// ── Queues (reviewer / approver) ──────────────────────────────────────

export type ReviewQueueTab =
	| "TO_REVIEW"
	| "IN_REVIEW"
	| "WITH_DEALER"
	| "COMPLETED";

export type ReviewQueueCounts = Record<ReviewQueueTab, number>;

export interface ReviewQueueCountsResponse {
	to_review: number;
	in_review: number;
	with_dealer: number;
	completed: number;
}

// ── Wizard ────────────────────────────────────────────────────────────

export interface CycleDetailsFormValues {
	name: string;
	templateId: string;
	periodType: DealerAuditPeriodType;
	year: number;
	quarter: DealerAuditQuarter | null;
	/** yyyy-mm-dd */
	dueDate: string;
	notes: string;
}

export interface CycleAssignment {
	dealerId: string;
	reviewerId: string;
}

export interface CreateAuditCycleFormValues extends CycleDetailsFormValues {
	dealerIds: string[];
	/** dealerId → reviewerId. Missing key = not assigned yet. */
	reviewerByDealer: Record<string, string>;
}

export interface CreateAuditCyclePayload {
	name: string;
	template_id: string;
	period_type: DealerAuditPeriodType;
	period_year: number;
	period_quarter: DealerAuditQuarter | null;
	due_date: string;
	notes: string | null;
	assignments: Array<{ dealer_id: string; reviewer_id: string }>;
}

export interface AuditCycleLaunchResult {
	createdCount: number;
	auditIds: string[];
}

export interface AuditCycleLaunchResponse {
	created_count: number;
	audit_ids: string[];
}

export type CycleWizardStepId = "DETAILS" | "DEALERS" | "REVIEWERS" | "CONFIRM";

// ── Reminders / report delivery ───────────────────────────────────────

export interface SendReminderPayload {
	audit_ids: string[];
	message: string | null;
}

export interface SendReminderVariables {
	auditIds: string[];
	message?: string;
}

export interface SendReminderResult {
	sentCount: number;
	sentAt: string;
}

export interface SendReminderResponse {
	sent_count: number;
	sent_at: string;
}

export interface ResendReportPayload {
	recipients: string[];
}

export interface ResendReportVariables {
	auditId: string;
	recipients: string[];
}

export interface ResendReportResult {
	sentAt: string;
	recipientCount: number;
}

export interface ResendReportResponse {
	sent_at: string;
	recipient_count: number;
}

// ── Param helpers re-exported for convenience ─────────────────────────

export type { DealerAuditStatus };
