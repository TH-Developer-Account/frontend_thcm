import * as React from "react";

import SectionAccordion from "../../../components/common/SectionAccordion";
import { AuditLogSection } from "../../../components/ui/audit";
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
			<SectionAccordion title="Comment Section">
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
			</SectionAccordion>

			<SectionAccordion title="Activity Log">
				<AuditLogSection
					subjectType="VENDOR_ONBOARDING"
					subjectId={onboardingId}
					entityName="vendor onboarding request"
					refreshKey={refreshKey}
					emptyTitle="No vendor activity yet"
					emptyDescription="Vendor onboarding activity will appear here."
				/>
			</SectionAccordion>
		</>
	);
};

export default VendorCommentSection;
