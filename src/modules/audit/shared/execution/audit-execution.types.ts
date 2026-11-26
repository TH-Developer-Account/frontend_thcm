// modules/audit/shared/execution/audit-execution.types.ts
//
// Module-neutral shapes of an audit being EXECUTED (answered and reviewed):
// checklist item, evidence, self/review/clarification blocks, form drafts.
// Dealer Audit and Factory Audit both map their backend responses onto these.
// Anything that depends on a module's statuses, roles or periods does NOT
// belong here.

import type { ReviewerItemDecision } from "../shared.audit.types";
import type { LivePhotoValue } from "../checklist/evidence.types";

// ── Stable values ─────────────────────────────────────────────────────

/** Where the final score came from. SELF_AUTO = initial score taken as final. */
export type FinalScoreSource = "REVIEWER" | "SELF_AUTO" | "PENDING";

export type SlaState = "NONE" | "ON_TRACK" | "DUE_SOON" | "OVERDUE";

/** Which side of the item screen the current user works on. */
export type AssessmentMode = "SELF" | "REVIEW" | "READ_ONLY";

export type ClarificationStatus = "OPEN" | "RESPONDED" | "CLOSED";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export type AuditStatusTone =
	| "neutral"
	| "info"
	| "warning"
	| "caution"
	| "success"
	| "danger";

/** Variants understood by the shared <Badge>. */
export type AuditBadgeVariant =
	| "neutral"
	| "info"
	| "warning"
	| "success"
	| "danger";

export type ReminderSeverity = "info" | "warning" | "danger";

export interface AuditReminder {
	id: string;
	severity: ReminderSeverity;
	message: string;
}

// ── Item shapes ───────────────────────────────────────────────────────

export interface AuditItemEvidence {
	id: string;
	url: string;
	thumbnailUrl: string | null;
	fileName: string;
	sizeBytes: number | null;
	mimeType: string | null;
	capturedAt: string;
	latitude: number;
	longitude: number;
	accuracyMeters: number | null;
}

export interface AuditScoreLevel {
	score: number;
	criteria: string;
}

export interface AuditItemSelf {
	score: number | null;
	remarks: string;
	evidence: AuditItemEvidence[];
	answeredAt: string | null;
	/** Server-confirmed: all mandatory fields and evidence are satisfied. */
	isComplete: boolean;
}

export interface AuditItemReview {
	score: number | null;
	remarks: string;
	decision: ReviewerItemDecision;
	scoreChangeReason: string | null;
	reviewedAt: string | null;
}

export interface AuditItemClarification {
	id: string;
	status: ClarificationStatus;
	remarks: string;
	raisedAt: string;
	dueAt: string | null;
	response: string | null;
	respondedAt: string | null;
}

export interface AuditChecklistItem {
	id: string;
	sequence: number;
	sectionId: string;
	sectionName: string;
	title: string;
	guidance: string;
	criteria: string[];
	/** Module vocabularies (e.g. dealer parameter category) are plain strings here. */
	category: string | null;
	functionArea: string | null;
	isScored: boolean;
	scoreLevels: AuditScoreLevel[];
	/** Scores the assessor may pick, ascending. Empty = not configured. */
	allowedScores: number[];
	minScore: number;
	/** The "value" of this parameter — highest obtainable score. */
	maxScore: number;
	evidenceRequired: boolean;
	minEvidenceCount: number;
	maxEvidenceCount: number;
	self: AuditItemSelf;
	review: AuditItemReview | null;
	clarification: AuditItemClarification | null;
}

export interface AuditChecklistSection {
	id: string;
	sequence: number;
	name: string;
	items: AuditChecklistItem[];
}

// ── Audit trail ───────────────────────────────────────────────────────

export interface AuditHistoryEntry<
	TAction extends string = string,
	TStatus extends string = string,
> {
	id: string;
	action: TAction;
	actorName: string;
	actorRole: string | null;
	occurredAt: string;
	fromStatus: TStatus | null;
	toStatus: TStatus | null;
	comment: string | null;
}

// ── Editable drafts ───────────────────────────────────────────────────

/** Self-assessment draft for one item. */
export interface ChecklistItemFormValues {
	score: number | null;
	remarks: string;
	evidence: LivePhotoValue[];
}

/** Reviewer draft for one item. */
export interface ReviewItemFormValues {
	score: number | null;
	remarks: string;
	decision: ReviewerItemDecision;
	scoreChangeReason: string;
}

// ── What the shared forms need from a module's draft hooks ────────────
// Each module owns its draft hook (saving, API, cache); the shared forms
// only depend on this narrow surface.

export interface ItemDraftController {
	values: ChecklistItemFormValues;
	setScore: (score: number) => void;
	setRemarks: (remarks: string) => void;
	errors: Partial<Record<"score" | "remarks" | "evidence", string>>;
}

export interface EvidenceController {
	addCapturedPhoto: (photo: LivePhotoValue) => void;
	retryUpload: (photoId: string) => void;
	removePhoto: (photoId: string) => void;
}

export interface ReviewDraftController {
	values: ReviewItemFormValues;
	setScore: (score: number) => void;
	setRemarks: (remarks: string) => void;
	setDecision: (decision: ReviewItemFormValues["decision"]) => void;
	setScoreChangeReason: (reason: string) => void;
	errors: Partial<
		Record<"score" | "remarks" | "decision" | "scoreChangeReason", string>
	>;
}
