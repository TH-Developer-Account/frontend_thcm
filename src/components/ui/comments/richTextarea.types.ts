import type React from "react";

import type { CommentUser } from "./comment.types";

export type FormatType = "bold" | "italic" | "code" | "bullet";
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
	onFileAttach?: (files: FileList) => void;
	submitText?: string;
	submitting?: boolean;
	hasRealContent?: boolean;
	onSubmit?: () => void;
};
