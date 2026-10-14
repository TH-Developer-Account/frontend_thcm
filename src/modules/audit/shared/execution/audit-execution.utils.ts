// modules/audit/shared/execution/audit-execution.utils.ts
//
// Pure domain helpers: flattening, progress, scoring. No React, no I/O.

import { AUDIT_EXECUTION_RULES } from "./audit-execution.config";
import type {
	AuditChecklistItem,
	AuditChecklistSection,
	FinalScoreSource,
} from "./audit-execution.types";

// ── Flatten / lookup ──────────────────────────────────────────────────

export const flattenChecklistItems = (
	sections: readonly AuditChecklistSection[],
): AuditChecklistItem[] =>
	[...sections]
		.sort((a, b) => a.sequence - b.sequence)
		.flatMap((section) =>
			[...section.items].sort((a, b) => a.sequence - b.sequence),
		);

export const findChecklistItem = (
	checklist: { sections: readonly AuditChecklistSection[] } | undefined,
	itemId: string | undefined,
): AuditChecklistItem | undefined => {
	if (!checklist || !itemId) return undefined;
	return flattenChecklistItems(checklist.sections).find(
		(item) => item.id === itemId,
	);
};

export interface ItemNeighbours {
	index: number;
	total: number;
	previous: AuditChecklistItem | null;
	next: AuditChecklistItem | null;
}

export const getItemNeighbours = (
	items: readonly AuditChecklistItem[],
	itemId: string,
): ItemNeighbours => {
	const index = items.findIndex((item) => item.id === itemId);
	return {
		index,
		total: items.length,
		previous: index > 0 ? items[index - 1] : null,
		next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
	};
};

// ── Item state ────────────────────────────────────────────────────────

/** Server-confirmed completion. Never derived from unsaved local drafts. */
export const isChecklistItemComplete = (
	item: AuditChecklistItem,
): boolean => item.self.isComplete;

export const isItemClarificationOpen = (
	item: AuditChecklistItem,
): boolean => item.clarification?.status === "OPEN";

/** Items the assessed party may still edit while a clarification is running. */
export const getEditableItemIdsDuringClarification = (
	items: readonly AuditChecklistItem[],
): Set<string> =>
	new Set(items.filter(isItemClarificationOpen).map((item) => item.id));

// ── Progress (derived, never stored) ──────────────────────────────────

export interface ChecklistProgress {
	completed: number;
	total: number;
	percent: number;
}

export const getChecklistProgress = (
	items: readonly AuditChecklistItem[],
): ChecklistProgress => {
	const total = items.length;
	const completed = items.filter(isChecklistItemComplete).length;
	return {
		completed,
		total,
		percent: total ? Math.round((completed / total) * 100) : 0,
	};
};

export const getSectionProgress = (
	section: AuditChecklistSection,
): ChecklistProgress => getChecklistProgress(section.items);

// ── Scoring ───────────────────────────────────────────────────────────

/**
 * Score used for one parameter in the FINAL result.
 *   reviewer score, when the reviewer has scored it
 *   otherwise the self-assessed score (quarter-end auto-finalisation)
 *   otherwise 0 — an unanswered parameter earns nothing.
 */
export const resolveFinalItemScore = (
	item: AuditChecklistItem,
): { score: number; source: FinalScoreSource } => {
	if (item.review?.score !== null && item.review?.score !== undefined) {
		return { score: item.review.score, source: "REVIEWER" };
	}
	if (item.self.score !== null) {
		return { score: item.self.score, source: "SELF_AUTO" };
	}
	return { score: 0, source: "PENDING" };
};

export interface ScoreTotals {
	obtained: number;
	max: number;
	percent: number;
}

const toTotals = (obtained: number, max: number): ScoreTotals => ({
	obtained,
	max,
	percent: max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0,
});

/** Only scored parameters count toward the maximum. */
export const calculateSelfTotals = (
	items: readonly AuditChecklistItem[],
): ScoreTotals => {
	const scored = items.filter((item) => item.isScored);
	return toTotals(
		scored.reduce((sum, item) => sum + (item.self.score ?? 0), 0),
		scored.reduce((sum, item) => sum + item.maxScore, 0),
	);
};

