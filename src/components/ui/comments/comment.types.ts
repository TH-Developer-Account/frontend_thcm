import type React from "react";

export type CommentSubjectType = string;

export type MentionableUserInput = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
};
export interface User {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	role?: "ADMIN" | "DEALER" | "EMPLOYEE" | undefined;
	profile_image?: string;
}
export type CommentUser = {
	id: string;
	first_name: string;
	last_name: string;
	avatarUrl?: string;
	email?: string;
};

export type CommentItem = {
	id: string;
	message: string;
	actor: CommentUser;
	createdAt: string;
	updatedAt?: string;
	replies?: CommentItem[];
	entryType?: string;
	reason?: string;
	action?: string;
	stageName?: string;
	metadata?: Record<string, unknown> | null;
};

export type CommentMenuAction = {
	icon: React.ElementType;
	label: string;
	action: string;
};

export type CommentCreatePayload = {
	message: string;
	to?: string[];
	cc?: string[];
};

export type CommentCreateResult = {
	data: CommentItem;
	message: string;
};

export type CommentApiAdapter = {
	getActivity: (params: {
		subjectType: CommentSubjectType;
		subjectId: string;
	}) => Promise<CommentItem[]>;
	createComment: (params: {
		subjectType: CommentSubjectType;
		subjectId: string;
		approvalId?: string | null;
		payload: CommentCreatePayload;
	}) => Promise<CommentCreateResult>;
};
