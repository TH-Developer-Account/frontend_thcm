import React from "react";

import { CommentsSection } from "../../../components/ui/comments";
import type { MentionableUserInput } from "../../../components/ui/comments/comment.types";
import { getWorkflowCommentContext } from "../../../components/ui/comments/comments.helper";
import { useAuth } from "../../../context/Auth/useAuth";
import type { ApprovalStageLike } from "../../marketing/activity-planner/utils/approvalTable.mapper";

import { getVendorAuditMessage } from "../helpers/vendorComment.helper";

type VendorCommentSectionProps = {
	onboardingId?: string | null;
	workflow?: readonly ApprovalStageLike[];
	createdBy?: MentionableUserInput | null;
	title?: string;
};

const VendorCommentSection = ({
	onboardingId,
	workflow = [],
	createdBy,
	title = "Comments and activity",
}: VendorCommentSectionProps) => {
	const { user } = useAuth();
	const requestCreator = createdBy ?? null;

	const commentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow: {
					stages: workflow,
				},
				currentUser: user,
				creator: requestCreator,
			}),
		[workflow, user, requestCreator],
	);

	if (!onboardingId) {
		return null;
	}
	return (
		<CommentsSection
			subjectType="VENDOR_ONBOARDING"
			subjectId={onboardingId}
			approvalId={commentContext.approvalId}
			canComment={commentContext.canComment}
			mentionableUsers={commentContext.mentionableUsers}
			ccEmails={commentContext.ccEmails}
			currentUserId={user?.id}
			formatAuditMessage={getVendorAuditMessage}
			title={title}
			emptyTitle="No vendor activity yet"
			emptyDescription="Comments and workflow activity will appear here."
		/>
	);
};

export default VendorCommentSection;
