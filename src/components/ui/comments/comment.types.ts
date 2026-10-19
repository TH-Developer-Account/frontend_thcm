import type React from "react";

/* -------------------------------------------------------------------------- */
/* Domain                                                                     */
/* -------------------------------------------------------------------------- */

export type CommentSubjectType = string;

export type MentionableUserInput = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
	phone_number?: string;
};

export type CommentUser = {
	id: string;
	first_name: string;
	last_name: string;
	avatarUrl?: string;
	email?: string;
	role?: string;
};

export type CommentItem = {
	id: string;
	message: string;
	actor: CommentUser;
	createdAt: string;
	updatedAt?: string;
	replies?: CommentItem[];
};

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

export type CommentCreatePayload = {
	message: string;
	to?: string[];
	cc?: string[];
};

export type CommentCreateResult = {
	data: CommentItem;
	message: string;
};

export type CreateCommentRequest = {
	subjectType: CommentSubjectType;
	subjectId: string;
	approvalId?: string | null;
	payload: CommentCreatePayload;
};

/** Kept for backwards compatibility with existing imports. */
export type CreateCommentResponse = CommentCreateResult;

export type CommentApiAdapter = {
	getComments: (params: {
		subjectType: CommentSubjectType;
		subjectId: string;
	}) => Promise<CommentItem[]>;
	createComment: (params: CreateCommentRequest) => Promise<CommentCreateResult>;
};

/* -------------------------------------------------------------------------- */
/* Rich textarea                                                              */
/* -------------------------------------------------------------------------- */

export type PopupState = "emoji" | "mentionList" | null;

export type RichTextareaProps = {
	name: string;
	label?: string;
	placeholder?: string;
	value: string;
	error?: string;
	className?: string;
	required?: boolean;
	disabled?: boolean;
	helperText?: string;
	isTooltip?: boolean;
	maxLength?: number;
	autoFocus?: boolean;
	rows?: number;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
	mentionableUsers?: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
	submitText?: string;
	submitting?: boolean;
	hasRealContent?: boolean;
	onSubmit?: () => void;
};
