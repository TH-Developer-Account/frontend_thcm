import React from "react";
import type { CommentUser } from "../components/CommentsSection";
import type { FormatType, PopupState } from "../types/workflow.types";
import { FORMAT_WRAP, FORMAT_CURSOR_OFFSET } from "../utils/constants";

// ============================
//  Helper — set controlled input value via React's internal setter
//  (avoids duplicating this 3x in the component)
// ============================

function setNativeValue(el: HTMLTextAreaElement, value: string) {
	const descriptor = Object.getOwnPropertyDescriptor(
		window.HTMLTextAreaElement.prototype,
		"value",
	);
	descriptor?.set?.call(el, value);
	el.dispatchEvent(new Event("input", { bubbles: true }));
}

// ============================
//  useRichInput
// ============================

export function useRichInput({
	value,
	taRef,
	mentionableUsers,
	onMentionInsert,
	onFileAttach,
	onChange,
}: {
	value: string;
	taRef: React.RefObject<HTMLTextAreaElement>;
	mentionableUsers: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
	onFileAttach?: (files: FileList) => void;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
	const [popup, setPopup] = React.useState<PopupState>(null);
	const [mentionOpen, setMentionOpen] = React.useState(false);
	const [mentionQuery, setMentionQuery] = React.useState("");
	const mentionStartRef = React.useRef(-1);
	const containerRef = React.useRef<HTMLDivElement>(null);

	// ============================
	// CLOSE POPUPS ON OUTSIDE CLICK
	// ============================

	React.useEffect(() => {
		const handler = (e: PointerEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) {
				setPopup(null);
				setMentionOpen(false);
			}
		};
		window.addEventListener("pointerdown", handler);
		return () => window.removeEventListener("pointerdown", handler);
	}, []);

	// ============================
	// AUTO-RESIZE
	// ============================

	React.useEffect(() => {
		const ta = taRef.current;
		if (!ta) return;
		ta.style.height = "auto";
		ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
	}, [value, taRef]);

	// ============================
	// MENTION FILTERING
	// ============================

	const filteredMentions = React.useMemo(() => {
		const q = mentionQuery.toLowerCase();
		return mentionableUsers.filter((u) =>
			`${u.first_name} ${u.last_name}`.toLowerCase().includes(q),
		);
	}, [mentionableUsers, mentionQuery]);

	// ============================
	// HANDLE CHANGE + MENTION DETECTION
	// ============================

	const handleChange = React.useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(e);
			const val = e.target.value;
			const before = val.slice(0, e.target.selectionStart ?? val.length);
			const match = before.match(/@([\w]*)$/);
			if (match) {
				mentionStartRef.current = before.lastIndexOf("@");
				setMentionQuery(match[1]);
				setMentionOpen(true);
			} else {
				mentionStartRef.current = -1;
				setMentionOpen(false);
			}
		},
		[onChange],
	);

	// ============================
	// INSERT AT CURSOR (emoji / @)
	// ============================

	const insertAtCursor = React.useCallback(
		(text: string) => {
			const ta = taRef.current;
			if (!ta) return;
			const s = ta.selectionStart ?? value.length;
			const e = ta.selectionEnd ?? value.length;
			setNativeValue(ta, value.slice(0, s) + text + value.slice(e));
			requestAnimationFrame(() => {
				ta.selectionStart = ta.selectionEnd = s + text.length;
				ta.focus();
			});
		},
		[value, taRef],
	);

	// ============================
	// INSERT MENTION
	// ============================

	const insertMention = React.useCallback(
		(user: CommentUser) => {
			const ta = taRef.current;
			if (!ta) return;
			const before = value.slice(0, mentionStartRef.current);
			const after = value.slice(ta.selectionEnd ?? value.length);
			setNativeValue(
				ta,
				`${before}@${user.first_name} ${user.last_name} ${after}`,
			);
			mentionStartRef.current = -1;
			setMentionOpen(false);
			onMentionInsert?.(user);
			requestAnimationFrame(() => ta.focus());
		},
		[value, taRef, onMentionInsert],
	);

	// ============================
	// APPLY FORMAT
	// ============================

	const applyFormat = React.useCallback(
		(fmt: FormatType) => {
			const ta = taRef.current;
			if (!ta) return;
			const s = ta.selectionStart ?? 0;
			const e = ta.selectionEnd ?? 0;
			const sel = value.slice(s, e);
			const rep = FORMAT_WRAP[fmt](sel);
			setNativeValue(ta, value.slice(0, s) + rep + value.slice(e));
			requestAnimationFrame(() => {
				ta.selectionStart = ta.selectionEnd = sel
					? s + rep.length
					: s + FORMAT_CURSOR_OFFSET[fmt];
				ta.focus();
			});
			setPopup(null);
		},
		[value, taRef],
	);

	// ============================
	// FILE ATTACH
	// ============================

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
		// Refs
		containerRef,
		// Popup state
		popup,
		setPopup,
		// Mention state
		mentionOpen,
		mentionQuery,
		filteredMentions,
		// Handlers
		handleChange,
		insertAtCursor,
		insertMention,
		applyFormat,
		handleAttach,
	};
}
