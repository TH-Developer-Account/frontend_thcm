import type { CommentUser, MentionableUserInput } from "./comment.types";
import type { CommentItem } from "../../../components/ui/comments";

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

export type AuditMessageOptions = {
	/**
	 * Entity being acted on.
	 * Example: "vendor onboarding request", "medical claim", "event report"
	 */
	entityName: string;

	/**
	 * Optional custom action messages.
	 * Useful when a module has special wording.
	 */
	actionMessages?: Record<
		string,
		string | ((context: AuditMessageContext) => string)
	>;

	/**
	 * Optional timestamp formatter.
	 */
	formatTimestamp?: (date: string) => string;

	/**
	 * Whether to include the timestamp in the returned message.
	 */
	includeTimestamp?: boolean;
};

export type AuditMessageContext = {
	entry: CommentItem;
	actorName: string;
	action: string;
	stageName?: string;
	reason?: string;
	stageSuffix: string;
	reasonSuffix: string;
	entityName: string;
};

type AuditMetadata = {
	reason?: string | null;
	status?: string | null;
	remarks?: string | null;
	comment?: string | null;
	previousStatus?: string | null;
	currentStatus?: string | null;
	[key: string]: unknown;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export const normalizeAuditAction = (value?: string | null): string => {
	return String(value ?? "")
		.trim()
		.toUpperCase();
};

export const formatAuditLabel = (value?: string | null): string => {
	const normalized = String(value ?? "").trim();

	if (!normalized) return "";

	return normalized
		.toLowerCase()
		.split("_")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export const getAuditActorName = (entry: CommentItem): string => {
	const actor = entry.actor;

	const fullName = [actor?.first_name, actor?.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	return fullName || actor?.email || "A user";
};

export const getAuditReason = (entry: CommentItem): string | undefined => {
	const metadata = entry.metadata as AuditMetadata | null | undefined;

	return (
		entry.reason?.trim() ||
		metadata?.reason?.trim() ||
		metadata?.remarks?.trim() ||
		metadata?.comment?.trim() ||
		undefined
	);
};

export const formatAuditTimestamp = (date: string): string => {
	return new Date(date).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

/* -------------------------------------------------------------------------- */
/* Default audit messages                                                     */
/* -------------------------------------------------------------------------- */

const getDefaultAuditMessage = (context: AuditMessageContext): string => {
	const { actorName, action, stageSuffix, reasonSuffix, entityName } = context;

	switch (action) {
		case "CREATED":
		case "INITIATED":
			return `${actorName} initiated the ${entityName}.`;

		case "UPDATED":
			return `${actorName} updated the ${entityName}.`;

		case "SUBMITTED":
			return `${actorName} submitted the ${entityName}.`;

		case "SENT_FOR_APPROVAL":
			return `${actorName} sent the ${entityName} for approval.`;

		case "APPROVED":
			return `${actorName} approved the ${entityName}${stageSuffix}.`;

		case "REJECTED":
			return `${actorName} rejected the ${entityName}${stageSuffix}${reasonSuffix}.`;

		case "CLARIFY":
		case "CLARIFICATION_REQUESTED":
			return `${actorName} requested clarification${stageSuffix}${reasonSuffix}.`;

		case "RESUBMITTED":
			return `${actorName} resubmitted the ${entityName}.`;

		case "ACCEPTED":
			return `${actorName} accepted the ${entityName}${stageSuffix}.`;

		case "CLOSED":
			return `${actorName} closed the ${entityName}.`;

		case "WORKFLOW_ASSIGNED":
			return `${actorName} assigned an approval workflow.`;

		case "WORKFLOW_STARTED":
			return `${actorName} started the approval workflow.`;

		default: {
			const actionLabel = formatAuditLabel(action);

			if (actionLabel) {
				return `${actorName} performed “${actionLabel}”${stageSuffix}${reasonSuffix}.`;
			}

			return `${actorName} updated the ${entityName}.`;
		}
	}
};

/* -------------------------------------------------------------------------- */
/* Main helper                                                                */
/* -------------------------------------------------------------------------- */

export const getAuditMessage = (
	entry: CommentItem,
	options: AuditMessageOptions,
): string => {
	const {
		entityName,
		actionMessages = {},
		formatTimestamp = formatAuditTimestamp,
		includeTimestamp = true,
	} = options;

	const actorName = getAuditActorName(entry);
	const action = normalizeAuditAction(entry.action);
	const stageName = entry.stageName?.trim() || undefined;
	const reason = getAuditReason(entry);

	const stageSuffix = stageName ? ` at ${stageName}` : "";

	const reasonSuffix = reason ? ` — ${reason}` : "";

	const context: AuditMessageContext = {
		entry,
		actorName,
		action,
		stageName,
		reason,
		stageSuffix,
		reasonSuffix,
		entityName,
	};

	const customMessage = actionMessages[action];

	const message =
		typeof customMessage === "function"
			? customMessage(context)
			: (customMessage ?? getDefaultAuditMessage(context));

	if (!includeTimestamp || !entry.createdAt) {
		return message;
	}

	return `${message} (${formatTimestamp(entry.createdAt)})`;
};
