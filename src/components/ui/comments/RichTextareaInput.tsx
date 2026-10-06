import React, { type ForwardRefRenderFunction } from "react";
import { AtSign, Send, Smile } from "lucide-react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import Avatar from "../../common/Avatar";
import Button from "../../common/Button";
import HelperTooltip from "../../common/HelperTooltip";
import TextareaInput from "../../forms/TextareaInput";

import type {
	CommentUser,
	PopupState,
	RichTextareaProps,
} from "./comment.types";

import "./comments.css";

/* -------------------------------------------------------------------------- */
/* Constants & utils                                                          */
/* -------------------------------------------------------------------------- */

export const COMMENT_EMOJIS = [
	"👍",
	"❤️",
	"😊",
	"🎉",
	"✅",
	"🔥",
	"👏",
	"💡",
	"⚠️",
	"📎",
	"📋",
	"🔍",
	"💬",
	"📌",
	"🚀",
	"⭐",
	"✨",
	"🙏",
	"👀",
	"💯",
	"🤔",
	"😅",
	"🙌",
	"📊",
	"📝",
	"🔗",
	"✔️",
	"❌",
	"⏰",
	"📅",
];

const MAX_AUTO_HEIGHT = 200;

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const formatMention = (user: CommentUser) =>
	`@${user.first_name} ${user.last_name}`.trim();

/** Sets the value through the native setter so React's onChange fires. */
const setNativeValue = (element: HTMLTextAreaElement, value: string) => {
	Object.getOwnPropertyDescriptor(
		window.HTMLTextAreaElement.prototype,
		"value",
	)?.set?.call(element, value);
	element.dispatchEvent(new Event("input", { bubbles: true }));
};

/** Replace [start, end) with `text`, then place the caret after it. */
const replaceRange = (
	textarea: HTMLTextAreaElement,
	value: string,
	start: number,
	end: number,
	text: string,
) => {
	setNativeValue(textarea, value.slice(0, start) + text + value.slice(end));

	requestAnimationFrame(() => {
		textarea.selectionStart = textarea.selectionEnd = start + text.length;
		textarea.focus();
	});
};

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

