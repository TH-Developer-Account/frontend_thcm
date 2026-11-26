// modules/audit/shared/execution/audit-execution.validation.ts
//
// Module-neutral validation of ONE checklist parameter plus the jump-to-item
// summary for a whole audit:
//   1. field level          → zod schemas used by react-hook-form
//   2. item completion      → collectSelfItemIssues / collectReviewItemIssues
//   3. whole audit          → validateItemsForSelfSubmission / validateItemsForReviewSubmission
//
// Status-dependent decisions (e.g. "clarification-only") are made by the
// calling module; these functions take plain flags. Messages come from
// audit-execution.content.en.json.

import { z } from "zod";
import type { LivePhotoValue } from "../checklist/evidence.types";
import type { ReviewerItemDecision } from "../shared.audit.types";
import { AUDIT_EXECUTION_RULES } from "./audit-execution.config";
import {
	auditExecutionContent as content,
	formatAuditMessage as format,
} from "./audit-execution.content";
import type { AuditChecklistItem } from "./audit-execution.types";
import {
	getRequiredEvidenceCount,
	hasScoreChanged,
	isScoreAllowed,
} from "./audit-execution.utils";

const msg = content.validation;
const { text } = AUDIT_EXECUTION_RULES;

// ── Shared issue shape ────────────────────────────────────────────────

export type ItemFieldName = "score" | "remarks" | "evidence";
export type ReviewFieldName =
	| "score"
	| "remarks"
	| "decision"
	| "scoreChangeReason";

export interface FieldIssue<TField extends string> {
	field: TField;
	message: string;
}

/** The slice of a checklist item the validators need. */
export type ItemRules = Pick<
	AuditChecklistItem,
	| "isScored"
	| "allowedScores"
	| "minScore"
	| "maxScore"
	| "evidenceRequired"
	| "minEvidenceCount"
	| "maxEvidenceCount"
>;

// ── 1 + 2 ─ Self-assessment item ──────────────────────────────────────

export interface SelfItemSnapshot {
	score: number | null;
	remarks: string;
	evidence: ReadonlyArray<{
		status: LivePhotoValue["uploadStatus"];
		hasLocation: boolean;
	}>;
}

export const toSelfSnapshot = (values: {
	score: number | null;
	remarks: string;
	evidence: readonly LivePhotoValue[];
}): SelfItemSnapshot => ({
	score: values.score,
	remarks: values.remarks,
	evidence: values.evidence.map((photo) => ({
		status: photo.uploadStatus,
		hasLocation: Boolean(photo.location),
	})),
});

export type ValidationMode = "draft" | "complete";

/**
 * "draft"    autosave: only rejects values that are WRONG (out of range, too long)
 * "complete" Save & Next / submit: also rejects values that are MISSING
 */
export function collectSelfItemIssues(
	rules: ItemRules,
	snapshot: SelfItemSnapshot,
	mode: ValidationMode,
): FieldIssue<ItemFieldName>[] {
	const issues: FieldIssue<ItemFieldName>[] = [];
	const complete = mode === "complete";

	// Score — value, min and max are per parameter.
	if (rules.isScored) {
		if (snapshot.score === null) {
			if (complete) issues.push({ field: "score", message: msg.scoreRequired });
		} else if (!isScoreAllowed(rules, snapshot.score)) {
			issues.push({
				field: "score",
				message:
					rules.allowedScores.length > 0
						? format(msg.scoreNotAllowed, {
								allowed: rules.allowedScores.join(", "),
							})
						: format(msg.scoreOutOfRange, {
								min: rules.minScore,
								max: rules.maxScore,
							}),
			});
		}
	}

	if (snapshot.remarks.length > text.remarksMaxLength) {
		issues.push({
			field: "remarks",
			message: format(msg.remarksTooLong, { max: text.remarksMaxLength }),
		});
	}

	// Evidence — only photos the server confirmed count.
	const uploaded = snapshot.evidence.filter((e) => e.status === "UPLOADED");
	const hasPending = snapshot.evidence.some(
		(e) => e.status === "LOCAL" || e.status === "UPLOADING",
	);
	const hasFailed = snapshot.evidence.some((e) => e.status === "FAILED");

	if (snapshot.evidence.length > rules.maxEvidenceCount) {
		issues.push({
			field: "evidence",
			message: format(msg.evidenceMax, { max: rules.maxEvidenceCount }),
		});
	}

	if (
		AUDIT_EXECUTION_RULES.evidence.locationRequired &&
		snapshot.evidence.some((e) => !e.hasLocation)
	) {
		issues.push({ field: "evidence", message: msg.evidenceNeedsLocation });
	}

	if (complete) {
		if (hasPending) {
			issues.push({ field: "evidence", message: msg.evidenceUploading });
		} else if (hasFailed) {
			issues.push({ field: "evidence", message: msg.evidenceFailed });
		}

		const required = getRequiredEvidenceCount(rules);
		if (required > 0 && uploaded.length < required) {
			issues.push({
				field: "evidence",
				message: format(msg.evidenceMin, { min: required }),
			});
		}
	}

	return issues;
}

