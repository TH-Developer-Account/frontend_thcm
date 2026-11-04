// modules/audit/dealerAudit/cycle/dealer-cycle.logic.ts
//
// Pure, framework-free rules for the cycle screens. Everything here is unit
// tested (dealer-cycle.test.ts). The backend re-enforces every rule.

import {
	isAwaitingApprovalStatus,
	isClarificationStatus,
	isReportAvailableStatus,
	isReviewOpenStatus,
	isSlaTrackedStatus,
} from "../dealer-audit.status";
import type {
	DealerAuditDealerOption,
	DealerAuditListItem,
	DealerAuditPeriod,
	DealerAuditReviewerOption,
	DealerAuditStatus,
} from "../dealer-audit.types";
import type { DealerFacilityType } from "../templates/dealer-template.types";
import type { ScoreMatrixRow } from "../../shared/checklist/ScoreMatrix";
import { resolveFinalItemScore } from "../../shared/execution/audit-execution.utils";
import type {
	AuditChecklistItem,
	AuditChecklistSection,
} from "../../shared/execution/audit-execution.types";
import type {
	AuditTrackerSummary,
	CycleAssignment,
	DealerEligibility,
	ReviewQueueCounts,
	ReviewQueueTab,
	ReviewerWorkload,
} from "./dealer-cycle.types";

// ── Queue tabs ────────────────────────────────────────────────────────

export const REVIEW_QUEUE_TAB_ORDER: readonly ReviewQueueTab[] = [
	"TO_REVIEW",
	"IN_REVIEW",
	"WITH_DEALER",
	"COMPLETED",
];

/** Which audit statuses each reviewer-queue tab shows. */
export const REVIEW_QUEUE_STATUSES: Record<
	ReviewQueueTab,
	readonly DealerAuditStatus[]
> = {
	TO_REVIEW: ["SUBMITTED", "RESUBMITTED"],
	IN_REVIEW: ["UNDER_REVIEW"],
	WITH_DEALER: ["CLARIFICATION_REQUIRED", "RECTIFICATION_IN_PROGRESS"],
	COMPLETED: [
		"PENDING_APPROVAL",
		"APPROVED",
		"IMPROVEMENT_REQUIRED",
		"CLOSED",
		"REJECTED",
	],
};

export const getQueueTabForStatus = (
	status: DealerAuditStatus,
): ReviewQueueTab | null =>
	REVIEW_QUEUE_TAB_ORDER.find((tab) =>
		REVIEW_QUEUE_STATUSES[tab].includes(status),
	) ?? null;

export const computeQueueCounts = (
	items: readonly DealerAuditListItem[],
): ReviewQueueCounts => {
	const counts: ReviewQueueCounts = {
		TO_REVIEW: 0,
		IN_REVIEW: 0,
		WITH_DEALER: 0,
		COMPLETED: 0,
	};
	for (const item of items) {
		const tab = getQueueTabForStatus(item.status);
		if (tab) counts[tab] += 1;
	}
	return counts;
};

/** Statuses the approver queue shows. */
export const APPROVER_QUEUE_STATUSES: readonly DealerAuditStatus[] = [
	"PENDING_APPROVAL",
];

// ── Tracker KPIs ──────────────────────────────────────────────────────

export const isAuditOverdue = (
	item: Pick<DealerAuditListItem, "status" | "dueAt">,
	now: Date = new Date(),
): boolean => {
	if (!item.dueAt || !isSlaTrackedStatus(item.status)) return false;
	const due = new Date(item.dueAt);
	return !Number.isNaN(due.getTime()) && due.getTime() < now.getTime();
};

