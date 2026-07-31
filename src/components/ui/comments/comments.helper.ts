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

	const mentionableUsers = workflowData.mentionableUsers
		.map((user) => toCommentUser(user as WorkflowMentionUser, "Approver"))
		.filter((user): user is CommentUser => user !== null);

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
		// Equivalent to the old getApprovalIdForUser().
		approvalId: workflowData.currentUserApproval?.id ?? null,

		isCreator,

		// Equivalent to the old getIsUserInCurrentStage().
		isCurrentApprover: workflowData.isCurrentStageApprover,

		canComment: isCreator || workflowData.isCurrentStageApprover,

		// Every unique approver from the complete workflow.
		mentionableUsers,

		ccEmails: [...ccEmails],

		// Expose the complete data for other comment permissions/UI.
		workflowData,
	};
};
