// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
	calculateFinalTotals,
	getEvidenceLimits,
	getScoreOptions,
	hasScoreChanged,
	resolveFinalItemScore,
} from "../audit-execution.utils";
import {
	collectReviewItemIssues,
	collectSelfItemIssues,
	validateItemsForReviewSubmission,
	validateItemsForSelfSubmission,
} from "../audit-execution.validation";
import {
	isSwipeBlockedTarget,
	resolveSwipeDirection,
} from "../hooks/useSwipeNavigation";
import { makeItem, makeSelf } from "./testFactories";

describe("self-assessment validation", () => {
	const rules = makeItem({
		minScore: 0,
		maxScore: 4,
		evidenceRequired: true,
		minEvidenceCount: 2,
		maxEvidenceCount: 3,
	});
	const photo = { status: "UPLOADED" as const, hasLocation: true };

	it("requires a score only when completing", () => {
		const snapshot = { score: null, remarks: "", evidence: [photo, photo] };
		expect(collectSelfItemIssues(rules, snapshot, "draft")).toEqual([]);
		expect(
			collectSelfItemIssues(rules, snapshot, "complete").map((i) => i.field),
		).toContain("score");
	});

	it("accepts 0 as a real score (there is no N/A)", () => {
		const snapshot = { score: 0, remarks: "", evidence: [photo, photo] };
		expect(collectSelfItemIssues(rules, snapshot, "complete")).toEqual([]);
	});

	it("rejects scores outside the parameter's own min/max", () => {
		const issues = collectSelfItemIssues(
			rules,
			{ score: 5, remarks: "", evidence: [photo, photo] },
			"draft",
		);
		expect(issues.map((i) => i.field)).toEqual(["score"]);
	});

	it("rejects scores outside an explicit allowed list", () => {
		const listed = makeItem({ allowedScores: [0, 2, 4], maxScore: 4 });
		const issues = collectSelfItemIssues(
			listed,
			{ score: 3, remarks: "", evidence: [] },
			"draft",
		);
		expect(issues).toHaveLength(1);
	});

	it("counts only server-confirmed photos with a location", () => {
		const local = { status: "LOCAL" as const, hasLocation: true };
		const noLocation = { status: "UPLOADED" as const, hasLocation: false };
		const issues = collectSelfItemIssues(
			rules,
			{ score: 3, remarks: "", evidence: [photo, local, noLocation] },
			"complete",
		);
		expect(issues.some((i) => i.field === "evidence")).toBe(true);
	});

	it("rejects over-long remarks", () => {
		const issues = collectSelfItemIssues(
			rules,
			{ score: 3, remarks: "x".repeat(501), evidence: [photo, photo] },
			"draft",
		);
		expect(issues.map((i) => i.field)).toContain("remarks");
	});
});

describe("reviewer validation", () => {
	const rules = makeItem({ minScore: 0, maxScore: 5 });
	const review = (over = {}) => ({
		score: 3,
		remarks: "",
		decision: "ACCEPTED" as const,
		scoreChangeReason: "",
		...over,
	});

	it("rejects N/A — a zero score must be used instead", () => {
		const issues = collectReviewItemIssues(
			rules,
			3,
			review({ decision: "NOT_APPLICABLE" }),
			"draft",
		);
		expect(issues.map((i) => i.field)).toContain("decision");
	});

	it("requires a reason when the reviewer score differs", () => {
		const issues = collectReviewItemIssues(
			rules,
			3,
			review({ score: 1, decision: "DEFICIENT", remarks: "Missing" }),
			"complete",
		);
		expect(issues.map((i) => i.field)).toContain("scoreChangeReason");
	});

	it("does not require a reason when scores match", () => {
		const issues = collectReviewItemIssues(rules, 3, review(), "complete");
		expect(issues.map((i) => i.field)).not.toContain("scoreChangeReason");
	});
});

