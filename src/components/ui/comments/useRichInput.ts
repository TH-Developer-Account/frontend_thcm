import React from "react";

import { FORMAT_CURSOR_OFFSET, FORMAT_WRAP } from "./comment.constants";
import type { CommentUser } from "./comment.types";
import type { FormatType, PopupState } from "./richTextarea.types";

function setNativeValue(element: HTMLTextAreaElement, value: string) {
	const descriptor = Object.getOwnPropertyDescriptor(
		window.HTMLTextAreaElement.prototype,
		"value",
	);

	descriptor?.set?.call(element, value);
	element.dispatchEvent(new Event("input", { bubbles: true }));
}

type UseRichInputParams = {
	value: string;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	mentionableUsers: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
	onFileAttach?: (files: FileList) => void;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export function useRichInput({
	value,
	textareaRef,
	mentionableUsers,
	onMentionInsert,
	onFileAttach,
	onChange,
}: UseRichInputParams) {
	const [popup, setPopup] = React.useState<PopupState>(null);
	const [mentionOpen, setMentionOpen] = React.useState(false);
	const [mentionQuery, setMentionQuery] = React.useState("");
	const mentionStartRef = React.useRef(-1);
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const handleOutsidePointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setPopup(null);
				setMentionOpen(false);
			}
		};

		window.addEventListener("pointerdown", handleOutsidePointerDown);
		return () => window.removeEventListener("pointerdown", handleOutsidePointerDown);
	}, []);

	React.useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
	}, [textareaRef, value]);

	const filteredMentions = React.useMemo(() => {
		const query = mentionQuery.trim().toLowerCase();
		if (!query) return mentionableUsers;

		return mentionableUsers.filter((user) =>
			`${user.first_name} ${user.last_name}`.toLowerCase().includes(query),
		);
	}, [mentionQuery, mentionableUsers]);

	const handleChange = React.useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(event);

			const nextValue = event.target.value;
			const cursor = event.target.selectionStart ?? nextValue.length;
			const valueBeforeCursor = nextValue.slice(0, cursor);
			const match = valueBeforeCursor.match(/@([\p{L}\p{N}_-]*)$/u);

			if (match) {
				mentionStartRef.current = valueBeforeCursor.lastIndexOf("@");
				setMentionQuery(match[1]);
				setMentionOpen(true);
				return;
			}

			mentionStartRef.current = -1;
			setMentionOpen(false);
		},
		[onChange],
	);

	const insertAtCursor = React.useCallback(
		(text: string) => {
			const textarea = textareaRef.current;
			if (!textarea) return;

			const start = textarea.selectionStart ?? value.length;
			const end = textarea.selectionEnd ?? value.length;
			const nextValue = value.slice(0, start) + text + value.slice(end);

			setNativeValue(textarea, nextValue);
			requestAnimationFrame(() => {
				textarea.selectionStart = textarea.selectionEnd = start + text.length;
				textarea.focus();
			});
		},
		[textareaRef, value],
	);

	const insertMention = React.useCallback(
		(user: CommentUser) => {
			const textarea = textareaRef.current;
			if (!textarea || mentionStartRef.current < 0) return;

			const before = value.slice(0, mentionStartRef.current);
			const after = value.slice(textarea.selectionEnd ?? value.length);
			const mention = `@${user.first_name} ${user.last_name}`.trim();
			const nextValue = `${before}${mention} ${after}`;

			setNativeValue(textarea, nextValue);
			mentionStartRef.current = -1;
			setMentionOpen(false);
			onMentionInsert?.(user);
			requestAnimationFrame(() => textarea.focus());
		},
		[onMentionInsert, textareaRef, value],
	);

	const applyFormat = React.useCallback(
		(format: FormatType) => {
			const textarea = textareaRef.current;
			if (!textarea) return;

			const start = textarea.selectionStart ?? 0;
			const end = textarea.selectionEnd ?? 0;
			const selection = value.slice(start, end);
			const replacement = FORMAT_WRAP[format](selection);

			setNativeValue(
				textarea,
				value.slice(0, start) + replacement + value.slice(end),
			);

			requestAnimationFrame(() => {
				textarea.selectionStart = textarea.selectionEnd = selection
					? start + replacement.length
					: start + FORMAT_CURSOR_OFFSET[format];
				textarea.focus();
			});

			setPopup(null);
		},
		[textareaRef, value],
	);

	const handleAttach = React.useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.multiple = true;
		input.onchange = () => {
			if (input.files?.length) onFileAttach?.(input.files);
		};
		input.click();
	}, [onFileAttach]);

	return {
		containerRef,
		popup,
		setPopup,
		mentionOpen,
		filteredMentions,
		handleChange,
		insertAtCursor,
		insertMention,
		applyFormat,
		handleAttach,
	};
}
