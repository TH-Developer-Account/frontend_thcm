import type { CommentUser, MentionableUserInput } from "./comment.types";

import {
	getWorkflowApproverData,
	isSameWorkflowUser,
	normalizeWorkflowStatus,
	type ActiveWorkflowLike,
	type WorkflowUserIdentity,
} from "../../../modules/workflows";

type WorkflowMentionUser = WorkflowUserIdentity & {
	_id?: string;
	userId?: string;

	avatarUrl?: string | null;
	avatar_url?: string | null;

	user?: WorkflowMentionUser | null;
	approver?: WorkflowMentionUser | null;
	createdBy?: WorkflowMentionUser | null;
};

type WorkflowCommentContextParams = {
	activeWorkflow?: ActiveWorkflowLike | null;
	currentUser?: WorkflowUserIdentity | null;
	creator?: MentionableUserInput | null;

	/**
	 * Optional externally provided values are merged with
	 * the values derived from the workflow.
	 */
	mentionableUsers?: readonly CommentUser[];
	ccEmails?: readonly string[];

	/**
	 * Optional overrides.
	 */
	approvalId?: string | null;
	canComment?: boolean;
};

const resolveMentionUser = (
	input?: WorkflowMentionUser | MentionableUserInput | null,
): WorkflowMentionUser | null => {
	if (!input) {
		return null;
	}

	const user = input as WorkflowMentionUser;

	return user.user ?? user.approver ?? user.createdBy ?? user;
};

const getUserId = (user: WorkflowMentionUser): string =>
	user.id?.trim() || user.userId?.trim() || user._id?.trim() || "";

const toCommentUser = (
	input?: WorkflowMentionUser | MentionableUserInput | null,
	fallbackName = "User",
): CommentUser | null => {
	const user = resolveMentionUser(input);

	if (!user) {
		return null;
	}

	const id = getUserId(user);

	if (!id) {
		return null;
	}

	return {
		id,

		first_name:
			user.first_name?.trim() ||
			user.firstName?.trim() ||
			user.name?.trim() ||
			fallbackName,

		last_name: user.last_name?.trim() || user.lastName?.trim() || "",

		email: user.email?.trim() || undefined,

		avatarUrl: user.avatarUrl ?? user.avatar_url ?? undefined,
	};
};

const getMentionUserKey = (user: CommentUser): string =>
	user.id?.trim() || user.email?.trim().toLowerCase() || "";

const addMentionableUser = (
	users: Map<string, CommentUser>,
	input?: WorkflowMentionUser | MentionableUserInput | null,
	fallbackName = "User",
) => {
	const commentUser = toCommentUser(input, fallbackName);

	if (!commentUser) {
		return;
	}

	const key = getMentionUserKey(commentUser);

	if (!key) {
		return;
	}

	const existingUser = users.get(key);

	users.set(key, {
		...existingUser,
		...commentUser,

		/*
		 * Preserve existing valid information when the newly added
		 * version of the user contains empty fields.
		 */
		first_name:
			commentUser.first_name?.trim() ||
			existingUser?.first_name ||
			fallbackName,

		last_name: commentUser.last_name?.trim() || existingUser?.last_name || "",

		email: commentUser.email?.trim() || existingUser?.email,

		avatarUrl: commentUser.avatarUrl ?? existingUser?.avatarUrl,
	});
};

const addCcEmail = (emails: Set<string>, email?: string | null) => {
	const normalizedEmail = email?.trim().toLowerCase();

	if (normalizedEmail) {
		emails.add(normalizedEmail);
	}
};

/**
 * Returns every workflow approver and the proposer.
 *
 * The returned list is not based on the currently logged-in user.
 * Therefore, every permitted commenter receives the same mention list.
 */
export const getMentionableUsersFromWorkflow = (
	activeWorkflow?: ActiveWorkflowLike | null,
	creator?: MentionableUserInput | null,
	additionalUsers?: readonly CommentUser[],
): CommentUser[] => {
	const workflowData = getWorkflowApproverData(activeWorkflow);

	const users = new Map<string, CommentUser>();

	workflowData.mentionableUsers.forEach((user) => {
		addMentionableUser(users, user as WorkflowMentionUser, "Approver");
	});

	addMentionableUser(users, creator, "Proposer");

	additionalUsers?.forEach((user) => {
		addMentionableUser(users, user as WorkflowMentionUser, "User");
	});

	return [...users.values()];
};

/**
 * Returns unique CC email addresses from approved stages.
 */
export const getApprovedStageCcEmails = (
	activeWorkflow?: ActiveWorkflowLike | null,
	additionalEmails?: readonly string[],
): string[] => {
	const workflowData = getWorkflowApproverData(activeWorkflow);

	const emails = new Set<string>();

	workflowData.pastApprovals.forEach(({ stage, user }) => {
		if (normalizeWorkflowStatus(stage.status) !== "APPROVED") {
			return;
		}

		addCcEmail(emails, user?.email);
	});

	additionalEmails?.forEach((email) => {
		addCcEmail(emails, email);
	});

	return [...emails];
};

export const getCanCommentOnWorkflow = ({
	activeWorkflow,
	currentUser,
	creator,
}: Pick<
	WorkflowCommentContextParams,
	"activeWorkflow" | "currentUser" | "creator"
>): boolean => {
	if (!currentUser?.id && !currentUser?.email) {
		return false;
	}

	const workflowData = getWorkflowApproverData(activeWorkflow, currentUser);

	const isCreator = isSameWorkflowUser(creator, currentUser);

	return isCreator || workflowData.isCurrentStageApprover;
};

/**
 * Single source of truth for all workflow-comment data.
 *
 * Components should use the returned values directly.
 */
export const getWorkflowCommentContext = ({
	activeWorkflow,
	currentUser,
	creator,
	mentionableUsers,
	ccEmails,
	approvalId,
	canComment,
}: WorkflowCommentContextParams) => {
	const workflowData = getWorkflowApproverData(activeWorkflow, currentUser);

	const isCreator = isSameWorkflowUser(creator, currentUser);

	const derivedCanComment =
		Boolean(currentUser?.id || currentUser?.email) ||
		isCreator ||
		workflowData.isCurrentStageApprover;

	return {
		approvalId:
			approvalId !== undefined
				? approvalId
				: (workflowData.currentUserApproval?.id ?? null),

		isCreator,

		isCurrentApprover: workflowData.isCurrentStageApprover,

		canComment: canComment !== undefined ? canComment : derivedCanComment,

		mentionableUsers: getMentionableUsersFromWorkflow(
			activeWorkflow,
			creator,
			mentionableUsers,
		),

		ccEmails: getApprovedStageCcEmails(activeWorkflow, ccEmails),

		workflowData,
	};
};
