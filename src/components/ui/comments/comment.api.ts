import { ServerAxios } from "../../../services/ServerAxios";

import type {
	CommentApiAdapter,
	CommentCreatePayload,
	CommentItem,
	CommentSubjectType,
	CommentUser,
} from "./comment.types";

/* -------------------------------------------------------------------------- */
/* Query keys                                                                 */
/* -------------------------------------------------------------------------- */

export const commentKeys = {
	all: ["comments"] as const,
	list: (subjectType?: string | null, subjectId?: string | null) =>
		[...commentKeys.all, "list", subjectType ?? "", subjectId ?? ""] as const,
};

/* -------------------------------------------------------------------------- */
/* Response shapes                                                            */
/* -------------------------------------------------------------------------- */

type ApiEnvelope<T> = {
	success?: boolean;
	data: T;
	message?: string;
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
	actorName?: string;
	actor?: ApiCommentUser | null;
	user?: ApiCommentUser | null;
	replies?: ApiCommentItem[] | null;
};

/* -------------------------------------------------------------------------- */
/* Normalizers                                                                */
/* -------------------------------------------------------------------------- */

const COMMENT_BASE_URL = "/comment";
const DEFAULT_SUCCESS_MESSAGE = "Comment added successfully";

const encodePathSegment = (value: string) => encodeURIComponent(value.trim());

const normalizeUser = (
	user?: ApiCommentUser | null,
	fallbackName?: string,
): CommentUser => ({
	id: user?.id ?? "unknown",
	first_name: user?.first_name?.trim() || fallbackName?.trim() || "",
	last_name: user?.last_name?.trim() || (fallbackName ? "" : "user"),
	email: user?.email ?? undefined,
	avatarUrl: user?.avatarUrl ?? undefined,
});

const normalizeComment = (comment: ApiCommentItem): CommentItem => ({
	id: comment.id,
	message: comment.message ?? "",
	createdAt: comment.createdAt,
	updatedAt: comment.updatedAt ?? undefined,
	actor: normalizeUser(comment.actor ?? comment.user, comment.actorName),
	replies: comment.replies?.map(normalizeComment) ?? undefined,
});

const validateSubject = (
	subjectType: CommentSubjectType,
	subjectId: string,
) => {
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

const subjectPath = (subjectType: CommentSubjectType, subjectId: string) =>
	`${COMMENT_BASE_URL}/${encodePathSegment(String(subjectType))}/${encodePathSegment(subjectId)}`;

/* -------------------------------------------------------------------------- */
/* Adapter                                                                    */
/* -------------------------------------------------------------------------- */

export const commentApi: CommentApiAdapter = {
	getComments: async ({ subjectType, subjectId }) => {
		validateSubject(subjectType, subjectId);

		const response = await ServerAxios.get<ApiEnvelope<ApiCommentItem[]>>(
			`${subjectPath(subjectType, subjectId)}/comments`,
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

		// Approvers comment against their approval; the creator uses the subject route.
		const response = approvalId
			? await ServerAxios.post<ApiEnvelope<ApiCommentItem>>(COMMENT_BASE_URL, {
					approvalId,
					...requestPayload,
				})
			: await ServerAxios.post<ApiEnvelope<ApiCommentItem>>(
					`${subjectPath(subjectType, subjectId)}/creator-comment`,
					requestPayload,
				);

		return {
			data: normalizeComment(response.data.data),
			message: response.data.message ?? DEFAULT_SUCCESS_MESSAGE,
		};
	},
};

export type {
	CreateCommentRequest,
	CreateCommentResponse,
} from "./comment.types";
