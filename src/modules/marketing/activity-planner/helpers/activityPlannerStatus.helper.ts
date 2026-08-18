import type { WorkflowActivityEntry } from "../../../workflows/types/types";
import { normalizeWorkflowStatus } from "../../../workflows/utils/status";

export type WorkflowEntry = WorkflowActivityEntry;

export type WorkflowIssueType = "CLARIFICATION" | "DEVIATION";

// ─── Utils ────────────────────────────────────────────────────────────────────

const toTimestamp = (value?: string | null) => {
	const t = new Date(value ?? 0).getTime();
	return Number.isFinite(t) ? t : 0;
};

const isActivityLog = (entry: WorkflowEntry): boolean =>
	normalizeWorkflowStatus(entry.entryType) === "ACTIVITY_LOG";

const sortByDate = (entries: WorkflowEntry[]): WorkflowEntry[] =>
	[...entries].sort(
		(a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
	);

const findLastMatchingIndex = <T>(
	items: readonly T[],
	predicate: (item: T, index: number) => boolean,
): number => {
	for (let index = items.length - 1; index >= 0; index -= 1) {
		if (predicate(items[index], index)) {
			return index;
		}
	}

	return -1;
};
// ─── Auth ─────────────────────────────────────────────────────────────────────

export const getUserId = (authUser: unknown): string | null => {
	if (!authUser || typeof authUser !== "object") return null;
	const u = authUser as any;
	return (
		u?.id ??
		u?.userId ??
		u?.user_id ??
		u?.user?.id ??
		u?.user?.userId ??
		u?.data?.id ??
		u?.profile?.id ??
		null
	);
};

// ─── Status ───────────────────────────────────────────────────────────────────

export const isStatus = (
	status: string | null | undefined,
	match: string | string[],
): boolean => {
	const current = normalizeWorkflowStatus(status);
	return Array.isArray(match)
		? match.some((value) => normalizeWorkflowStatus(value) === current)
		: normalizeWorkflowStatus(match) === current;
};

export const isPendingStatus = (s?: string | null) => isStatus(s, "PENDING");
export const isDeviationStatus = (s?: string | null) =>
	isStatus(s, "DEVIATION_IN_PROGRESS");
export const isReportFlowStatus = (s?: string | null) =>
	isStatus(s, ["CONDUCTED", "CLARIFY_REPORT", "REPORT_SUBMITTED"]);

// ─── Config ───────────────────────────────────────────────────────────────────

const WORKFLOW_ISSUE_CONFIG = {
	CLARIFICATION: {
		triggerActions: ["CLARIFY", "CLARIFIED"],
		resolveActions: ["CLARIFIED_RESUBMITTED", "RESUBMITTED", "EPC_RESUBMITTED"],
		onlyActiveWorkflow: false,
	},
	DEVIATION: {
		triggerActions: ["DEVIATION_RAISED", "DEVIATION_IN_PROGRESS"],
		resolveActions: ["EPC_RESUBMITTED"],
		onlyActiveWorkflow: false,
	},
} satisfies Record<
	WorkflowIssueType,
	{
		triggerActions: string[];
		resolveActions: string[];
		onlyActiveWorkflow: boolean;
	}
>;

// ─── Core ─────────────────────────────────────────────────────────────────────

export const hasUnresolvedWorkflowIssue = (
	entries: WorkflowEntry[] = [],
	issueType: WorkflowIssueType,
): boolean => {
	const config = WORKFLOW_ISSUE_CONFIG[issueType];
	const sorted = sortByDate(entries);

	const latestTriggerIndex = findLastMatchingIndex(
		sorted,
		(entry: WorkflowEntry) => {
			const action = normalizeWorkflowStatus(entry.action);
			const match =
				isActivityLog(entry) && config.triggerActions.includes(action);
			return (
				match && (!config.onlyActiveWorkflow || entry.isActiveWorkflow === true)
			);
		},
	);

	if (latestTriggerIndex === -1) return false;

	return !sorted
		.slice(latestTriggerIndex + 1)
		.some(
			(entry) =>
				isActivityLog(entry) &&
				config.resolveActions.includes(normalizeWorkflowStatus(entry.action)),
		);
};

export const hasFormUpdateAfterIssue = (
	entries: WorkflowEntry[] = [],
	issueType: WorkflowIssueType,
	formUpdateActions: readonly string[] | ReadonlySet<string>,
): boolean => {
	const config = WORKFLOW_ISSUE_CONFIG[issueType];
	const sorted = sortByDate(entries);
	const normalizedFormUpdateActions = new Set(
		Array.from(formUpdateActions, normalizeWorkflowStatus),
	);

	const latestTriggerIndex = findLastMatchingIndex(
		sorted,
		(entry: WorkflowEntry) =>
			isActivityLog(entry) &&
			config.triggerActions.includes(normalizeWorkflowStatus(entry.action)),
	);

	if (latestTriggerIndex === -1) return false;

	return sorted
		.slice(latestTriggerIndex + 1)
		.some(
			(entry) =>
				isActivityLog(entry) &&
				normalizedFormUpdateActions.has(normalizeWorkflowStatus(entry.action)),
		);
};

// ─── Wrappers ─────────────────────────────────────────────────────────────────

export const hasUnresolvedClarificationInComments = (
	entries: WorkflowEntry[] = [],
) => hasUnresolvedWorkflowIssue(entries, "CLARIFICATION");

export const hasUnresolvedDeviationInComments = (
	entries: WorkflowEntry[] = [],
) => hasUnresolvedWorkflowIssue(entries, "DEVIATION");
