import * as React from "react";

import {
	CommentsSection,
	getWorkflowCommentContext,
	type MentionableUserInput,
} from "../../../components/ui/comments";
import { useAuth } from "../../../context/Auth/useAuth";
import type { ApprovalStageLike } from "../../workflows/types/types";

type VendorCommentSectionProps = {
	onboardingId?: string | null;
	workflow?: readonly ApprovalStageLike[];
	createdBy?: MentionableUserInput | null;
	refreshKey?: string | number;
	canComment?: boolean;
};

const VendorCommentSection = ({
	onboardingId,
	workflow = [],
	createdBy,
	refreshKey = 0,
	canComment: canCommentOverride,
}: VendorCommentSectionProps) => {
	const { user } = useAuth();

	const commentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow: {
					stages: [...workflow],
				},
				currentUser: user,
				creator: createdBy ?? null,
				canComment: canCommentOverride,
			}),
		[canCommentOverride, createdBy, user, workflow],
	);

	if (!onboardingId) return null;

	return (
		<>
			<CommentsSection
				subjectType="VENDOR_ONBOARDING"
				subjectId={onboardingId}
				approvalId={commentContext.approvalId}
				canComment={commentContext.canComment}
				mentionableUsers={commentContext.mentionableUsers}
				ccEmails={commentContext.ccEmails}
				currentUserId={user?.id}
				refreshKey={refreshKey}
				emptyTitle="No comments yet"
				emptyDescription="Comments about this vendor request will appear here."
			/>
		</>
	);
};

export default VendorCommentSection;
