// modules/audit/dealerAudit/cycle/dealer-cycle.mappers.ts
//
// Shape conversion only: Response → domain, FormValues → Payload.
// No UI strings, no business rules (those live in dealer-cycle.logic.ts).

import type { DealerAuditDealerOption } from "../dealer-audit.types";
import type { DealerFacilityType } from "../templates/dealer-template.types";
import { formatPeriodLabel } from "../dealer-audit.sla";
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

const asText = (value: unknown): string | null =>
	typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const asFacility = (value: unknown): DealerFacilityType | null => {
	const text =
		asText(value)
			?.toUpperCase()
			.replace(/[\s-]+/g, "_") ?? null;
	if (text === "HEAD_OFFICE" || text === "HO") return "HEAD_OFFICE";
	if (text === "BRANCH_OFFICE" || text === "BO") return "BRANCH_OFFICE";
	return null;
};

/**
 * A row from the business-partner module's own list API (businessPartnerApi.list)
 * → dealer option. Read loosely on purpose: this module does not own that row
 * type, so a renamed field there degrades to "empty" instead of a crash.
 * Rows that are inactive or clearly not a DEALER partner come back as null.
 */
export const mapBusinessPartnerToDealerOption = (
	item: unknown,
): DealerAuditDealerOption | null => {
	const row = (item ?? {}) as Record<string, unknown>;
	const id = asText(row.id);
	const name = asText(row.bpName) ?? asText(row.name) ?? asText(row.bp_name);
	if (!id || !name) return null;

	// Lenient on purpose: accepts "DEALER", "Dealer", "Dealership" and so on.
	// Rows with no type at all are kept.
	const type = asText(row.bpType) ?? asText(row.bp_type) ?? asText(row.type);
	if (type && !type.toUpperCase().includes("DEALER")) return null;
	if (row.isActive === false) return null;

	return {
		id,
		code: asText(row.bpShortName) ?? asText(row.code) ?? asText(row.bpId),
		name,
		location: asText(row.city) ?? asText(row.location) ?? "",
		facilityType: asFacility(row.officeType ?? row.office_type),
		zone: asText(row.zone) ?? asText(row.region),
		state: asText(row.state),
		lastAudit: null,
	};
};

/** Selected dealers get their own reviewer, else the fallback reviewer. */
export const mapFormToCreateCyclePayload = (
	values: CreateAuditCycleFormValues,
): CreateAuditCyclePayload => {
	const quarter = values.periodType === "QUARTERLY" ? values.quarter : null;
	return {
		name: values.name.trim(),
		template_id: values.templateId,
		period_type: values.periodType,
		period_year: values.year,
		period_quarter: quarter,
		period_label: formatPeriodLabel({
			type: values.periodType,
			year: values.year,
			quarter,
		}),
		due_date: values.dueDate,
		assignments: values.dealerIds.flatMap((dealerId) => {
			const reviewerId =
				values.reviewerByDealer[dealerId] || values.fallbackReviewerId;
			return reviewerId
				? [{ dealer_id: dealerId, reviewer_id: reviewerId }]
				: [];
		}),
	};
};

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