export const computeTrackerSummary = (
	items: readonly DealerAuditListItem[],
	now: Date = new Date(),
): AuditTrackerSummary => {
	let notStarted = 0;
	let inProgress = 0;
	let awaitingReview = 0;
	let clarification = 0;
	let awaitingApproval = 0;
	let closed = 0;
	let overdue = 0;
	let scoredCount = 0;
	let scoredPercentTotal = 0;

	for (const item of items) {
		if (item.status === "DRAFT") notStarted += 1;
		else if (item.status === "IN_PROGRESS") inProgress += 1;
		else if (isReviewOpenStatus(item.status)) awaitingReview += 1;
		else if (isClarificationStatus(item.status)) clarification += 1;
		else if (isAwaitingApprovalStatus(item.status)) awaitingApproval += 1;
		else if (item.status === "CLOSED" || item.status === "APPROVED") closed += 1;

		if (isAuditOverdue(item, now)) overdue += 1;

		if (item.finalScore !== null && item.maxScore > 0) {
			scoredCount += 1;
			scoredPercentTotal += (item.finalScore / item.maxScore) * 100;
		}
	}

	return {
		total: items.length,
		notStarted,
		inProgress,
		awaitingReview,
		clarification,
		awaitingApproval,
		closed,
		overdue,
		averageScorePercent:
			scoredCount === 0
				? null
				: Math.round((scoredPercentTotal / scoredCount) * 10) / 10,
	};
};

// ── Eligibility ───────────────────────────────────────────────────────

const isSamePeriod = (a: DealerAuditPeriod, b: DealerAuditPeriod): boolean =>
	a.type === b.type && a.year === b.year && a.quarter === b.quarter;

/** A cancelled / expired audit does not block a fresh one. */
const BLOCKS_NEW_AUDIT = (status: DealerAuditStatus): boolean =>
	status !== "CANCELLED" && status !== "EXPIRED";

/**
 * Rule: one live audit per dealer + period, and the dealer's facility type
 * must match the template's (when both are known).
 */
export const computeDealerEligibility = (input: {
	dealers: readonly DealerAuditDealerOption[];
	existingAudits: readonly DealerAuditListItem[];
	period: DealerAuditPeriod;
	templateFacilityType: DealerFacilityType | null;
}): DealerEligibility[] => {
	const { dealers, existingAudits, period, templateFacilityType } = input;
	const blockingByDealer = new Map<string, string>();
	for (const audit of existingAudits) {
		if (isSamePeriod(audit.period, period) && BLOCKS_NEW_AUDIT(audit.status)) {
			blockingByDealer.set(audit.dealerId, audit.auditNumber);
		}
	}

	return dealers.map((dealer): DealerEligibility => {
		const blocking = blockingByDealer.get(dealer.id) ?? null;
		if (blocking) {
			return {
				dealerId: dealer.id,
				isEligible: false,
				reason: "ALREADY_AUDITED",
				blockingAuditNumber: blocking,
			};
		}
		if (
			templateFacilityType &&
			dealer.facilityType &&
			dealer.facilityType !== templateFacilityType
		) {
			return {
				dealerId: dealer.id,
				isEligible: false,
				reason: "FACILITY_MISMATCH",
				blockingAuditNumber: null,
			};
		}
		return {
			dealerId: dealer.id,
			isEligible: true,
			reason: null,
			blockingAuditNumber: null,
		};
	});
};

// ── Reviewer workload + auto-assign ───────────────────────────────────

export const computeReviewerWorkload = (
	reviewers: readonly DealerAuditReviewerOption[],
	audits: readonly DealerAuditListItem[],
): ReviewerWorkload[] => {
	const counts = new Map<string, number>();
	for (const audit of audits) {
		const reviewerId = audit.assignedReviewer?.id;
		if (!reviewerId) continue;
		if (audit.status === "CLOSED" || audit.status === "CANCELLED") continue;
		counts.set(reviewerId, (counts.get(reviewerId) ?? 0) + 1);
	}
	return reviewers.map((reviewer) => ({
		reviewerId: reviewer.id,
		openAudits: counts.get(reviewer.id) ?? 0,
	}));
};

/**
 * Spreads dealers over reviewers, always giving the next dealer to the
 * reviewer with the lightest load (existing open audits + this cycle).
 * Dealers that already have a reviewer in `keep` are left untouched.
 * Deterministic: ties break on reviewer name, then id.
 *
 * NOTE: zone/region matching needs zone on both dealer and reviewer; the
 * option contracts carry neither today, so it is not applied here.
 */