describe("scoring", () => {
	it("uses the reviewer score, else the dealer's initial score, else 0", () => {
		const reviewed = makeItem({
			self: makeSelf({ score: 4 }),
			review: {
				score: 2,
				remarks: "",
				decision: "DEFICIENT",
				scoreChangeReason: "x",
				reviewedAt: null,
			},
		});
		expect(resolveFinalItemScore(reviewed)).toEqual({ score: 2, source: "REVIEWER" });
		expect(resolveFinalItemScore(makeItem({ self: makeSelf({ score: 4 }) }))).toEqual({
			score: 4,
			source: "SELF_AUTO",
		});
		expect(resolveFinalItemScore(makeItem())).toEqual({
			score: 0,
			source: "PENDING",
		});
	});

	it("totals against each parameter's own maximum", () => {
		const items = [
			makeItem({ id: "a", maxScore: 5, self: makeSelf({ score: 5 }) }),
			makeItem({ id: "b", maxScore: 10, self: makeSelf({ score: 0 }) }),
		];
		expect(calculateFinalTotals(items)).toEqual({
			obtained: 5,
			max: 15,
			percent: 33.3,
		});
	});

	it("detects a changed score", () => {
		expect(hasScoreChanged(3, 2)).toBe(true);
		expect(hasScoreChanged(3, 3)).toBe(false);
		expect(hasScoreChanged(null, 3)).toBe(false);
	});

	it("builds score options from the parameter's own range", () => {
		expect(getScoreOptions(makeItem({ minScore: 0, maxScore: 2 })).map((o) => o.score)).toEqual([0, 1, 2]);
		expect(getScoreOptions(makeItem({ allowedScores: [0, 5] })).map((o) => o.score)).toEqual([0, 5]);
	});

	it("takes evidence limits from the parameter", () => {
		expect(
			getEvidenceLimits(
				makeItem({ evidenceRequired: true, minEvidenceCount: 2, maxEvidenceCount: 4 }),
			),
		).toEqual({ min: 2, max: 4 });
		expect(getEvidenceLimits(makeItem())).toEqual({ min: 0, max: 0 });
	});
});

describe("swipe navigation", () => {
	it("needs enough horizontal distance", () => {
		expect(resolveSwipeDirection(-20, 0)).toBeNull();
		expect(resolveSwipeDirection(-120, 0)).toBe("next");
		expect(resolveSwipeDirection(120, 0)).toBe("previous");
	});

	it("ignores mostly vertical movement", () => {
		expect(resolveSwipeDirection(-90, 120)).toBeNull();
	});

	it("ignores gestures that start in interactive controls", () => {
		const area = document.createElement("div");
		const textarea = document.createElement("textarea");
		area.appendChild(textarea);
		expect(isSwipeBlockedTarget(textarea)).toBe(true);
		expect(isSwipeBlockedTarget(area)).toBe(false);
		expect(isSwipeBlockedTarget(null)).toBe(false);
	});
});

describe("whole-audit validation (module-neutral)", () => {
	it("flags items that are not complete on the server", () => {
		const done = makeItem({ id: "a", self: makeSelf({ score: 3, isComplete: true }) });
		const open = makeItem({ id: "b", sequence: 2 });
		const result = validateItemsForSelfSubmission([done, open], false);
		expect(result.issues.map((issue) => issue.itemId)).toEqual(["b"]);
	});

	it("checks only flagged items when clarificationOnly is set", () => {
		const untouched = makeItem({ id: "a" });
		const flagged = makeItem({
			id: "b",
			sequence: 2,
			clarification: {
				id: "c",
				status: "OPEN",
				remarks: "Explain",
				raisedAt: "2026-01-01T00:00:00Z",
				dueAt: null,
				response: null,
				respondedAt: null,
			},
		});
		const result = validateItemsForSelfSubmission([untouched, flagged], true);
		expect(result.issues.map((issue) => issue.itemId)).toEqual(["b"]);
	});

	it("requires a decision and a score on every reviewed item", () => {
		const pending = makeItem({ id: "p" });
		expect(validateItemsForReviewSubmission([pending]).valid).toBe(false);
	});
});
