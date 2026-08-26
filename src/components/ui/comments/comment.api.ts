import { ServerAxios } from "../../../services/ServerAxios";

import type {
	CommentApiAdapter,
	CommentCreatePayload,
	CommentCreateResult,
	CommentItem,
	CommentSubjectType,
	CommentUser,
} from "./comment.types";

type ApiEnvelope<T> = {
	success?: boolean;
	data: T;
	message?: string;
	subjectType?: string;
	subjectId?: string;
	totalEntries?: number;
};

type ApiCommentUser = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
};

type ApiCommentItem = {
	id: string;
	message?: string | null;
	createdAt: string;
	updatedAt?: string | null;

	entryType?: CommentItem["entryType"];
	reason?: string | null;
	action?: string | null;
	stageName?: string | null;
	metadata?: CommentItem["metadata"];
	actorName?: string;
	actor?: ApiCommentUser | null;
	user?: ApiCommentUser | null;
	replies?: ApiCommentItem[] | null;
};

const COMMENT_BASE_URL = "/comment";

const encodePathSegment = (value: string): string =>
	encodeURIComponent(value.trim());

const normalizeUser = (user?: ApiCommentUser | null): CommentUser => ({
	id: user?.id ?? "unknown",
	first_name: user?.first_name?.trim() || "Unknown",
	last_name: user?.last_name?.trim() || "user",
	email: user?.email ?? undefined,
	avatarUrl: user?.avatarUrl ?? undefined,
});

const normalizeComment = (comment: ApiCommentItem): CommentItem => ({
	id: comment.id,
	message: comment.message ?? "",
	createdAt: comment.createdAt,
	updatedAt: comment.updatedAt ?? undefined,
	entryType: comment.entryType,
	reason: comment.reason ?? undefined,
	action: comment.action ?? undefined,
	stageName: comment.stageName ?? undefined,
	metadata: comment.metadata,
	actor: normalizeUser(comment.actor ?? comment.user) || comment.actorName,
	replies: comment.replies?.map(normalizeComment) ?? undefined,
});

const validateSubject = (
	subjectType: CommentSubjectType,
	subjectId: string,
): void => {
	if (!String(subjectType).trim()) {
		throw new Error("Comment subject type is required");
	}

	if (!subjectId.trim()) {
		throw new Error("Comment subject ID is required");
	}
};

const normalizePayload = (
	payload: CommentCreatePayload,
): CommentCreatePayload => ({
	...payload,
	message: payload.message.trim(),
	to: payload.to?.filter(Boolean),
	cc: payload.cc?.filter(Boolean),
});

export const commentApi: CommentApiAdapter = {
	getActivity: async ({ subjectType, subjectId }) => {
		validateSubject(subjectType, subjectId);

		const type = encodePathSegment(String(subjectType));
		const id = encodePathSegment(subjectId);

		const response = await ServerAxios.get<ApiEnvelope<ApiCommentItem[]>>(
			`${COMMENT_BASE_URL}/${type}/${id}/activity`,
		);

		const entries = Array.isArray(response.data.data) ? response.data.data : [];

		return entries.map(normalizeComment);
	},

	createComment: async ({ subjectType, subjectId, approvalId, payload }) => {
		validateSubject(subjectType, subjectId);

		const requestPayload = normalizePayload(payload);

		if (requestPayload.message.length < 3) {
			throw new Error("Comment must be at least 3 characters");
		}

		if (approvalId) {
			const response = await ServerAxios.post<ApiEnvelope<ApiCommentItem>>(
				COMMENT_BASE_URL,
				{
					approvalId,
					...requestPayload,
				},
			);

			return {
				data: normalizeComment(response.data.data),
				message: response.data.message ?? "Comment added successfully",
			};
		}

		const type = encodePathSegment(String(subjectType));
		const id = encodePathSegment(subjectId);

		const response = await ServerAxios.post<ApiEnvelope<ApiCommentItem>>(
			`${COMMENT_BASE_URL}/${type}/${id}/creator-comment`,
			requestPayload,
		);

		return {
			data: normalizeComment(response.data.data),
			message: response.data.message ?? "Comment added successfully",
		};
	},
};

export type CreateCommentRequest = {
	subjectType: CommentSubjectType;
	subjectId: string;
	approvalId?: string | null;
	payload: CommentCreatePayload;
};

export type CreateCommentResponse = CommentCreateResult;