export const autoAssignReviewers = (input: {
	dealerIds: readonly string[];
	reviewers: readonly DealerAuditReviewerOption[];
	workload: readonly ReviewerWorkload[];
	keep?: Readonly<Record<string, string>>;
}): Record<string, string> => {
	const { dealerIds, reviewers, workload, keep = {} } = input;
	const result: Record<string, string> = {};
	if (reviewers.length === 0) return result;

	const load = new Map<string, number>(
		reviewers.map((reviewer) => [
			reviewer.id,
			workload.find((entry) => entry.reviewerId === reviewer.id)?.openAudits ?? 0,
		]),
	);
	const order = [...reviewers].sort(
		(a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
	);

	// Count kept assignments first so they weigh on the balance.
	for (const dealerId of dealerIds) {
		const kept = keep[dealerId];
		if (kept && load.has(kept)) {
			result[dealerId] = kept;
			load.set(kept, (load.get(kept) ?? 0) + 1);
		}
	}

	for (const dealerId of dealerIds) {
		if (result[dealerId]) continue;
		let best = order[0];
		for (const candidate of order) {
			if ((load.get(candidate.id) ?? 0) < (load.get(best.id) ?? 0)) {
				best = candidate;
			}
		}
		result[dealerId] = best.id;
		load.set(best.id, (load.get(best.id) ?? 0) + 1);
	}
	return result;
};

export const toAssignmentList = (
	dealerIds: readonly string[],
	reviewerByDealer: Readonly<Record<string, string>>,
): CycleAssignment[] =>
	dealerIds.flatMap((dealerId) => {
		const reviewerId = reviewerByDealer[dealerId];
		return reviewerId ? [{ dealerId, reviewerId }] : [];
	});

export const countUnassigned = (
	dealerIds: readonly string[],
	reviewerByDealer: Readonly<Record<string, string>>,
): number => dealerIds.filter((id) => !reviewerByDealer[id]).length;

// ── Reminder targeting ────────────────────────────────────────────────

/** Only audits the dealer still has to act on can be reminded. */
export const canRemindAudit = (
	item: Pick<DealerAuditListItem, "status">,
): boolean => isSlaTrackedStatus(item.status);

// ── CSV (tracker "download summary") ──────────────────────────────────

const csvCell = (value: string | number | null): string => {
	const text = value === null ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildAuditsCsv = (
	items: readonly DealerAuditListItem[],
	statusLabel: (status: DealerAuditStatus) => string,
): string => {
	const header = [
		"Audit number",
		"Dealer code",
		"Dealer",
		"Location",
		"Status",
		"Reviewer",
		"Due date",
		"Progress",
		"Dealer score",
		"Final score",
		"Max score",
	];
	const rows = items.map((item) => [
		item.auditNumber,
		item.dealerCode,
		item.dealerName,
		item.location,
		statusLabel(item.status),
		item.assignedReviewer?.name ?? "",
		item.dueAt ? item.dueAt.slice(0, 10) : "",
		`${item.completedItems}/${item.totalItems}`,
		item.selfScore,
		item.finalScore,
		item.maxScore,
	]);
	return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
};


// ── Scoring views (status page, review summary, approval, report) ─────

const sumScored = (
	items: readonly AuditChecklistItem[],
	pick: (item: AuditChecklistItem) => number | null,
): number | null => {
	const scored = items.filter((item) => item.isScored);
	const hasAny = scored.some((item) => pick(item) !== null);
	return hasAny ? scored.reduce((acc, item) => acc + (pick(item) ?? 0), 0) : null;
};

/** One row per section: dealer / reviewer / final, ready for <ScoreMatrix>. */
export const buildScoreMatrixRows = (
	sections: readonly AuditChecklistSection[],
): ScoreMatrixRow[] =>
	sections.map((section) => {
		const scored = section.items.filter((item) => item.isScored);
		const hasAnyScore = scored.some(
			(item) => item.self.score !== null || item.review?.score != null,
		);
		return {
			id: section.id,
			label: section.name,
			dealerScore: sumScored(section.items, (item) => item.self.score),
			reviewerScore: sumScored(section.items, (item) => item.review?.score ?? null),
			finalScore: hasAnyScore
				? scored.reduce((acc, item) => acc + resolveFinalItemScore(item).score, 0)
				: null,
			maxScore: scored.reduce((acc, item) => acc + item.maxScore, 0),
		};
	});

export interface ScoreDropEntry {
	item: AuditChecklistItem;
	dealerScore: number;
	reviewerScore: number;
	drop: number;
}

/** Items where the reviewer scored below the dealer, biggest drop first. */
export const getScoreDrops = (
	items: readonly AuditChecklistItem[],
): ScoreDropEntry[] =>
	items
		.flatMap((item): ScoreDropEntry[] => {
			const dealerScore = item.self.score;
			const reviewerScore = item.review?.score ?? null;
			if (dealerScore === null || reviewerScore === null || reviewerScore >= dealerScore) {
				return [];
			}
			return [{ item, dealerScore, reviewerScore, drop: dealerScore - reviewerScore }];
		})
		.sort((a, b) => b.drop - a.drop || a.item.sequence - b.item.sequence);

export interface DeficiencyEntry {
	item: AuditChecklistItem;
	finalScore: number;
	gap: number;
}

/** Scored items below full marks (or marked deficient), largest gap first. */
export const getDeficiencies = (
	items: readonly AuditChecklistItem[],
): DeficiencyEntry[] =>
	items
		.filter((item) => item.isScored)
		.flatMap((item): DeficiencyEntry[] => {
			const finalScore = resolveFinalItemScore(item).score;
			const gap = item.maxScore - finalScore;
			const flagged = item.review?.decision === "DEFICIENT";
			return gap > 0 || flagged ? [{ item, finalScore, gap }] : [];
		})
		.sort((a, b) => b.gap - a.gap || a.item.sequence - b.item.sequence);

/** Items the reviewer wants the dealer to explain again. */
export const getClarificationCandidates = (
	items: readonly AuditChecklistItem[],
): AuditChecklistItem[] =>
	items.filter((item) => item.review?.decision === "CLARIFICATION_REQUIRED");


// ── "My audits": one clear next step per audit ───────────────────────

export type DealerPrimaryActionKey =
	| "start"
	| "continue"
	| "submit"
	| "fix"
	| "viewStatus"
	| "viewReport";

export const getDealerPrimaryAction = (
	audit: Pick<DealerAuditListItem, "status" | "completedItems" | "totalItems">,
): DealerPrimaryActionKey => {
	if (isClarificationStatus(audit.status)) return "fix";
	if (isReportAvailableStatus(audit.status)) return "viewReport";
	if (audit.status === "DRAFT") return "start";
	if (audit.status === "IN_PROGRESS") {
		return audit.totalItems > 0 && audit.completedItems >= audit.totalItems
			? "submit"
			: "continue";
	}
	return "viewStatus";
};

/** Audits that need the dealer to act come first, then by due date. */
export const sortAuditsForDealer = <
	T extends Pick<DealerAuditListItem, "status" | "dueAt" | "completedItems" | "totalItems">,
>(
	audits: readonly T[],
): T[] => {
	const needsAction = (audit: T): number => {
		const key = getDealerPrimaryAction(audit);
		return key === "viewStatus" || key === "viewReport" ? 1 : 0;
	};
	return [...audits].sort((a, b) => {
		const byAction = needsAction(a) - needsAction(b);
		if (byAction !== 0) return byAction;
		const aDue = a.dueAt ? Date.parse(a.dueAt) : Number.POSITIVE_INFINITY;
		const bDue = b.dueAt ? Date.parse(b.dueAt) : Number.POSITIVE_INFINITY;
		return aDue - bDue;
	});
};


/** 1-based step on the 4-step progress bar; 0 = no progress bar (ended early). */
export const getAuditProgressStep = (status: DealerAuditStatus): number => {
	switch (status) {
		case "DRAFT":
		case "IN_PROGRESS":
			return 1;
		case "SUBMITTED":
		case "UNDER_REVIEW":
		case "CLARIFICATION_REQUIRED":
		case "RECTIFICATION_IN_PROGRESS":
		case "RESUBMITTED":
			return 2;
		case "PENDING_APPROVAL":
			return 3;
		case "APPROVED":
		case "IMPROVEMENT_REQUIRED":
		case "CLOSED":
			return 4;
		default:
			return 0;
	}
};

// ── Report e-mail recipients ──────────────────────────────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ParsedRecipients {
	emails: string[];
	invalid: string[];
}

/** Splits "a@x.com, b@y.com; c@z.com" into unique valid / invalid addresses. */
export const parseRecipientList = (raw: string): ParsedRecipients => {
	const parts = raw
		.split(/[\s,;]+/)
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean);
	const unique = [...new Set(parts)];
	return {
		emails: unique.filter((email) => EMAIL_PATTERN.test(email)),
		invalid: unique.filter((email) => !EMAIL_PATTERN.test(email)),
	};
};
