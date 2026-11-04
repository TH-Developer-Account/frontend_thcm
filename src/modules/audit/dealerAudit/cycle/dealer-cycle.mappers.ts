// modules/audit/dealerAudit/cycle/dealer-cycle.mappers.ts
//
// Shape conversion only: Response → domain, FormValues → Payload.
// No UI strings, no business rules (those live in dealer-cycle.logic.ts).

import type {
	AuditCycleLaunchResponse,
	AuditCycleLaunchResult,
	AuditTrackerSummary,
	AuditTrackerSummaryParams,
	AuditTrackerSummaryResponse,
	CreateAuditCycleFormValues,
	CreateAuditCyclePayload,
	ResendReportPayload,
	ResendReportResponse,
	ResendReportResult,
	ResendReportVariables,
	ReviewQueueCounts,
	ReviewQueueCountsResponse,
	SendReminderPayload,
	SendReminderResponse,
	SendReminderResult,
	SendReminderVariables,
} from "./dealer-cycle.types";

export const mapTrackerSummaryResponse = (
	response: AuditTrackerSummaryResponse,
): AuditTrackerSummary => ({
	total: response.total ?? 0,
	notStarted: response.not_started ?? 0,
	inProgress: response.in_progress ?? 0,
	awaitingReview: response.awaiting_review ?? 0,
	clarification: response.clarification ?? 0,
	awaitingApproval: response.awaiting_approval ?? 0,
	closed: response.closed ?? 0,
	overdue: response.overdue ?? 0,
	averageScorePercent: response.average_score_percent ?? null,
});

export const mapQueueCountsResponse = (
	response: ReviewQueueCountsResponse,
): ReviewQueueCounts => ({
	TO_REVIEW: response.to_review ?? 0,
	IN_REVIEW: response.in_review ?? 0,
	WITH_DEALER: response.with_dealer ?? 0,
	COMPLETED: response.completed ?? 0,
});

export const mapLaunchResponse = (
	response: AuditCycleLaunchResponse,
): AuditCycleLaunchResult => ({
	createdCount: response.created_count ?? 0,
	auditIds: response.audit_ids ?? [],
});

export const mapReminderResponse = (
	response: SendReminderResponse,
): SendReminderResult => ({
	sentCount: response.sent_count ?? 0,
	sentAt: response.sent_at,
});

export const mapResendResponse = (
	response: ResendReportResponse,
): ResendReportResult => ({
	sentAt: response.sent_at,
	recipientCount: response.recipient_count ?? 0,
});

// ── FormValues / Variables → Payload ──────────────────────────────────

/** Only dealers that are selected AND have a reviewer are sent. */
export const mapFormToCreateCyclePayload = (
	values: CreateAuditCycleFormValues,
): CreateAuditCyclePayload => ({
	name: values.name.trim(),
	template_id: values.templateId,
	period_type: values.periodType,
	period_year: values.year,
	period_quarter: values.periodType === "QUARTERLY" ? values.quarter : null,
	due_date: values.dueDate,
	notes: values.notes.trim() === "" ? null : values.notes.trim(),
	assignments: values.dealerIds.flatMap((dealerId) => {
		const reviewerId = values.reviewerByDealer[dealerId];
		return reviewerId ? [{ dealer_id: dealerId, reviewer_id: reviewerId }] : [];
	}),
});

export const mapReminderToPayload = (
	variables: SendReminderVariables,
): SendReminderPayload => ({
	audit_ids: variables.auditIds,
	message: variables.message?.trim() ? variables.message.trim() : null,
});

export const mapResendToPayload = (
	variables: ResendReportVariables,
): ResendReportPayload => ({
	recipients: variables.recipients.map((email) => email.trim()).filter(Boolean),
});

/** Tracker summary params → query string object (nulls dropped). */
export const toSummaryQuery = (
	params: AuditTrackerSummaryParams,
): Record<string, string | number> => ({
	...(params.periodType ? { period_type: params.periodType } : {}),
	...(params.year !== null ? { period_year: params.year } : {}),
	...(params.quarter !== null ? { period_quarter: params.quarter } : {}),
});

export const normalizeSummaryParams = (
	params: Partial<AuditTrackerSummaryParams>,
): AuditTrackerSummaryParams => ({
	periodType: params.periodType ?? null,
	year: params.year ?? null,
	quarter: params.quarter ?? null,
});