type UseRichInputParams = {
	value: string;
	textareaRef: React.RefObject<HTMLTextAreaElement | null>;
	mentionableUsers: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
	onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export function useRichInput({
	value,
	textareaRef,
	mentionableUsers,
	onMentionInsert,
	onChange,
}: UseRichInputParams) {
	const [popup, setPopup] = React.useState<PopupState>(null);
	const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
	const mentionStartRef = React.useRef(-1);
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Close popovers on outside click.
	React.useEffect(() => {
		const handlePointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setPopup(null);
				setMentionQuery(null);
			}
		};

		window.addEventListener("pointerdown", handlePointerDown);
		return () => window.removeEventListener("pointerdown", handlePointerDown);
	}, []);

	// Auto-grow the textarea up to MAX_AUTO_HEIGHT.
	React.useEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		textarea.style.height = "auto";
		textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_AUTO_HEIGHT)}px`;
	}, [textareaRef, value]);

	const filteredMentions = React.useMemo(() => {
		const query = mentionQuery?.trim().toLowerCase();
		if (!query) return mentionableUsers;

		return mentionableUsers.filter((user) =>
			`${user.first_name} ${user.last_name}`.toLowerCase().includes(query),
		);
	}, [mentionQuery, mentionableUsers]);

	/** Tracks an "@query" being typed right before the caret. */
	const handleChange = React.useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(event);

			const nextValue = event.target.value;
			const beforeCursor = nextValue.slice(
				0,
				event.target.selectionStart ?? nextValue.length,
			);
			const match = beforeCursor.match(/@([\p{L}\p{N}_-]*)$/u);

			mentionStartRef.current = match ? beforeCursor.lastIndexOf("@") : -1;
			setMentionQuery(match ? match[1] : null);
		},
		[onChange],
	);

	const insertAtCursor = React.useCallback(
		(text: string) => {
			const textarea = textareaRef.current;
			if (!textarea) return;

			replaceRange(
				textarea,
				value,
				textarea.selectionStart ?? value.length,
				textarea.selectionEnd ?? value.length,
				text,
			);
		},
		[textareaRef, value],
	);

	/** Inline "@query" completion: replaces the typed query with the mention. */
	const completeMention = React.useCallback(
		(user: CommentUser) => {
			const textarea = textareaRef.current;
			if (!textarea || mentionStartRef.current < 0) return;

			replaceRange(
				textarea,
				value,
				mentionStartRef.current,
				textarea.selectionEnd ?? value.length,
				`${formatMention(user)} `,
			);

			mentionStartRef.current = -1;
			setMentionQuery(null);
			onMentionInsert?.(user);
		},
		[onMentionInsert, textareaRef, value],
	);

	/** "Mention" button: inserts the mention at the caret. */
	const insertMentionAtCursor = React.useCallback(
		(user: CommentUser) => {
			insertAtCursor(`${formatMention(user)} `);
			onMentionInsert?.(user);
			setPopup(null);
		},
		[insertAtCursor, onMentionInsert],
	);

	return {
		containerRef,
		popup,
		setPopup,
		mentionOpen: mentionQuery !== null,
		filteredMentions,
		handleChange,
		insertAtCursor,
		completeMention,
		insertMentionAtCursor,
	};
}

/* -------------------------------------------------------------------------- */
/* Mention list (shared by inline "@" and the Mention button)                 */
/* -------------------------------------------------------------------------- */

const MentionList = ({
	users,
	onSelect,
}: {
	users: CommentUser[];
	onSelect: (user: CommentUser) => void;
}) => (
	<div
		className="rich-textarea-popover rich-textarea-mention-popover"
		role="listbox"
		aria-label="Mention a user"
	>
		{users.length > 0 ? (
			users.map((user) => (
				<button
					key={user.id}
					type="button"
					className="rich-textarea-menu-item"
					role="option"
					aria-selected="false"
					onMouseDown={(event) => {
						// Keep focus (and caret position) in the textarea.
						event.preventDefault();
						onSelect(user);
					}}
				>
					<Avatar
						firstName={user.first_name}
						lastName={user.last_name}
						size="sm"
					/>
					<span className="rich-textarea-menu-label">
						{user.first_name} {user.last_name}
					</span>
				</button>
			))
		) : (
			<div className="rich-textarea-menu-item" aria-disabled="true">
				<span className="rich-textarea-menu-label">No users to mention</span>
			</div>
		)}
	</div>
);

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const RichTextarea: ForwardRefRenderFunction<
	HTMLTextAreaElement,
	RichTextareaProps
> = (
	{
		name,
		label,
		placeholder = "Write a comment...",
		value,
		error,
		className = "",
		required,
		disabled,
		helperText,
		isTooltip = true,
		maxLength = 1000,
		autoFocus,
		rows = 1,
		onChange,
		onKeyDown,
		mentionableUsers = [],
		onMentionInsert,
		submitText = "Send",
		submitting = false,
		hasRealContent = false,
		onSubmit,
	},
	forwardedRef,
) => {
	const errorId = error ? `${name}-error` : undefined;
	const internalRef = React.useRef<HTMLTextAreaElement>(null);
	const textareaRef = (forwardedRef ??
		internalRef) as React.RefObject<HTMLTextAreaElement | null>;

	const {
		containerRef,
		popup,
		setPopup,
		mentionOpen,
		filteredMentions,
		handleChange,
		insertAtCursor,
		completeMention,
		insertMentionAtCursor,
	} = useRichInput({
		value,
		textareaRef,
		mentionableUsers,
		onMentionInsert,
		onChange,
	});

	const togglePopup = (next: Exclude<PopupState, null>) =>
		setPopup((current) => (current === next ? null : next));

	return (
		<div className="form-field rich-textarea-field">
			{label ? (
				<div className="form-label-row">
					<label htmlFor={name} className="form-label">
						{label}
						{required ? <span className="form-required"> *</span> : null}
					</label>
					{helperText && isTooltip && !error ? (
						<HelperTooltip label={label} text={helperText} />
					) : null}
				</div>
			) : null}

			<div
				ref={containerRef}
				className={joinClassNames(
					"rich-textarea",
					"rich-textarea-row",
					error && "rich-textarea-error",
					disabled && "rich-textarea-disabled",
				)}
			>
				{/* Emoji */}
				<div className="rich-textarea-tool-group">
					<Button
						type="button"
						appearance="icon"
						variant="secondary"
						size="sm"
						Icon={Smile}
						aria-label="Insert emoji"
						aria-expanded={popup === "emoji"}
						onClick={() => togglePopup("emoji")}
					/>
					{popup === "emoji" ? (
						<div className="rich-textarea-popover rich-textarea-emoji-popover">
							{COMMENT_EMOJIS.map((emoji) => (
								<Button
									key={emoji}
									type="button"
									className="rich-textarea-emoji"
									aria-label={`Insert ${emoji}`}
									onMouseDown={(event) => {
										event.preventDefault();
										insertAtCursor(emoji);
										setPopup(null);
									}}
								>
									{emoji}
								</Button>
							))}
						</div>
					) : null}
				</div>

				{/* Textarea + inline "@" suggestions */}
				<div className="rich-textarea-input-wrap">
					<TextareaInput
						id={name}
						ref={textareaRef}
						name={name}
						autoFocus={autoFocus}
						placeholder={placeholder}
						value={value}
						disabled={disabled}
						maxLength={maxLength}
						rows={rows}
						aria-invalid={Boolean(error)}
						aria-describedby={errorId}
						onChange={handleChange}
						onKeyDown={(event) => {
							if (event.key === "Escape") setPopup(null);
							onKeyDown?.(event);
						}}
						className={joinClassNames(
							"rich-textarea-control",
							error && "form-input-error",
							disabled && "form-input-disabled",
							className,
						)}
					/>

					{mentionOpen && filteredMentions.length > 0 ? (
						<MentionList users={filteredMentions} onSelect={completeMention} />
					) : null}
				</div>

				{/* Mention button */}
				<div className="rich-textarea-tool-group">
					<Button
						type="button"
						appearance="standard"
						variant="outline"
						size="sm"
						text="Mention"
						Icon={AtSign}
						aria-label="Mention someone"
						aria-expanded={popup === "mentionList"}
						className="rich-textarea-mention-trigger"
						onClick={() => togglePopup("mentionList")}
					/>
					{popup === "mentionList" ? (
						<MentionList
							users={mentionableUsers}
							onSelect={insertMentionAtCursor}
						/>
					) : null}
				</div>

				<Button
					type="button"
					appearance="standard"
					variant="brand"
					size="sm"
					Icon={Send}
					text={submitting ? "Saving..." : submitText}
					disabled={!hasRealContent || disabled || submitting}
					loading={submitting}
					onClick={onSubmit}
					className="rich-textarea-submit"
				/>

				{error ? (
					<ExclamationCircleIcon
						className="form-error-icon"
						aria-hidden="true"
					/>
				) : null}
			</div>

			{error ? (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			) : null}

			<span className="rich-textarea-counter">
				{value.length} / {maxLength}
			</span>
		</div>
	);
};

const RichTextareaInput = React.forwardRef(RichTextarea);
RichTextareaInput.displayName = "RichTextareaInput";

export default RichTextareaInput;
