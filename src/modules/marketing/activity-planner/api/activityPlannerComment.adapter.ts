import {
	commentApi,
	type CommentApiAdapter,
} from "../../../../components/ui/comments";
import {
	auditApi,
	type AuditApiAdapter,
} from "../../../../components/ui/audit";

const EVENT_PROPOSAL_SUBJECT_TYPE = "EVENT_PROPOSAL";

/**
 * Activity Planner always comments against EVENT_PROPOSAL subjects.
 * This just pins subjectType so callers don't have to pass it.
 */
export const activityPlannerCommentApi: CommentApiAdapter = {
	getComments: ({ subjectId }) =>
		commentApi.getComments({
			subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
			subjectId,
		}),

	createComment: ({ subjectId, approvalId, payload }) =>
		commentApi.createComment({
			subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
			subjectId,
			approvalId,
			payload,
		}),
};

/**
 * Activity Planner always audits against EVENT_PROPOSAL subjects.
 * This just pins subjectType so callers don't have to pass it.
 */
export const activityPlannerAuditApi: AuditApiAdapter = {
	getAuditLog: ({ subjectId }) =>
		auditApi.getAuditLog({
			subjectType: EVENT_PROPOSAL_SUBJECT_TYPE,
			subjectId,
		}),
};