const livePhotoSchema = z.custom<LivePhotoValue>(
	(value) => typeof value === "object" && value !== null && "id" in value,
);

const selfItemShape = z.object({
	score: z.number().nullable(),
	remarks: z.string(),
	evidence: z.array(livePhotoSchema),
});

/** Field-level schema for the self-assessment item form. */
export const createSelfItemSchema = (rules: ItemRules, mode: ValidationMode) =>
	selfItemShape.superRefine((values, ctx) => {
		for (const issue of collectSelfItemIssues(
			rules,
			toSelfSnapshot(values),
			mode,
		)) {
			ctx.addIssue({
				code: "custom",
				path: [issue.field],
				message: issue.message,
			});
		}
	});

// ── 1 + 2 ─ Reviewer item ─────────────────────────────────────────────

export interface ReviewItemSnapshot {
	score: number | null;
	remarks: string;
	decision: ReviewerItemDecision;
	scoreChangeReason: string;
}

const REVIEW_DECISIONS = [
	"PENDING",
	"ACCEPTED",
	"CLARIFICATION_REQUIRED",
	"DEFICIENT",
	// Accepted by the type, rejected below: N/A is not allowed — score 0.
	"NOT_APPLICABLE",
] as const;

export function collectReviewItemIssues(
	rules: ItemRules,
	selfScore: number | null,
	values: ReviewItemSnapshot,
	mode: ValidationMode,
): FieldIssue<ReviewFieldName>[] {
	const issues: FieldIssue<ReviewFieldName>[] = [];
	const complete = mode === "complete";

	if (values.decision === "NOT_APPLICABLE") {
		issues.push({ field: "decision", message: msg.notApplicableNotAllowed });
	}
	if (complete && values.decision === "PENDING") {
		issues.push({ field: "decision", message: msg.reviewerDecisionRequired });
	}

	if (rules.isScored) {
		if (values.score === null) {
			if (complete) {
				issues.push({ field: "score", message: msg.reviewerScoreRequired });
			}
		} else if (!isScoreAllowed(rules, values.score)) {
			issues.push({
				field: "score",
				message:
					rules.allowedScores.length > 0
						? format(msg.scoreNotAllowed, {
								allowed: rules.allowedScores.join(", "),
							})
						: format(msg.scoreOutOfRange, {
								min: rules.minScore,
								max: rules.maxScore,
							}),
			});
		}
	}

	if (values.remarks.length > text.remarksMaxLength) {
		issues.push({
			field: "remarks",
			message: format(msg.remarksTooLong, { max: text.remarksMaxLength }),
		});
	}
	// A deficiency must be explained.
	if (
		complete &&
		values.decision === "DEFICIENT" &&
		values.remarks.trim().length < text.reasonMinLength
	) {
		issues.push({ field: "remarks", message: msg.reviewerRemarksRequired });
	}

	// Changing the self-assessed score must be justified.
	const reason = values.scoreChangeReason.trim();
	if (reason.length > text.reasonMaxLength) {
		issues.push({
			field: "scoreChangeReason",
			message: format(msg.reasonTooLong, { max: text.reasonMaxLength }),
		});
	}
	if (
		complete &&
		hasScoreChanged(selfScore, values.score) &&
		reason.length < text.reasonMinLength
	) {
		issues.push({
			field: "scoreChangeReason",
			message: msg.scoreChangeReasonRequired,
		});
	}

	return issues;
}

