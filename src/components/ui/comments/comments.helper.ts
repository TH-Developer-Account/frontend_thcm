import type { CommentUser, MentionableUserInput } from "./comment.types";

import type {
	ApprovalStageLike,
	WorkflowPersonLike,
} from "../workflow/approvalWorkflow.types";

import {
	getApprovalIdForUser,
	getApprovalUser,
	getIsUserInCurrentStage,
	normalizeWorkflowStatus,
} from "../workflow/approvalWorkflow.helpers";

const toCommentUser = (
	user?: WorkflowPersonLike | MentionableUserInput | null,
	fallbackName = "User",
): CommentUser | null => {
	if (!user?.id) return null;

	return {
		id: user.id,
		first_name: user.first_name?.trim() || fallbackName,
		last_name: user.last_name?.trim() || "",
		email: user.email?.trim() || undefined,
		avatarUrl: user.avatarUrl ?? undefined,
	};
};

export const getMentionableUsersFromStages = (
	stages: readonly ApprovalStageLike[] = [],
	creator?: MentionableUserInput | null,
	additionalUsers: readonly MentionableUserInput[] = [],
	creatorFallbackName = "Creator",
): CommentUser[] => {
	const seenUserIds = new Set<string>();
	const users: CommentUser[] = [];

	const addUser = (
		user?: WorkflowPersonLike | MentionableUserInput | null,
		fallbackName = "User",
	) => {
		const normalizedUser = toCommentUser(user, fallbackName);

		if (!normalizedUser || seenUserIds.has(normalizedUser.id)) {
			return;
		}

		seenUserIds.add(normalizedUser.id);
		users.push(normalizedUser);
	};

	addUser(creator, creatorFallbackName);

	stages.forEach((stage) => {
		stage.approvals?.forEach((approval) => {
			addUser(getApprovalUser(approval), "Approver");
		});
	});

	additionalUsers.forEach((user) => {
		addUser(user);
	});

	return users;
};

export const getApprovedStageCcEmails = (
	stages: readonly ApprovalStageLike[] = [],
): string[] => {
	const emails = new Set<string>();

	stages.forEach((stage) => {
		if (normalizeWorkflowStatus(stage.status) !== "APPROVED") {
			return;
		}

		stage.approvals?.forEach((approval) => {
			const email = getApprovalUser(approval)?.email?.trim();

			if (email) {
				emails.add(email);
			}
		});
	});

	return [...emails];
};

export const getCanCommentOnWorkflow = ({
	stages,
	userId,
	creatorId,
}: {
	stages: readonly ApprovalStageLike[];
	userId?: string | null;
	creatorId?: string | null;
}): boolean => {
	if (!userId) return false;

	const isCreator = Boolean(creatorId && userId === creatorId);
	const isCurrentApprover = getIsUserInCurrentStage(stages, userId);

	return isCreator || isCurrentApprover;
};

export const getWorkflowCommentContext = ({
	stages,
	userId,
	creator,
	additionalUsers = [],
	creatorFallbackName = "Creator",
}: {
	stages: readonly ApprovalStageLike[];
	userId?: string | null;
	creator?: MentionableUserInput | null;
	additionalUsers?: readonly MentionableUserInput[];
	creatorFallbackName?: string;
}) => {
	const approvalId = getApprovalIdForUser(stages, userId);

	const isCreator = Boolean(userId && creator?.id && userId === creator.id);

	const isCurrentApprover = Boolean(approvalId);

	return {
		approvalId,
		isCreator,
		isCurrentApprover,
		canComment: isCreator || isCurrentApprover,
		mentionableUsers: getMentionableUsersFromStages(
			stages,
			creator,
			additionalUsers,
			creatorFallbackName,
		),
		ccEmails: getApprovedStageCcEmails(stages),
	};
};
