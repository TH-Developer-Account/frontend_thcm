import React from "react";
import {
	AtSign,
	HelpCircle,
	Paperclip,
	Send,
	FileText,
	Lock,
	ChevronUp,
} from "lucide-react";
import type { CommentUser } from "./CommentsSection";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import Button from "../../../../components/common/Button";
import Avatar from "../../../../components/common/Avatar";

// ============================
//  CommentInput
// ============================
type Mention = {
	id: string;
	name: string;
};
const COMMENT_MENU_ITEMS = [
	{
		icon: Send,
		label: "Send comment",
		action: "submit",
	},
	{
		icon: AtSign,
		label: "Mention someone",
		action: "mention",
	},
	{
		icon: Paperclip,
		label: "Attach file / reference",
		action: "attach",
	},
	{
		icon: HelpCircle,
		label: "Mark as question",
		action: "question",
	},
	{
		icon: FileText,
		label: "Save as draft",
		action: "draft",
	},
] as const;

const PRIMARY_ACTIONS = {
	submit: {
		label: "Send",
		icon: Send,
	},
	approve: {
		label: "Approve",
		icon: Send,
	},
	clarify: {
		label: "Clarify",
		icon: HelpCircle,
	},
} as const;

type PrimaryActionKey = keyof typeof PRIMARY_ACTIONS;
const CommentInput = React.memo(function CommentInput({
	placeholder = "Write a comment...",
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
	const [menuOpen, setMenuOpen] = React.useState(false);

	const [mentionOpen, setMentionOpen] = React.useState(false);
	const [mentionQuery, setMentionQuery] = React.useState("");
	const [mentions, setMentions] = React.useState<Mention[]>([]);
	const menuRef = React.useRef<HTMLDivElement>(null);
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const [selectedAction, setSelectedAction] =
		React.useState<PrimaryActionKey>("submit");

	const hasRealContent = value.replace(/@\w+/g, "").trim().length > 0;
	// ============================
	// CLOSE MENU
	// ============================

	React.useEffect(() => {
		const handler = (e: PointerEvent) => {
			if (!menuRef.current) return;

			if (!menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};

		window.addEventListener("pointerdown", handler);

		return () => {
			window.removeEventListener("pointerdown", handler);
		};
	}, []);

	// ============================
	// MENTION FILTERING
	// ============================

	const filteredMentions = React.useMemo(() => {
		const query = mentionQuery.toLowerCase();

		return mentionableUsers.filter((user) => {
			const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();

			return fullName.includes(query);
		});
	}, [mentionableUsers, mentionQuery]);

	// ============================
	// HANDLE CHANGE
	// ============================

	const handleChange = React.useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const val = e.target.value;

			setValue(val);

			// Better mention parser
			const mentionMatch = val.match(/@([\w]*)$/);

			if (mentionMatch) {
				setMentionQuery(mentionMatch[1]);
				setMentionOpen(true);
			} else {
				setMentionOpen(false);
			}
		},
		[],
	);

	// ============================
	// INSERT MENTION
	// ============================

	const insertMention = React.useCallback((user: CommentUser) => {
		const fullName = `${user.first_name} ${user.last_name}`;

		setValue((prev) => prev.replace(/@[\w]*$/, `@${fullName} `));

		setMentions((prev: Mention[]) => {
			const exists = prev.some((m) => m.id === user.id);

			if (exists) return prev;

			return [
				...prev,
				{
					id: user.id,
					name: fullName,
				},
			];
		});

		setMentionOpen(false);

		requestAnimationFrame(() => {
			textareaRef.current?.focus();
		});
	}, []);
	// ============================
	// SUBMIT
	// ============================

	const handleSubmit = React.useCallback(async () => {
		if (submitting || disabled) return;

		const trimmed = value.trim();
		const hasRealContent = trimmed.replace(/@\w+/g, "").trim().length > 0;

		if (!trimmed || !hasRealContent) return;

		try {
			setSubmitting(true);

			await onSubmit(trimmed);

			setValue("");
			setMentionOpen(false);
		} finally {
			setSubmitting(false);
		}
	}, [disabled, onSubmit, submitting, value]);

	// ============================
	// MENU ACTIONS
	// ============================
	const handlePrimaryAction = React.useCallback(async () => {
		if (disabled || submitting) return;

		switch (selectedAction) {
			case "submit":
				await handleSubmit();
				break;

			case "approve":
				onApprove?.();
				break;

			case "clarify":
				onClarify?.();
				break;

			default:
				break;
		}
	}, [
		selectedAction,
		handleSubmit,
		onApprove,
		onClarify,
		disabled,
		submitting,
	]);
	const handleMenuAction = React.useCallback((action: string) => {
		switch (action) {
			case "submit":
				setSelectedAction("submit");
				break;

			case "mention":
				setValue((prev) => (prev.endsWith("@") ? prev : `${prev}@`));

				setMentionOpen(true);

				requestAnimationFrame(() => {
					textareaRef.current?.focus();
				});
				break;

			default:
				break;
		}

		setMenuOpen(false);
	}, []);

	const isPrimaryDisabled =
		selectedAction === "submit"
			? !hasRealContent || disabled || submitting
			: disabled || submitting;
	console.log("Mentioned User Details", mentions);
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="relative flex-1">
				<TextareaInput
					ref={textareaRef}
					name="comment"
					autoFocus={autoFocus}
					value={value}
					disabled={disabled || submitting}
					placeholder={placeholder}
					onChange={handleChange}
					rows={1}
					maxLength={1000}
					className="min-h-[5vh] overflow-y-auto bg-white px-2 py-1.5 resize-none"
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setMentionOpen(false);
						}

						if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
							e.preventDefault();

							void handleSubmit();
						}
					}}
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
			</div>

			{/* ========================= */}
			{/* ACTIONS */}
			{/* ========================= */}

			<div ref={menuRef} className="relative flex items-center gap-2">
				{menuOpen && (
					<div className="absolute bottom-full right-0 z-50 mb-1 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
						<div className="border-b border-zinc-100 py-1">
							{COMMENT_MENU_ITEMS.map(({ icon: Icon, label, action }) => (
								<button
									key={label}
									type="button"
									onClick={() => handleMenuAction(action)}
									className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
								>
									<Icon size={14} className="text-zinc-400" />

									{label}
								</button>
							))}
						</div>

						<div className="py-1">
							<button
								type="button"
								onClick={() => {
									setSelectedAction("approve");
									setMenuOpen(false);
								}}
								disabled={!canApprove}
								className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
									canApprove
										? "text-zinc-900 hover:bg-zinc-50"
										: "cursor-not-allowed text-zinc-300"
								}`}
							>
								Approve
								{!canApprove && <Lock size={12} className="text-zinc-300" />}
							</button>

							<button
								type="button"
								disabled={!canClarify}
								onClick={() => {
									setSelectedAction("clarify");
									setMenuOpen(false);
								}}
								className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
									canClarify
										? "text-zinc-900 hover:bg-zinc-50"
										: "cursor-not-allowed text-zinc-300"
								}`}
							>
								Clarify / Send back
								{!canClarify && <Lock size={12} className="text-zinc-300" />}
							</button>
						</div>
					</div>
				)}

				<div className="flex items-center overflow-hidden rounded-lg border border-zinc-200">
					<Button
						type="button"
						status="brand"
						onClick={() => void handlePrimaryAction()}
						disabled={isPrimaryDisabled}
						text={
							submitting
								? "Processing..."
								: PRIMARY_ACTIONS[selectedAction].label
						}
						Icon={PRIMARY_ACTIONS[selectedAction].icon}
						size="sm"
						iconSize="12"
						className="rounded-none border-0"
					/>

					<Button
						type="button"
						onClick={() => setMenuOpen((prev) => !prev)}
						aria-label="More options"
						aria-expanded={menuOpen}
						aria-haspopup="menu"
						className={`rounded-none border-0 py-1.5 ${menuOpen ? "rotate-180" : ""}`}
						Icon={ChevronUp}
						status="brand"
						size="sm"
						iconSize="16"
						disabled={disabled || submitting}
					/>
				</div>
			</div>
		</div>
	);
});

export default CommentInput;
