import { workflowApi } from "../../../../api/workflow.api";
import type {
	CommentApiAdapter,
	CommentItem,
	CommentUser,
} from "../../../../components/ui/comments";

type LegacyUser = Partial<CommentUser> | null;

type LegacyComment = {
	id?: string;
	message?: string | null;
	entryType?: string | null;
	action?: string | null;
	reason?: string | null;
	stageName?: string | null;
	metadata?: Record<string, unknown> | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	actor?: LegacyUser;
	user?: LegacyUser;
	replies?: LegacyComment[] | null;
};

const mapUser = (user?: LegacyUser): CommentUser => ({
	id: user?.id ?? "unknown",
	first_name: user?.first_name?.trim() || "Unknown",
	last_name: user?.last_name?.trim() || "user",
	email: user?.email ?? undefined,
	avatarUrl: user?.avatarUrl ?? undefined,
});

const mapComment = (comment: LegacyComment): CommentItem => ({
	id:
		comment.id ??
		`comment-${comment.createdAt ?? "unknown"}-${comment.actor?.id ?? comment.user?.id ?? "unknown"}`,
	message: comment.message ?? "",
	entryType: comment.entryType ?? undefined,
	action: comment.action ?? undefined,
	reason: comment.reason ?? undefined,
	stageName: comment.stageName ?? undefined,
	metadata: comment.metadata,
	createdAt: comment.createdAt ?? new Date().toISOString(),
	updatedAt: comment.updatedAt ?? undefined,
	actor: mapUser(comment.actor ?? comment.user),
	replies: comment.replies?.map(mapComment) ?? undefined,
});

/**
 * Compatibility adapter for Activity Planner. It lets the shared comment UI be
 * adopted without changing the module's existing, working workflow endpoints.
 */
export const activityPlannerCommentApi: CommentApiAdapter = {
	getActivity: async ({ subjectId }) => {
		const comments = await workflowApi.getComments(subjectId);
		return (comments as unknown as LegacyComment[]).map(mapComment);
	},

	createComment: async ({ subjectId, approvalId, payload }) => {
		const response = approvalId
			? await workflowApi.createApprovalComment({
					approvalId,
					message: payload.message,
					to: payload.to ?? [],
					cc: payload.cc ?? [],
				})
			: await workflowApi.createCreatorComment({
					epcId: subjectId,
					message: payload.message,
					to: payload.to ?? [],
					cc: payload.cc ?? [],
				});

		return {
			message: response.message,
			data: mapComment(response.data as unknown as LegacyComment),
		};
	},
};
