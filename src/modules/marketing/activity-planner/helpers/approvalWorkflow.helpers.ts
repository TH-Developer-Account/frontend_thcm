import type { WorkflowStage } from "../types/workflow.types";

export const getCurrentApprovalStage = (stages: WorkflowStage[]) => {
	return stages.find((stage) => {
		const status = stage.status?.toUpperCase();

		return (
			stage.isCurrentIteration &&
			(status === "IN_PROGRESS" || status === "CLARIFY")
		);
	});
};

export const getApprovalIdForUser = (
	stages: WorkflowStage[],
	userId?: string,
) => {
	const currentStage = getCurrentApprovalStage(stages);
	if (!currentStage || !userId) return null;

	const approval = currentStage.approvals.find(
		(item) => item.approverId === userId || item.approver?.id === userId,
	);

	return approval?.id ?? null;
};

export const getIsUserInCurrentStage = (
	stages: WorkflowStage[],
	userId?: string,
) => {
	const currentStage = getCurrentApprovalStage(stages);
	if (!currentStage || !userId) return false;

	return currentStage.approvals.some(
		(item) => item.approverId === userId || item.approver?.id === userId,
	);
};

export const getMentionableUsersFromStages = (stages: WorkflowStage[]) => {
	const seen = new Set<string>();

	return stages.flatMap((stage) =>
		stage.approvals.flatMap((approval) => {
			const user = approval.approver;
			if (!user || seen.has(user.id)) return [];

			seen.add(user.id);
			return [user];
		}),
	);
};

export const getApprovedStageCcEmails = (stages: WorkflowStage[]) => {
	return stages
		.filter((stage) => stage.status === "APPROVED")
		.flatMap((stage) => stage.approvals.map((approval) => approval.approver?.email))
		.filter((email): email is string => Boolean(email));
};
