import type {
	CommentItem,
	CommentUser,
	MentionableUserInput,
} from "../../../components/ui/comments";

export type VendorCommentApprovalUser = MentionableUserInput;

export type VendorCommentApproval = {
	id: string;
	approverId?: string | null;
	status?: string | null;
	approver?: VendorCommentApprovalUser | null;
};

export type VendorCommentWorkflowStage = {
	id?: string;
	stageName?: string | null;
	status?: string | null;
	isCurrentIteration?: boolean | null;
	approvals?: readonly VendorCommentApproval[] | null;
};

type VendorAuditMetadata = {
	reason?: string | null;
	status?: string | null;
	remarks?: string | null;
	comment?: string | null;
	previousStatus?: string | null;
	currentStatus?: string | null;
	[key: string]: unknown;
};

const normalizeStatus = (value?: string | null): string =>
	String(value ?? "")
		.trim()
		.toUpperCase();

const formatLabel = (value?: string | null): string => {
	const normalized = String(value ?? "").trim();

	if (!normalized) return "";

	return normalized
		.toLowerCase()
		.split("_")
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

// const getUserDisplayName = (
// 	user?: VendorCommentApprovalUser | null,
// 	fallback = "User",
// ): string => {
// 	if (!user) return fallback;

// 	const fullName = [user.first_name, user.last_name]
// 		.filter(Boolean)
// 		.join(" ")
// 		.trim();

// 	return fullName || user.email || fallback;
// };

const toCommentUser = (
	user?: VendorCommentApprovalUser | null,
	fallbackName = "User",
): CommentUser | null => {
	if (!user?.id) return null;

	return {
		id: user.id,
		first_name: user.first_name?.trim() || fallbackName,
		last_name: user.last_name?.trim() || "",
		email: user.email ?? undefined,
		avatarUrl: user.avatarUrl ?? undefined,
	};
};

export const getCurrentVendorWorkflowStage = (
	stages: readonly VendorCommentWorkflowStage[] = [],
): VendorCommentWorkflowStage | undefined => {
	return stages.find((stage) => {
		if (!stage.isCurrentIteration) return false;

		const status = normalizeStatus(stage.status);

		return status === "IN_PROGRESS" || status === "CLARIFY";
	});
};

export const getVendorApprovalIdForUser = (
	stages: readonly VendorCommentWorkflowStage[] = [],
	userId?: string | null,
): string | null => {
	if (!userId) return null;

	const currentStage = getCurrentVendorWorkflowStage(stages);
	if (!currentStage) return null;

	const approval = currentStage.approvals?.find(
		(item) => item.approverId === userId || item.approver?.id === userId,
	);

	return approval?.id ?? null;
};

export const getIsVendorUserInCurrentStage = (
	stages: readonly VendorCommentWorkflowStage[] = [],
	userId?: string | null,
): boolean => {
	return Boolean(getVendorApprovalIdForUser(stages, userId));
};

export const getVendorMentionableUsers = (
	stages: readonly VendorCommentWorkflowStage[] = [],
	creator?: VendorCommentApprovalUser | null,
	additionalUsers: readonly VendorCommentApprovalUser[] = [],
): CommentUser[] => {
	const seenUserIds = new Set<string>();
	const users: CommentUser[] = [];

	const addUser = (
		user?: VendorCommentApprovalUser | null,
		fallbackName = "User",
	) => {
		const normalizedUser = toCommentUser(user, fallbackName);

		if (!normalizedUser || seenUserIds.has(normalizedUser.id)) {
			return;
		}

		seenUserIds.add(normalizedUser.id);
		users.push(normalizedUser);
	};

	addUser(creator, "Creator");

	stages.forEach((stage) => {
		stage.approvals?.forEach((approval) => {
			addUser(approval.approver, "Approver");
		});
	});

	additionalUsers.forEach((user) => {
		addUser(user);
	});

	return users;
};

export const getVendorApprovedStageCcEmails = (
	stages: readonly VendorCommentWorkflowStage[] = [],
): string[] => {
	const emails = new Set<string>();

	stages.forEach((stage) => {
		if (normalizeStatus(stage.status) !== "APPROVED") {
			return;
		}

		stage.approvals?.forEach((approval) => {
			const email = approval.approver?.email?.trim();

			if (email) {
				emails.add(email);
			}
		});
	});

	return [...emails];
};

export const getCanCommentOnVendor = ({
	stages,
	userId,
	creatorId,
}: {
	stages: readonly VendorCommentWorkflowStage[];
	userId?: string | null;
	creatorId?: string | null;
}): boolean => {
	if (!userId) return false;

	const isCreator = Boolean(creatorId && creatorId === userId);

	const isCurrentApprover = getIsVendorUserInCurrentStage(stages, userId);

	return isCreator || isCurrentApprover;
};

export const getVendorCommentContext = ({
	stages,
	userId,
	creator,
	additionalUsers = [],
}: {
	stages: VendorCommentWorkflowStage[];
	userId?: string | null;
	creator?: VendorCommentApprovalUser | null;
	additionalUsers?: VendorCommentApprovalUser[];
}) => {
	const approvalId = getVendorApprovalIdForUser(stages, userId);

	const isCreator = Boolean(userId && creator?.id && userId === creator.id);

	const isCurrentApprover = Boolean(approvalId);

	return {
		approvalId,
		isCreator,
		isCurrentApprover,
		canComment: isCreator || isCurrentApprover,
		mentionableUsers: getVendorMentionableUsers(
			stages,
			creator,
			additionalUsers,
		),
		ccEmails: getVendorApprovedStageCcEmails(stages),
	};
};

const getAuditActorName = (entry: CommentItem): string => {
	const actor = entry.actor;

	const fullName = [actor?.first_name, actor?.last_name]
		.filter(Boolean)
		.join(" ")
		.trim();

	return fullName || actor?.email || "A user";
};

const getAuditReason = (entry: CommentItem): string | undefined => {
	const metadata = entry.metadata as VendorAuditMetadata | null | undefined;

	return (
		entry.reason?.trim() ||
		metadata?.reason?.trim() ||
		metadata?.remarks?.trim() ||
		metadata?.comment?.trim() ||
		undefined
	);
};

export const getVendorAuditMessage = (entry: CommentItem): string => {
	const actorName = getAuditActorName(entry);
	const action = normalizeStatus(entry.action);
	const stageName = entry.stageName?.trim();
	const reason = getAuditReason(entry);

	const stageSuffix = stageName ? ` at ${stageName}` : "";

	const reasonSuffix = reason ? ` — ${reason}` : "";

	switch (action) {
		case "VENDOR_ONBOARDING_CREATED":
		case "VENDOR_CREATED":
		case "CREATED":
			return `${actorName} created the vendor onboarding request.`;

		case "VENDOR_ONBOARDING_UPDATED":
		case "VENDOR_UPDATED":
		case "UPDATED":
			return `${actorName} updated the vendor onboarding request.`;

		case "VENDOR_SUBMITTED":
		case "SUBMITTED_BY_VENDOR":
			return `${actorName} submitted the vendor details.`;

		case "THCM_SUBMITTED":
			return `${actorName} submitted the vendor request for approval.`;

		case "APPROVED":
		case "THCM_APPROVED":
			return `${actorName} approved the vendor request${stageSuffix}.`;

		case "EXTERNAL_ACCEPTED":
		case "ACCEPTED":
			return `${actorName} accepted the vendor request${stageSuffix}.`;

		case "CLARIFY":
		case "CLARIFICATION_REQUESTED":
		case "THCM_CLARIFICATION_REQUESTED":
			return `${actorName} requested clarification${stageSuffix}${reasonSuffix}.`;

		case "RESUBMITTED":
		case "VENDOR_RESUBMITTED":
			return `${actorName} resubmitted the vendor details.`;

		case "REJECTED":
			return `${actorName} rejected the vendor request${stageSuffix}${reasonSuffix}.`;

		case "CLOSED":
			return `${actorName} closed the vendor onboarding request.`;

		case "WORKFLOW_ASSIGNED":
			return `${actorName} assigned an approval workflow.`;

		case "WORKFLOW_STARTED":
			return `${actorName} started the approval workflow.`;

		default: {
			const actionLabel = formatLabel(entry.action);

			if (actionLabel) {
				return `${actorName} performed “${actionLabel}”${stageSuffix}${reasonSuffix}.`;
			}

			return `${actorName} updated the vendor onboarding request.`;
		}
	}
};
