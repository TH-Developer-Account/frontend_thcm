import React, { type ForwardRefRenderFunction } from "react";
import {
	Smile,
	Paperclip,
	AtSign,
	Type,
	Bold,
	Italic,
	Code,
	List,
} from "lucide-react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import HelperTooltip from "../common/HelperToolTip";
import Avatar from "../common/Avatar";
import type { CommentUser } from "../../modules/workflow/components/CommentsSection";

// ============================
//  Types
// ============================

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
	// Rich-text specific
	mentionableUsers?: CommentUser[];
	onMentionInsert?: (user: CommentUser) => void;
	onFileAttach?: (files: FileList) => void;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

// ============================
//  Constants
// ============================

const EMOJIS = [
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

type FormatType = "bold" | "italic" | "code" | "bullet";

const FORMAT_ACTIONS: {
	icon: React.ElementType;
	fmt: FormatType;
	title: string;
}[] = [
	{ icon: Bold, fmt: "bold", title: "Bold" },
	{ icon: Italic, fmt: "italic", title: "Italic" },
	{ icon: Code, fmt: "code", title: "Inline code" },
	{ icon: List, fmt: "bullet", title: "Bullet list" },
];

type PopupState = "emoji" | "format" | null;

// ============================
//  RichTextareaInput
// ============================

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
		rows = 3,
		mentionableUsers = [],
		onMentionInsert,
		onFileAttach,
		onChange,
	},
	ref,
) => {
	const errorId = name ? `${name}-error` : undefined;

	const [popup, setPopup] = React.useState<PopupState>(null);
	const [mentionOpen, setMentionOpen] = React.useState(false);
	const [mentionQuery, setMentionQuery] = React.useState("");

	const mentionStartRef = React.useRef(-1);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const internalRef = React.useRef<HTMLTextAreaElement>(null);

	// Merge forwarded ref with internal ref
	const taRef = (ref ?? internalRef) as React.RefObject<HTMLTextAreaElement>;

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
	// HANDLE CHANGE (+ MENTION DETECTION)
	// ============================

	const handleChange = React.useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			onChange(e);

			const val = e.target.value;
			const cur = e.target.selectionStart ?? val.length;
			const before = val.slice(0, cur);
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
	// INSERT TEXT AT CURSOR
	// ============================

	const insertAtCursor = React.useCallback(
		(text: string) => {
			const ta = taRef.current;
			if (!ta) return;

			const s = ta.selectionStart ?? value.length;
			const e = ta.selectionEnd ?? value.length;
			const next = value.slice(0, s) + text + value.slice(e);

			// Trigger synthetic onChange so parent state updates
			const nativeInput = Object.getOwnPropertyDescriptor(
				window.HTMLTextAreaElement.prototype,
				"value",
			);
			nativeInput?.set?.call(ta, next);
			ta.dispatchEvent(new Event("input", { bubbles: true }));

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
			const next = `${before}@${user.first_name} ${user.last_name} ${after}`;

			const nativeInput = Object.getOwnPropertyDescriptor(
				window.HTMLTextAreaElement.prototype,
				"value",
			);
			nativeInput?.set?.call(ta, next);
			ta.dispatchEvent(new Event("input", { bubbles: true }));

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

			const wrapMap: Record<FormatType, string> = {
				bold: sel ? `**${sel}**` : "****",
				italic: sel ? `_${sel}_` : "__",
				code: sel ? `\`${sel}\`` : "``",
				bullet: `\n- ${sel || ""}`,
			};

			const rep = wrapMap[fmt];
			const next = value.slice(0, s) + rep + value.slice(e);

			const nativeInput = Object.getOwnPropertyDescriptor(
				window.HTMLTextAreaElement.prototype,
				"value",
			);
			nativeInput?.set?.call(ta, next);
			ta.dispatchEvent(new Event("input", { bubbles: true }));

			requestAnimationFrame(() => {
				const offset = fmt === "bold" ? 2 : fmt === "bullet" ? 3 : 1;
				ta.selectionStart = ta.selectionEnd = sel ? s + rep.length : s + offset;
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

	// ============================
	// RENDER
	// ============================

	return (
		<div className="form-field">
			{label && (
				<div className="form-label-row">
					<label htmlFor={name} className="form-label">
						{label}
						{required && <span className="form-required"> *</span>}
					</label>

					{helperText && isTooltip && !error && (
						<HelperTooltip label={label ?? ""} text={helperText} />
					)}
				</div>
			)}

			<div
				ref={containerRef}
				className={`
					form-input-wrapper relative flex flex-col
					rounded-xl border border-zinc-200 bg-white
					focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100
					transition-all
					${error ? "border-red-400" : ""}
					${disabled ? "opacity-60 pointer-events-none" : ""}
				`}
			>
				{/* ========================= */}
				{/* TEXTAREA */}
				{/* ========================= */}

				<textarea
					id={name}
					ref={taRef}
					name={name}
					autoFocus={autoFocus}
					placeholder={placeholder}
					value={value}
					disabled={disabled}
					maxLength={maxLength}
					rows={rows}
					aria-invalid={!!error}
					aria-describedby={error ? errorId : undefined}
					onChange={handleChange}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setPopup(null);
							setMentionOpen(false);
						}
					}}
					className={`
						form-textarea
						w-full resize-none rounded-t-xl bg-transparent
						px-3.5 pt-3 pb-1.5 text-sm text-zinc-900
						placeholder-zinc-400 outline-none
						min-h-[72px] max-h-[200px] overflow-y-auto
						${error ? "form-input-error" : ""}
						${disabled ? "form-input-disabled" : ""}
						${className}
					`}
				/>

				{/* ========================= */}
				{/* MENTION PICKER */}
				{/* ========================= */}

				{mentionOpen && filteredMentions.length > 0 && (
					<div className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
						{filteredMentions.map((user) => (
							<button
								key={user.id}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									insertMention(user);
								}}
								className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
							>
								<Avatar
									firstName={user.first_name}
									lastName={user.last_name}
									size="sm"
								/>
								<span>
									{user.first_name} {user.last_name}
								</span>
							</button>
						))}
					</div>
				)}

				{/* ========================= */}
				{/* TOOLBAR */}
				{/* ========================= */}

				<div className="flex items-center px-2 pb-2 pt-1 gap-2">
					<div className="flex flex-1 items-center gap-0.5">
						{/* EMOJI */}
						<div className="relative">
							<button
								type="button"
								title="Emoji"
								onClick={() =>
									setPopup((p) => (p === "emoji" ? null : "emoji"))
								}
								className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
							>
								<Smile size={15} />
							</button>

							{popup === "emoji" && (
								<div className="absolute bottom-full left-0 z-50 mb-1 grid grid-cols-8 gap-0.5 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg w-[220px]">
									{EMOJIS.map((emoji) => (
										<button
											key={emoji}
											type="button"
											onMouseDown={(e) => {
												e.preventDefault();
												insertAtCursor(emoji);
												setPopup(null);
											}}
											className="flex h-7 w-7 items-center justify-center rounded-md text-base hover:bg-zinc-100 transition-colors"
										>
											{emoji}
										</button>
									))}
								</div>
							)}
						</div>

						{/* ATTACH */}
						<button
							type="button"
							title="Attach file"
							onClick={handleAttach}
							className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
						>
							<Paperclip size={15} />
						</button>

						{/* MENTION */}
						<button
							type="button"
							title="Mention someone"
							onClick={() => {
								insertAtCursor("@");
								setMentionOpen(true);
								setMentionQuery("");
							}}
							className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
						>
							<AtSign size={15} />
						</button>

						<div className="mx-1 h-4 w-px bg-zinc-200" />

						{/* FORMAT */}
						<div className="relative">
							<button
								type="button"
								title="Formatting"
								onClick={() =>
									setPopup((p) => (p === "format" ? null : "format"))
								}
								className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
							>
								<Type size={15} />
							</button>

							{popup === "format" && (
								<div className="absolute bottom-full left-0 z-50 mb-1 flex items-center gap-0.5 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
									{FORMAT_ACTIONS.map(({ icon: Icon, fmt, title }) => (
										<button
											key={fmt}
											type="button"
											title={title}
											onMouseDown={(e) => {
												e.preventDefault();
												applyFormat(fmt);
											}}
											className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
										>
											<Icon size={14} />
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* CHAR COUNT */}
					<span className="text-[11px] text-zinc-400 tabular-nums">
						{(value ?? "").length} / {maxLength}
					</span>
				</div>

				{/* ERROR ICON */}
				{error && <ExclamationCircleIcon className="form-error-icon" />}
			</div>

			{error && (
				<p id={errorId} className="form-error-text">
					{error}
				</p>
			)}
		</div>
	);
};

const RichTextareaInput = React.forwardRef(RichTextarea);
RichTextareaInput.displayName = "RichTextareaInput";

export default RichTextareaInput;
