// modules/audit/dealerAudit/dealer-audit.status.ts
//
// The ONE place that knows what each audit status means: label, tone,
// allowed transitions and the status groups other rules branch on.
// Components never compare status strings themselves.

import { dealerAuditContent } from "./dealer-audit.content";
import type {
	AuditBadgeVariant,
	AuditStatusTone,
} from "../shared/execution/audit-execution.types";
import type { DealerAuditStatus } from "./dealer-audit.types";

export type { AuditBadgeVariant, AuditStatusTone };

export const assertNever = (value: never): never => {
	throw new Error(`Unhandled value: ${String(value)}`);
};

// ── Labels (copy lives in the content JSON) ───────────────────────────

/**
 * Typed as Record<DealerAuditStatus, string>: adding a status without a
 * label in the JSON is a compile error.
 */
const STATUS_LABELS: Record<DealerAuditStatus, string> =
	dealerAuditContent.status;

export const getAuditStatusLabel = (status: DealerAuditStatus): string =>
	STATUS_LABELS[status];

const STATUS_LABELS_BY_CODE = new Map<string, string>(
	Object.entries(STATUS_LABELS),
);

/** For shared UI that only knows the raw status code (e.g. audit history). */
export const getAuditStatusLabelByCode = (code: string): string =>
	STATUS_LABELS_BY_CODE.get(code) ?? code;

// ── Tone (colour is never the only signal — badges always carry text) ──

export const getAuditStatusTone = (
	status: DealerAuditStatus,
): AuditStatusTone => {
	switch (status) {
		case "DRAFT":
		case "CANCELLED":
			return "neutral";
		case "IN_PROGRESS":
			return "info";
		case "SUBMITTED":
		case "UNDER_REVIEW":
		case "RESUBMITTED":
		case "PENDING_APPROVAL":
			return "warning";
		case "CLARIFICATION_REQUIRED":
		case "RECTIFICATION_IN_PROGRESS":
		case "IMPROVEMENT_REQUIRED":
			return "caution";
		case "APPROVED":
		case "CLOSED":
			return "success";
		case "REJECTED":
		case "EXPIRED":
			return "danger";
		default:
			return assertNever(status);
	}
};

export const getAuditStatusBadgeVariant = (
	status: DealerAuditStatus,
): AuditBadgeVariant => {
	const tone = getAuditStatusTone(status);
	// The shared badge has no separate "caution" style: it shares the amber
	// "warning" look and is told apart by its label and icon.
	return tone === "caution" ? "warning" : tone;
};

// ── Transitions ───────────────────────────────────────────────────────

/**
 * Mirrors the transition table agreed for the backend. The UI uses it to
 * show or hide actions; the server stays authoritative.
 *
 * Additions to the original table (flagged for confirmation):
 *  - CLARIFICATION_REQUIRED → RECTIFICATION_IN_PROGRESS: dealer starts
 *    fixing (otherwise nothing could ever enter RECTIFICATION_IN_PROGRESS).
 *  - SUBMITTED / UNDER_REVIEW / RESUBMITTED → CLOSED: quarter-end
 *    auto-finalisation with the dealer's initial score taken as final.
 *  - DRAFT / IN_PROGRESS → EXPIRED: the dealer never submitted before the
 *    period ended.
 */
export const ALLOWED_AUDIT_TRANSITIONS: Record<
	DealerAuditStatus,
	readonly DealerAuditStatus[]
> = {
	DRAFT: ["IN_PROGRESS", "EXPIRED", "CANCELLED"],
	IN_PROGRESS: ["SUBMITTED", "EXPIRED", "CANCELLED"],
	SUBMITTED: ["UNDER_REVIEW", "CLOSED"],
	UNDER_REVIEW: [
		"CLARIFICATION_REQUIRED",
		"PENDING_APPROVAL",
		"IMPROVEMENT_REQUIRED",
		"CLOSED",
	],
	CLARIFICATION_REQUIRED: [
		"RECTIFICATION_IN_PROGRESS",
		"RESUBMITTED",
		"EXPIRED",
	],
	RECTIFICATION_IN_PROGRESS: ["RESUBMITTED", "EXPIRED"],
	RESUBMITTED: ["UNDER_REVIEW", "CLOSED"],
	// CLOSED is reserved for the system quarter-end auto-finalisation
	// (dealer's initial score becomes final); no user action does this.
	PENDING_APPROVAL: ["APPROVED", "CLARIFICATION_REQUIRED", "REJECTED", "CLOSED"],
	APPROVED: ["CLOSED"],
	IMPROVEMENT_REQUIRED: ["CLOSED"],
	CLOSED: [],
	REJECTED: [],
	EXPIRED: [],
	CANCELLED: [],
};

export const canTransitionAuditStatus = (
	from: DealerAuditStatus,
	to: DealerAuditStatus,
): boolean => ALLOWED_AUDIT_TRANSITIONS[from].includes(to);

// ── Status groups ─────────────────────────────────────────────────────

export const isTerminalAuditStatus = (status: DealerAuditStatus): boolean =>
	ALLOWED_AUDIT_TRANSITIONS[status].length === 0;

/** Dealer may freely edit every item. */
export const isSelfAssessmentOpenStatus = (
	status: DealerAuditStatus,
): boolean => status === "DRAFT" || status === "IN_PROGRESS";

/** Dealer may edit ONLY the items the reviewer flagged. */
export const isClarificationStatus = (status: DealerAuditStatus): boolean =>
	status === "CLARIFICATION_REQUIRED" ||
	status === "RECTIFICATION_IN_PROGRESS";

/** Dealer can (re)submit the self-assessment. */
export const isDealerSubmittableStatus = (
	status: DealerAuditStatus,
): boolean => isSelfAssessmentOpenStatus(status) || isClarificationStatus(status);

/** Reviewer may start or continue scoring. */
export const isReviewOpenStatus = (status: DealerAuditStatus): boolean =>
	status === "SUBMITTED" ||
	status === "UNDER_REVIEW" ||
	status === "RESUBMITTED";

export const isAwaitingApprovalStatus = (
	status: DealerAuditStatus,
): boolean => status === "PENDING_APPROVAL";

/** A final score exists and the report can be produced. */
export const isReportAvailableStatus = (status: DealerAuditStatus): boolean =>
	status === "APPROVED" ||
	status === "CLOSED" ||
	status === "IMPROVEMENT_REQUIRED";

/** Audits that can still miss a deadline (drive reminders / SLA). */
export const isSlaTrackedStatus = (status: DealerAuditStatus): boolean =>
	isSelfAssessmentOpenStatus(status) || isClarificationStatus(status);

/** Quarter-end finalisation applies to audits stuck in review/approval. */
export const isAutoFinalizableStatus = (status: DealerAuditStatus): boolean =>
	status === "SUBMITTED" ||
	status === "UNDER_REVIEW" ||
	status === "RESUBMITTED" ||
	status === "PENDING_APPROVAL";

/** Statuses offered in the listing filter, in workflow order. */
export const AUDIT_STATUS_FILTER_ORDER: readonly DealerAuditStatus[] = [
	"DRAFT",
	"IN_PROGRESS",
	"SUBMITTED",
	"UNDER_REVIEW",
	"CLARIFICATION_REQUIRED",
	"RECTIFICATION_IN_PROGRESS",
	"RESUBMITTED",
	"PENDING_APPROVAL",
	"APPROVED",
	"IMPROVEMENT_REQUIRED",
	"CLOSED",
	"REJECTED",
	"EXPIRED",
	"CANCELLED",
];
