export type WorkflowEntry = {
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	message?: string | null;
	isActiveWorkflow?: boolean | null;
	workflowId?: string | null;
	createdAt?: string | null;
};

const normalize = (value: unknown) => String(value ?? "").toUpperCase();

export const hasClarificationInComments = (entries: WorkflowEntry[] = []) => {
	return entries.some((entry) => {
		return (
			(entry.isActiveWorkflow !== false &&
				normalize(entry.entryType) === "ACTIVITY_LOG" &&
				normalize(entry.action) === "CLARIFY") ||
			normalize(entry.action) === "CLARIFIED"
		);
	});
};

export const isPendingStatus = (status?: string | null) => {
	return normalize(status) === "PENDING";
};
