import React from "react";

import type { CommentUser } from "./comment.types";
import RichTextareaInput from "./RichTextareaInput";

type CommentInputProps = {
	placeholder?: string;
	submitText?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	initialValue?: string;
	maxLength?: number;
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
	maxLength = 1000,
	onSubmit,
	mentionableUsers = [],
	onMentionInsert,
}: CommentInputProps) {
	const [value, setValue] = React.useState(initialValue);
	const [submitting, setSubmitting] = React.useState(false);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const hasRealContent = value.trim().length > 0;

	React.useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	const handleSubmit = React.useCallback(async () => {
		if (submitting || disabled || !hasRealContent) return;

		try {
			setSubmitting(true);
			await onSubmit(value.trim());
			setValue("");
		} finally {
			setSubmitting(false);
		}
	}, [disabled, hasRealContent, onSubmit, submitting, value]);

	return (
		<RichTextareaInput
			ref={textareaRef}
			name="comment"
			autoFocus={autoFocus}
			value={value}
			disabled={disabled || submitting}
			placeholder={placeholder}
			maxLength={maxLength}
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
		/>
	);
});

export default CommentInput;
