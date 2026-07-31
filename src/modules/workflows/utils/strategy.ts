import type { ApprovalRule } from "../types/shared.types";

export function deriveStrategy(
	minApprovals: number,
	total: number,
): ApprovalRule {
	if (total <= 1) return "ANY";
	if (minApprovals >= total) return "ALL";
	return "SOME";
}

export function getStrategyLabel(
	strategy: ApprovalRule,
	total: number,
): string {
	if (total <= 1) return "Sequential";
	return strategy === "ALL" ? "ALL" : "Parallel";
}
