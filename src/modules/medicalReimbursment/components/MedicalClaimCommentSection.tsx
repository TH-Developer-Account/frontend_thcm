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

type MedicalClaimCommentSectionProps = {
	claimId?: string | null;
	workflow?: readonly ApprovalStageLike[];
	createdBy?: MentionableUserInput | null;
	refreshKey?: string | number;
	canComment?: boolean;
};

const MedicalClaimCommentSection = ({
	claimId,
	workflow = [],
	createdBy,
	refreshKey = 0,
	canComment: canCommentOverride,
}: MedicalClaimCommentSectionProps) => {
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

	if (!claimId) return null;

	return (
		<>
			<SectionAccordion title="Comment Section">
				<CommentsSection
					subjectType="MEDICAL_CLAIM"
					subjectId={claimId}
					approvalId={commentContext.approvalId}
					canComment={commentContext.canComment}
					mentionableUsers={commentContext.mentionableUsers}
					ccEmails={commentContext.ccEmails}
					currentUserId={user?.id}
					refreshKey={refreshKey}
					emptyTitle="No comments yet"
					emptyDescription="Comments about this medical claim will appear here."
				/>
			</SectionAccordion>

			<SectionAccordion title="Activity Log">
				<AuditLogSection
					subjectType="MEDICAL_CLAIM"
					subjectId={claimId}
					entityName="medical claim"
					refreshKey={refreshKey}
					emptyTitle="No medical claim activity yet"
					emptyDescription="Medical claim activity will appear here."
				/>
			</SectionAccordion>
		</>
	);
};

export default MedicalClaimCommentSection;
