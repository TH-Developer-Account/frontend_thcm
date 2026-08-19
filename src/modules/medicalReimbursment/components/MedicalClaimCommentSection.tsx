import * as React from "react";

import { CommentsSection } from "../../../components/ui/comments";
import type { MentionableUserInput } from "../../../components/ui/comments/comment.types";
import { getWorkflowCommentContext } from "../../../components/ui/comments/comments.helper";
import { useAuth } from "../../../context/Auth/useAuth";
import type { ApprovalStageLike } from "../../workflows/types/types";
import FormHeader from "../../../components/ui/FormHeader";
import { ClipboardClock } from "lucide-react";
import { getMedicalAuditMessage } from "../helpers/medicalClaimListing.mapper";

type MedicalClaimCommentSectionProps = {
	claimId?: string | null;
	workflow?: readonly ApprovalStageLike[];
	createdBy?: MentionableUserInput | null;
	title?: string;
};

/** Keeps comment permissions and mentions aligned with the active workflow. */
const MedicalClaimCommentSection = ({
	claimId,
	workflow = [],
	createdBy,
	title = "Comments and activity",
}: MedicalClaimCommentSectionProps) => {
	const { user } = useAuth();
	const commentContext = React.useMemo(
		() =>
			getWorkflowCommentContext({
				activeWorkflow: { stages: workflow },
				currentUser: user,
				creator: createdBy ?? null,
			}),
		[createdBy, user, workflow],
	);

	if (!claimId) return null;

	return (
		<div className="px-4">
			<FormHeader title="Comment Section" Icon={ClipboardClock} />
			<CommentsSection
				subjectType="MEDICAL_CLAIM"
				subjectId={claimId}
				approvalId={commentContext.approvalId}
				canComment={commentContext.canComment}
				mentionableUsers={commentContext.mentionableUsers}
				ccEmails={commentContext.ccEmails}
				currentUserId={user?.id}
				title={title}
				formatAuditMessage={getMedicalAuditMessage}
				emptyTitle="No medical claim activity yet"
				emptyDescription="Comments and workflow activity will appear here."
			/>
		</div>
	);
};

export default MedicalClaimCommentSection;
