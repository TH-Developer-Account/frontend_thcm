import React from "react";
import { AtSign, MessageCircle } from "lucide-react";

import type { CommentUser } from "./CommentsSection";
import RichTextareaInput from "../common/RichTextareaInput";

const COMMENT_MENU_ITEMS = [
	{
		icon: AtSign,
		label: "Mention someone",
		action: "mention",
	},
	{
		icon: MessageCircle,
		label: "Send comment",
		action: "submit",
	},
];

type CommentInputProps = {
	placeholder?: string;
	submitText?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	initialValue?: string;
	onSubmit: (value: string) => Promise<void>;
	mentionableUsers?: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
};

const CommentInput = React.memo(function CommentInput({
	placeholder = "Write a comment...",
	submitText = "Send",
	disabled = false,
	autoFocus = false,
	initialValue = "",
	onSubmit,
	mentionableUsers = [],
	onMentionInsert,
}: CommentInputProps) {
	const [value, setValue] = React.useState(initialValue);
	const [submitting, setSubmitting] = React.useState(false);

	const textareaRef = React.useRef<HTMLTextAreaElement>(null);

	const hasRealContent = React.useMemo(
		() => value.replace(/@\w+(\s\w+)?/g, "").trim().length > 0,
		[value],
	);

	const handleSubmit = React.useCallback(async () => {
		if (submitting || disabled || !hasRealContent) {
			return;
		}

		try {
			setSubmitting(true);

			await onSubmit(value.trim());

			setValue("");
		} finally {
			setSubmitting(false);
		}
	}, [disabled, hasRealContent, onSubmit, submitting, value]);

	const handleMenuAction = React.useCallback(
		(action: string) => {
			if (action === "submit") {
				void handleSubmit();
			}
		},
		[handleSubmit],
	);

	return (
		<RichTextareaInput
			ref={textareaRef}
			name="comment"
			autoFocus={autoFocus}
			value={value}
			disabled={disabled || submitting}
			placeholder={placeholder}
			mentionableUsers={mentionableUsers}
			onMentionInsert={onMentionInsert}
			onChange={(event) => setValue(event.target.value)}
			onKeyDown={(event) => {
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
					event.preventDefault();
					void handleSubmit();
				}
			}}
			submitText={submitText}
			submitting={submitting}
			hasRealContent={hasRealContent}
			onSubmit={handleSubmit}
			menuItems={COMMENT_MENU_ITEMS}
			onMenuAction={handleMenuAction}
		/>
	);
});

export default CommentInput;
