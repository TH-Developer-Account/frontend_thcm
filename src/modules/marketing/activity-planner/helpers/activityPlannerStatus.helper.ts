export type WorkflowEntry = {
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	isActiveWorkflow?: boolean | null;
	workflowId?: string | null;
	createdAt?: string | null;
};

export type WorkflowIssueType = "CLARIFICATION" | "DEVIATION";

// ─── Utils ────────────────────────────────────────────────────────────────────

const normalize = (value: unknown) =>
	String(value ?? "")
		.trim()
		.toUpperCase();

const toTimestamp = (value?: string | null) => {
	const t = new Date(value ?? 0).getTime();
	return Number.isFinite(t) ? t : 0;
};

const isActivityLog = (entry: WorkflowEntry): boolean =>
	normalize(entry.entryType) === "ACTIVITY_LOG";

const sortByDate = (entries: WorkflowEntry[]): WorkflowEntry[] =>
	[...entries].sort(
		(a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
	);

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
	const current = normalize(status);
	return Array.isArray(match)
		? match.some((s) => normalize(s) === current)
		: normalize(match) === current;
};

export const isPendingStatus = (s?: string | null) => isStatus(s, "PENDING");
export const isDeviationStatus = (s?: string | null) =>
	isStatus(s, "DEVIATION_IN_PROGRESS");
export const isReportFlowStatus = (s?: string | null) =>
	isStatus(s, ["CONDUCTED", "CLARIFY_REPORT", "REPORT_SUBMITTED"]);

// ─── Config ───────────────────────────────────────────────────────────────────

const FORM_UPDATE_ACTIONS = new Set([
	"EPC_UPDATED",
	"EPF_UPDATED",
	"CRF_UPDATED",
]);

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

	const latestTriggerIndex = sorted.findLastIndex((entry) => {
		const action = normalize(entry.action);
		const match =
			isActivityLog(entry) && config.triggerActions.includes(action);
		return (
			match && (!config.onlyActiveWorkflow || entry.isActiveWorkflow === true)
		);
	});

	if (latestTriggerIndex === -1) return false;

	return !sorted
		.slice(latestTriggerIndex + 1)
		.some(
			(entry) =>
				isActivityLog(entry) &&
				config.resolveActions.includes(normalize(entry.action)),
		);
};

export const hasFormUpdateAfterIssue = (
	entries: WorkflowEntry[] = [],
	issueType: WorkflowIssueType,
): boolean => {
	const config = WORKFLOW_ISSUE_CONFIG[issueType];
	const sorted = sortByDate(entries);

	const latestTriggerIndex = sorted.findLastIndex(
		(entry: WorkflowEntry) =>
			isActivityLog(entry) &&
			config.triggerActions.includes(normalize(entry.action)),
	);

	if (latestTriggerIndex === -1) return false;

	return sorted
		.slice(latestTriggerIndex + 1)
		.some(
			(entry) =>
				isActivityLog(entry) &&
				FORM_UPDATE_ACTIONS.has(normalize(entry.action)),
		);
};

// ─── Wrappers ─────────────────────────────────────────────────────────────────

export const hasUnresolvedClarificationInComments = (
	entries: WorkflowEntry[] = [],
) => hasUnresolvedWorkflowIssue(entries, "CLARIFICATION");

export const hasUnresolvedDeviationInComments = (
	entries: WorkflowEntry[] = [],
) => hasUnresolvedWorkflowIssue(entries, "DEVIATION");