const reviewItemShape = z.object({
	score: z.number().nullable(),
	remarks: z.string(),
	decision: z.enum(REVIEW_DECISIONS),
	scoreChangeReason: z.string(),
});

export const createReviewItemSchema = (
	rules: ItemRules,
	selfScore: number | null,
	mode: ValidationMode,
) =>
	reviewItemShape.superRefine((values, ctx) => {
		for (const issue of collectReviewItemIssues(
			rules,
			selfScore,
			values,
			mode,
		)) {
			ctx.addIssue({
				code: "custom",
				path: [issue.field],
				message: issue.message,
			});
		}
	});

// ── 3 ─ Whole-audit validation (jump-to-item summary) ─────────────────

export interface AuditItemIssue {
	itemId: string;
	sequence: number;
	title: string;
	messages: string[];
}

export interface AuditValidationResult {
	valid: boolean;
	/** Every item that blocks submission. */
	issues: AuditItemIssue[];
	incompleteCount: number;
}

const serverSnapshot = (item: AuditChecklistItem): SelfItemSnapshot => ({
	score: item.self.score,
	remarks: item.self.remarks,
	// Server-confirmed data: every stored photo is UPLOADED and geotagged.
	evidence: item.self.evidence.map(() => ({
		status: "UPLOADED" as const,
		hasLocation: true,
	})),
});

/**
 * Validates against SERVER-CONFIRMED data (item.self), never unsaved drafts.
 * `clarificationOnly`: only the items with an OPEN clarification must be
 * (re)answered — the caller decides this from its own status model.
 */
export function validateItemsForSelfSubmission(
	items: readonly AuditChecklistItem[],
	clarificationOnly: boolean,
): AuditValidationResult {
	const issues: AuditItemIssue[] = [];

	for (const item of items) {
		if (clarificationOnly) {
			if (item.clarification?.status !== "OPEN") continue;
			issues.push({
				itemId: item.id,
				sequence: item.sequence,
				title: item.title,
				messages: [msg.clarificationNotAnswered],
			});
			continue;
		}

		const fieldIssues = collectSelfItemIssues(
			item,
			serverSnapshot(item),
			"complete",
		);
		if (fieldIssues.length > 0 || !item.self.isComplete) {
			issues.push({
				itemId: item.id,
				sequence: item.sequence,
				title: item.title,
				messages:
					fieldIssues.length > 0
						? fieldIssues.map((issue) => issue.message)
						: [msg.itemIncomplete],
			});
		}
	}

	return { valid: issues.length === 0, issues, incompleteCount: issues.length };
}

/** Reviewer may submit once every item carries a decision and a score. */
export function validateItemsForReviewSubmission(
	items: readonly AuditChecklistItem[],
): AuditValidationResult {
	const issues: AuditItemIssue[] = [];

	for (const item of items) {
		const review = item.review;
		const missing =
			!review ||
			review.decision === "PENDING" ||
			(item.isScored && review.score === null);
		if (!missing) continue;
		issues.push({
			itemId: item.id,
			sequence: item.sequence,
			title: item.title,
			messages: [msg.itemNotReviewed],
		});
	}

	return { valid: issues.length === 0, issues, incompleteCount: issues.length };
}

// ── Clarification response ────────────────────────────────────────────

export const clarificationResponseSchema = z.object({
	response: z
		.string()
		.trim()
		.min(1, msg.clarificationResponseRequired)
		.max(
			text.clarificationMaxLength,
			format(msg.reasonTooLong, { max: text.clarificationMaxLength }),
		),
});

export type ClarificationResponseFormValues = z.infer<
	typeof clarificationResponseSchema
>;