export const calculateFinalTotals = (
	items: readonly AuditChecklistItem[],
): ScoreTotals => {
	const scored = items.filter((item) => item.isScored);
	return toTotals(
		scored.reduce((sum, item) => sum + resolveFinalItemScore(item).score, 0),
		scored.reduce((sum, item) => sum + item.maxScore, 0),
	);
};

/** true when the reviewer's score differs from the self-assessed score. */
export const hasScoreChanged = (
	selfScore: number | null,
	reviewerScore: number | null,
): boolean =>
	reviewerScore !== null && selfScore !== null && reviewerScore !== selfScore;

// ── Score-range helpers ───────────────────────────────────────────────

/** A score is valid when it is in the allowed list (or in range if none). */
export const isScoreAllowed = (
	item: Pick<
		AuditChecklistItem,
		"allowedScores" | "minScore" | "maxScore"
	>,
	score: number,
): boolean => {
	if (item.allowedScores.length > 0) return item.allowedScores.includes(score);
	return Number.isFinite(score) && score >= item.minScore && score <= item.maxScore;
};

/** Evidence the item requires, honouring the per-parameter configuration. */
export const getRequiredEvidenceCount = (
	item: Pick<
		AuditChecklistItem,
		"evidenceRequired" | "minEvidenceCount"
	>,
): number => (item.evidenceRequired ? Math.max(1, item.minEvidenceCount) : 0);

export interface EvidenceLimits {
	min: number;
	max: number;
}

/**
 * Min/max photos for one parameter. They come from the parameter itself;
 * the defaults apply only when it says evidence is required but carries no
 * limits of its own.
 */
export const getEvidenceLimits = (
	item: Pick<
		AuditChecklistItem,
		"evidenceRequired" | "minEvidenceCount" | "maxEvidenceCount"
	>,
): EvidenceLimits => {
	const min = getRequiredEvidenceCount(item);
	const max = Math.max(
		item.maxEvidenceCount,
		min,
		item.evidenceRequired ? AUDIT_EXECUTION_RULES.evidence.defaultMinCount : 0,
	);
	return { min, max };
};

export interface ScoreOption {
	score: number;
	criteria: string;
}

/**
 * Options offered to the assessor, driven entirely by the parameter's own
 * configuration: its score levels, else every whole number min → max.
 */
export const getScoreOptions = (
	item: Pick<
		AuditChecklistItem,
		"allowedScores" | "scoreLevels" | "minScore" | "maxScore"
	>,
): ScoreOption[] => {
	if (item.allowedScores.length > 0) {
		return item.allowedScores.map((score) => ({
			score,
			criteria:
				item.scoreLevels.find((level) => level.score === score)?.criteria ?? "",
		}));
	}
	const options: ScoreOption[] = [];
	for (let score = item.minScore; score <= item.maxScore; score += 1) {
		options.push({ score, criteria: "" });
	}
	return options;
};

// ── Misc ──────────────────────────────────────────────────────────────

export const formatScore = (score: number | null, max?: number): string => {
	if (score === null) return "—";
	return max === undefined ? String(score) : `${score}/${max}`;
};

// ── Item work-state (list rows, navigation) ───────────────────────────

export type ItemWorkState =
	| "CLARIFICATION_OPEN"
	| "CLARIFICATION_RESPONDED"
	| "COMPLETE"
	| "PENDING";

/** Drives the status chip on a checklist row; server-confirmed data only. */
export const getItemWorkState = (
	item: AuditChecklistItem,
): ItemWorkState => {
	if (item.clarification?.status === "OPEN") return "CLARIFICATION_OPEN";
	if (item.clarification?.status === "RESPONDED") {
		return "CLARIFICATION_RESPONDED";
	}
	return item.self.isComplete ? "COMPLETE" : "PENDING";
};

/** true once the reviewer has recorded a decision for the item. */
export const isItemReviewed = (item: AuditChecklistItem): boolean =>
	item.review !== null && item.review.decision !== "PENDING";

export const getReviewProgress = (
	items: readonly AuditChecklistItem[],
): ChecklistProgress => {
	const total = items.length;
	const completed = items.filter(isItemReviewed).length;
	return {
		completed,
		total,
		percent: total ? Math.round((completed / total) * 100) : 0,
	};
};
