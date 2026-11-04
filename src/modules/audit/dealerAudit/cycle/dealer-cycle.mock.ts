// modules/audit/dealerAudit/cycle/dealer-cycle.mock.ts
//
// TEMP MOCK — delete when the cycle endpoints are live.
//
// The existing mock store is private, so this adapter is built ONLY from the
// public dealerAuditApi. It returns RAW (snake_case) bodies so the real
// mappers are exercised exactly as they will be against the backend.

import { dealerAuditApi } from "../dealer-audit.api";
import type {
	DealerAuditListItem,
	DealerAuditListParams,
} from "../dealer-audit.types";
import { REVIEW_QUEUE_STATUSES, computeQueueCounts, computeTrackerSummary } from "./dealer-cycle.logic";
import type {
	AuditCycleLaunchResponse,
	AuditTrackerSummaryParams,
	AuditTrackerSummaryResponse,
	CreateAuditCyclePayload,
	ResendReportPayload,
	ResendReportResponse,
	ReviewQueueCountsResponse,
	SendReminderPayload,
	SendReminderResponse,
} from "./dealer-cycle.types";

/** Injected by dealer-cycle.api.ts (keeps this file free of api imports). */
export type LoadAudits = (
	filters?: Partial<DealerAuditListParams>,
) => Promise<DealerAuditListItem[]>;

const delay = (ms = 150) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockDealerCycleBackend = {
	async getSummary(
		params: AuditTrackerSummaryParams,
		loadAudits: LoadAudits,
	): Promise<{ data: AuditTrackerSummaryResponse }> {
		const items = await loadAudits({
			periodType: params.periodType,
			year: params.year,
			quarter: params.quarter,
		});
		const s = computeTrackerSummary(items);
		return {
			data: {
				total: s.total,
				not_started: s.notStarted,
				in_progress: s.inProgress,
				awaiting_review: s.awaitingReview,
				clarification: s.clarification,
				awaiting_approval: s.awaitingApproval,
				closed: s.closed,
				overdue: s.overdue,
				average_score_percent: s.averageScorePercent,
			},
		};
	},

	async getQueueCounts(loadAudits: LoadAudits): Promise<{ data: ReviewQueueCountsResponse }> {
		const statuses = Object.values(REVIEW_QUEUE_STATUSES).flat();
		const items = await loadAudits({ statuses });
		const c = computeQueueCounts(items);
		return {
			data: {
				to_review: c.TO_REVIEW,
				in_review: c.IN_REVIEW,
				with_dealer: c.WITH_DEALER,
				completed: c.COMPLETED,
			},
		};
	},

	/** One audit per reviewer group, because the existing create is single-reviewer. */
	async launchCycle(payload: CreateAuditCyclePayload): Promise<{ data: AuditCycleLaunchResponse }> {
		const byReviewer = new Map<string, string[]>();
		for (const { dealer_id, reviewer_id } of payload.assignments) {
			byReviewer.set(reviewer_id, [...(byReviewer.get(reviewer_id) ?? []), dealer_id]);
		}
		const auditIds: string[] = [];
		for (const [reviewerId, dealerIds] of byReviewer) {
			const created = await dealerAuditApi.createAudits({
				templateId: payload.template_id,
				dealerIds,
				reviewerId,
				periodType: payload.period_type,
				year: payload.period_year,
				quarter: payload.period_quarter,
				dueDate: payload.due_date,
			});
			auditIds.push(...created.map((audit) => audit.id));
		}
		return { data: { created_count: auditIds.length, audit_ids: auditIds } };
	},

	async sendReminders(payload: SendReminderPayload): Promise<{ data: SendReminderResponse }> {
		await delay();
		return { data: { sent_count: payload.audit_ids.length, sent_at: new Date().toISOString() } };
	},

	async resendReport(payload: ResendReportPayload): Promise<{ data: ResendReportResponse }> {
		await delay();
		return {
			data: { sent_at: new Date().toISOString(), recipient_count: payload.recipients.length },
		};
	},
};
