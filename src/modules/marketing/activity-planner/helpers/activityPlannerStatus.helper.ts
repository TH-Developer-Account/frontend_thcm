export type WorkflowEntry = {
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	isActiveWorkflow?: boolean | null;
	workflowId?: string | null;
	createdAt?: string | null;
};

export const getUserId = (authUser: any) => {
	return (
		authUser?.id ??
		authUser?.userId ??
		authUser?.user_id ??
		authUser?.user?.id ??
		authUser?.user?.userId ??
		authUser?.data?.id ??
		authUser?.profile?.id ??
		null
	);
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

const DEVIATION_CLARIFY_ACTIONS = [
	"CLARIFY",
	"CLARIFIED",
	"DEVIATION_CLARIFY",
	"CLARIFY_DEVIATION",
];

const DEVIATION_RESUBMIT_ACTIONS = [
	"DEVIATION_RESUBMITTED",
	"DEVIATION_UPDATED_RESUBMITTED",
	"CLARIFIED_RESUBMITTED",
	"RESUBMITTED",
	"SUBMITTED",
];

export const hasUnresolvedDeviationInComments = (
	entries: WorkflowEntry[] = [],
) => {
	const sortedEntries = [...entries].sort(
		(a, b) =>
			new Date(a.createdAt ?? 0).getTime() -
			new Date(b.createdAt ?? 0).getTime(),
	);

	const latestDeviationClarifyIndex = sortedEntries.findLastIndex((entry) => {
		const action = normalize(entry.action);

		return (
			entry.entryType === "ACTIVITY_LOG" &&
			DEVIATION_CLARIFY_ACTIONS.includes(action) &&
			entry.isActiveWorkflow === true
		);
	});

	if (latestDeviationClarifyIndex === -1) return false;

	const hasDeviationResubmissionAfterClarify = sortedEntries
		.slice(latestDeviationClarifyIndex + 1)
		.some((entry) => {
			const action = normalize(entry.action);

			return (
				entry.entryType === "ACTIVITY_LOG" &&
				DEVIATION_RESUBMIT_ACTIONS.includes(action)
			);
		});

	return !hasDeviationResubmissionAfterClarify;
};

export const isDeviationStatus = (status?: string | null) => {
	return normalize(status) === "DEVIATION";
};
