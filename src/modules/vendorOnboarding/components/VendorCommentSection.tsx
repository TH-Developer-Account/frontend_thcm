import React from "react";

import {
	CommentsSection,
	type CommentUser,
} from "../../../components/ui/comments";
import { useAuth } from "../../../context/Auth/useAuth";
import type { ApprovalStageLike } from "../../marketing/activity-planner/utils/approvalTable.mapper";

import {
	getVendorAuditMessage,
	getVendorCommentContext,
} from "../helpers/vendorComment.helper";
import type { User } from "../../../components/ui/comments/comment.types";

type VendorCommentSectionProps = {
	onboardingId?: string | null;
	workflow?: readonly ApprovalStageLike[];

	creator?: User | null;

	approvalId?: string | null;
	canComment?: boolean;
	mentionableUsers?: CommentUser[];
	ccEmails?: string[];

	title?: string;
};

const VendorCommentSection = ({
	onboardingId,
	workflow = [],
	creator,
	approvalId,
	canComment,
	mentionableUsers,
	ccEmails,
	title = "Comments and activity",
}: VendorCommentSectionProps) => {
	const { user } = useAuth();

	const resolvedCreator = creator ?? user ?? undefined;

	const commentContext = React.useMemo(
		() =>
			getVendorCommentContext({
				stages: workflow,
				userId: user?.id,
				creator: resolvedCreator,
			}),
		[workflow, user?.id, resolvedCreator],
	);

	if (!onboardingId) {
		return null;
	}

	const resolvedApprovalId =
		approvalId !== undefined ? approvalId : commentContext.approvalId;

	const resolvedCanComment =
		canComment !== undefined ? canComment : commentContext.canComment;

	const resolvedMentionableUsers =
		mentionableUsers ?? commentContext.mentionableUsers;

	const resolvedCcEmails = ccEmails ?? commentContext.ccEmails;

	return (
		<CommentsSection
			subjectType="VENDOR_ONBOARDING"
			subjectId={onboardingId}
			approvalId={resolvedApprovalId}
			canComment={resolvedCanComment}
			mentionableUsers={resolvedMentionableUsers}
			ccEmails={resolvedCcEmails}
			currentUserId={user?.id}
			formatAuditMessage={getVendorAuditMessage}
			title={title}
			emptyTitle="No vendor activity yet"
			emptyDescription="Comments and workflow activity will appear here."
		/>
	);
};

export default VendorCommentSection;
