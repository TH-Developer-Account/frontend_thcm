export type WorkflowEntry = {
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	isActiveWorkflow?: boolean | null;
	workflowId?: string | null;
	createdAt?: string | null;
};
const CLARIFY_ACTIONS = ["CLARIFY", "CLARIFIED"];

const RESUBMIT_ACTIONS = ["CLARIFIED_RESUBMITTED", "RESUBMITTED", "SUBMITTED"];

export const hasUnresolvedClarificationInComments = (
	entries: WorkflowEntry[] = [],
) => {
	const sortedEntries = [...entries].sort(
		(a, b) =>
			new Date(a.createdAt ?? 0).getTime() -
			new Date(b.createdAt ?? 0).getTime(),
	);

	const latestClarifyIndex = sortedEntries.findLastIndex((entry) => {
		const action = entry.action?.toUpperCase?.();

		return (
			entry.entryType === "ACTIVITY_LOG" &&
			CLARIFY_ACTIONS.includes(action ?? "")
		);
	});

	if (latestClarifyIndex === -1) return false;

	const hasResubmissionAfterClarify = sortedEntries
		.slice(latestClarifyIndex + 1)
		.some((entry) => {
			const action = entry.action?.toUpperCase?.();

			return (
				entry.entryType === "ACTIVITY_LOG" &&
				RESUBMIT_ACTIONS.includes(action ?? "")
			);
		});

	return !hasResubmissionAfterClarify;
};
const normalize = (value: unknown) => String(value ?? "").toUpperCase();
export const isPendingStatus = (status?: string | null) => {
	return normalize(status) === "PENDING";
};
