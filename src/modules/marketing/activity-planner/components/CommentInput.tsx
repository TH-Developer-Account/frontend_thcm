import React from "react";
import { AtSign, HelpCircle, Paperclip, Send, FileText } from "lucide-react";
import type { CommentUser } from "./CommentsSection";
import RichTextareaInput from "./RichTextareaInput";

// ============================
//  Menu items
// ============================

const COMMENT_MENU_ITEMS = [
	{ icon: Send, label: "Send comment", action: "submit" },
	{ icon: AtSign, label: "Mention someone", action: "mention" },
	{ icon: Paperclip, label: "Attach file / reference", action: "attach" },
	{ icon: HelpCircle, label: "Mark as question", action: "question" },
	{ icon: FileText, label: "Save as draft", action: "draft" },
];

// ============================
//  CommentInput
// ============================

const CommentInput = React.memo(function CommentInput({
	placeholder = "Write a comment...",
	submitText = "Send",
	disabled,
	autoFocus,
	initialValue = "",
	onSubmit,
	canApprove,
	canClarify,
	onApprove,
	onClarify,
	mentionableUsers = [],
}: {
	placeholder?: string;
	submitText?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	initialValue?: string;
	onSubmit: (value: string) => Promise<void>;
	canApprove?: boolean;
	canClarify?: boolean;
	onApprove?: () => void;
	onClarify?: () => void;
	mentionableUsers?: CommentUser[];
}) {
	const [value, setValue] = React.useState(initialValue);
	const [submitting, setSubmitting] = React.useState(false);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);

	// ============================
	// HAS REAL CONTENT
	// ============================

	const hasRealContent = value.replace(/@\w+(\s\w+)?/g, "").trim().length > 0;

	// ============================
	// SUBMIT
	// ============================

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

	// ============================
	// MENU ACTION
	// ============================

	const handleMenuAction = React.useCallback(
		(action: string) => {
			if (action === "submit") void handleSubmit();
		},
		[handleSubmit],
	);

	// ============================
	// RENDER
	// ============================

	return (
		<RichTextareaInput
			ref={textareaRef}
			name="comment"
			autoFocus={autoFocus}
			value={value}
			disabled={disabled || submitting}
			placeholder={placeholder}
			mentionableUsers={mentionableUsers}
			onChange={(e) => setValue(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
					e.preventDefault();
					void handleSubmit();
				}
			}}
			// Toolbar action props
			submitText={submitText}
			submitting={submitting}
			hasRealContent={hasRealContent}
			onSubmit={handleSubmit}
			menuItems={COMMENT_MENU_ITEMS}
			onMenuAction={handleMenuAction}
			canApprove={canApprove}
			canClarify={canClarify}
			onApprove={onApprove}
			onClarify={onClarify}
		/>
	);
});

export default CommentInput;
