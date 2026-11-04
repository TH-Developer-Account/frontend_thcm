// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { AUDIT_EXECUTION_RULES } from "../audit-execution.config";
import {
	getReviewerMinScore,
	isReviewerScoreDropBlocked,
} from "../audit-execution.utils";

describe("reviewer may score at most 1 mark below the dealer", () => {
	const maxDrop = AUDIT_EXECUTION_RULES.review.maxScoreDrop;

	it("is configured as exactly one mark", () => {
		expect(maxDrop).toBe(1);
	});

	it("computes the lowest score the reviewer may give", () => {
		expect(getReviewerMinScore(5)).toBe(4);
		expect(getReviewerMinScore(0)).toBe(-1);
		expect(getReviewerMinScore(null)).toBeNull();
	});

	it("allows the same score, a higher score and a drop of one", () => {
		expect(isReviewerScoreDropBlocked(5, 5)).toBe(false);
		expect(isReviewerScoreDropBlocked(5, 4)).toBe(false);
		expect(isReviewerScoreDropBlocked(3, 5)).toBe(false);
	});

	it("blocks a drop of two or more marks", () => {
		expect(isReviewerScoreDropBlocked(5, 3)).toBe(true);
		expect(isReviewerScoreDropBlocked(5, 0)).toBe(true);
	});

	it("does not block when either score is missing", () => {
		expect(isReviewerScoreDropBlocked(null, 2)).toBe(false);
		expect(isReviewerScoreDropBlocked(5, null)).toBe(false);
	});
});
