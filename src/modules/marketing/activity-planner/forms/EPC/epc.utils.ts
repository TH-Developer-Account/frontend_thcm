// utils/epcSubmission.ts

type SubmissionLike = {
	activeWorkflow?: unknown;
	workflow_id?: string | null;
};

export const isEpcSubmitted = (epc?: SubmissionLike | null): boolean =>
	Boolean(epc?.activeWorkflow || epc?.workflow_id);

/**
 * Can this user open the EPC view?
 *   • submitted EPC → yes (approvers, validators, proposer …)
 *   • not submitted → only its creator (view shows a "Not submitted" banner)
 */
export const canOpenEpcView = (
	epc: {
		created_by_id?: string | null;
		activeWorkflow?: unknown;
		workflow_id?: string | null;
	},
	currentUserId?: string | null,
): boolean =>
	isEpcSubmitted(epc) ||
	(Boolean(currentUserId) && epc.created_by_id === currentUserId);
