import type {
	CommentUser,
	MentionableUserInput,
} from "../components/commentSection/CommentsSection";
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

const toCommentUser = (
	user?: MentionableUserInput | null,
	fallbackName = "User",
): CommentUser | null => {
	if (!user?.id) return null;

	return {
		id: user.id,
		first_name: user.first_name ?? fallbackName,
		last_name: user.last_name ?? "",
		email: user.email ?? undefined,
		avatarUrl: user.avatarUrl ?? undefined,
	};
};

export const getMentionableUsersFromStages = (
	stages: WorkflowStage[],
	proposer?: MentionableUserInput | null,
): CommentUser[] => {
	const seen = new Set<string>();
	const users: CommentUser[] = [];

	const addUser = (
		user?: MentionableUserInput | null,
		fallbackName = "User",
	) => {
		const normalizedUser = toCommentUser(user, fallbackName);

		if (!normalizedUser || seen.has(normalizedUser.id)) return;

		seen.add(normalizedUser.id);
		users.push(normalizedUser);
	};

	addUser(proposer, "Proposer");

	stages.forEach((stage) => {
		stage.approvals.forEach((approval) => {
			addUser(approval.approver, "Approver");
		});
	});

	return users;
};
export const getApprovedStageCcEmails = (stages: WorkflowStage[]) => {
	return stages
		.filter((stage) => stage.status === "APPROVED")
		.flatMap((stage) =>
			stage.approvals.map((approval) => approval.approver?.email),
		)
		.filter((email): email is string => Boolean(email));
};
