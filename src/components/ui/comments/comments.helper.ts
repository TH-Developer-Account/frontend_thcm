import type { CommentUser, MentionableUserInput } from "./comment.types";

import {
	getWorkflowApproverData,
	isSameWorkflowUser,
	normalizeWorkflowStatus,
	type ActiveWorkflowLike,
	type WorkflowUserIdentity,
} from "../../../modules/workflows";

type WorkflowMentionUser = WorkflowUserIdentity & {
	avatarUrl?: string | null;
};

const toCommentUser = (
	user?: WorkflowMentionUser | null,
	fallbackName = "Approver",
): CommentUser | null => {
	if (!user?.id) return null;

	return {
		id: user.id,
		first_name:
			user.first_name?.trim() ||
			user.firstName?.trim() ||
			user.name?.trim() ||
			fallbackName,
		last_name: user.last_name?.trim() || user.lastName?.trim() || "",
		email: user.email?.trim() || undefined,
		avatarUrl: user.avatarUrl ?? undefined,
	};
};

/**
 * Returns every unique workflow approver as a mentionable user.
 *
 * This includes users from:
 * - Previous workflow iterations
 * - Past stages
 * - Current stage
 * - Future stages
 */
export const getMentionableUsersFromWorkflow = (
	activeWorkflow?: ActiveWorkflowLike | null,
): CommentUser[] => {
	const { mentionableUsers } = getWorkflowApproverData(activeWorkflow);

	return mentionableUsers
		.map((user) => toCommentUser(user as WorkflowMentionUser, "Approver"))
		.filter((user): user is CommentUser => user !== null);
};

/**
 * Returns email addresses of users belonging to approved stages.
 */
export const getApprovedStageCcEmails = (
	activeWorkflow?: ActiveWorkflowLike | null,
): string[] => {
	const { pastApprovals } = getWorkflowApproverData(activeWorkflow);
	const emails = new Set<string>();

	pastApprovals.forEach(({ stage, user }) => {
		if (normalizeWorkflowStatus(stage.status) !== "APPROVED") {
			return;
		}

		const email = user?.email?.trim();

		if (email) {
			emails.add(email);
		}
	});

	return [...emails];
};

export const getCanCommentOnWorkflow = ({
	activeWorkflow,
	currentUser,
	creator,
}: {
	activeWorkflow?: ActiveWorkflowLike | null;
	currentUser?: WorkflowUserIdentity | null;
	creator?: MentionableUserInput | null;
}): boolean => {
	if (!currentUser?.id && !currentUser?.email) {
		return false;
	}

	const workflowData = getWorkflowApproverData(activeWorkflow, currentUser);

	const isCreator = isSameWorkflowUser(creator, currentUser);

	return isCreator || workflowData.isCurrentStageApprover;
};

export const getWorkflowCommentContext = ({
	activeWorkflow,
	currentUser,
	creator,
}: {
	activeWorkflow?: ActiveWorkflowLike | null;
	currentUser?: WorkflowUserIdentity | null;
	creator?: MentionableUserInput | null;
}) => {
	const workflowData = getWorkflowApproverData(activeWorkflow, currentUser);

	const isCreator = isSameWorkflowUser(creator, currentUser);

	const mentionableUsersMap = new Map<string, CommentUser>();

	const addMentionableUser = (
		user?: WorkflowMentionUser | MentionableUserInput | null,
		fallbackName = "Approver",
	) => {
		const commentUser = toCommentUser(
			user as WorkflowMentionUser,
			fallbackName,
		);

		if (!commentUser) {
			return;
		}

		mentionableUsersMap.set(commentUser.id, commentUser);
	};

	// Add every workflow approver
	workflowData.mentionableUsers.forEach((user) => {
		addMentionableUser(user as WorkflowMentionUser, "Approver");
	});

	// Add creator
	addMentionableUser(creator, "Creator");

	const ccEmails = new Set<string>();

	workflowData.pastApprovals.forEach(({ stage, user }) => {
		if (normalizeWorkflowStatus(stage.status) !== "APPROVED") {
			return;
		}

		const email = user?.email?.trim();

		if (email) {
			ccEmails.add(email);
		}
	});

	return {
		approvalId: workflowData.currentUserApproval?.id ?? null,

		isCreator,

		isCurrentApprover: workflowData.isCurrentStageApprover,

		canComment: isCreator || workflowData.isCurrentStageApprover,

		mentionableUsers: [...mentionableUsersMap.values()],

		ccEmails: [...ccEmails],

		workflowData,
	};
};
