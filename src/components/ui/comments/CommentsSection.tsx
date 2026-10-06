import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import Avatar from "../../common/Avatar";
import { useToast } from "../../../context/Auth/AuthContext";
import { formatDateTime } from "../../../utils/format";
import { CardEmpty, CardSkeleton } from "../CardSkeleton";

import { commentApi, commentKeys } from "./comment.api";
import type {
	CommentApiAdapter,
	CommentItem,
	CommentUser,
} from "./comment.types";
import RichTextareaInput from "./RichTextareaInput";

import "./comments.css";

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

const getAuthorName = (comment: CommentItem): string =>
	`${comment.actor?.first_name ?? ""} ${comment.actor?.last_name ?? ""}`.trim() ||
	"Unknown user";

const uniqueEmails = (emails: readonly string[]) =>
	Array.from(new Set(emails.map((email) => email.trim()).filter(Boolean)));

/* -------------------------------------------------------------------------- */
/* Comment input                                                              */
/* -------------------------------------------------------------------------- */

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

export const CommentInput = React.memo(function CommentInput({
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
	const hasRealContent = value.trim().length > 0;

	React.useEffect(() => setValue(initialValue), [initialValue]);

	const handleSubmit = React.useCallback(async () => {
		if (submitting || disabled || !hasRealContent) return;

		setSubmitting(true);
		try {
			await onSubmit(value.trim());
			setValue("");
		} catch {
			// Caller already surfaced the error; keep the draft so the user can retry.
		} finally {
			setSubmitting(false);
		}
	}, [disabled, hasRealContent, onSubmit, submitting, value]);

	return (
		<RichTextareaInput
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
				// Ctrl/Cmd + Enter sends.
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

/* -------------------------------------------------------------------------- */
/* Comment card                                                               */
/* -------------------------------------------------------------------------- */

type CommentCardProps = {
	comment: CommentItem;
	currentUserId?: string;
	level?: number;
};

const CommentCard = React.memo(function CommentCard({
	comment,
	currentUserId,
	level = 0,
}: CommentCardProps) {
	const isSelf = Boolean(currentUserId) && comment.actor?.id === currentUserId;

	return (
		<article
			className={joinClassNames(
				"comment-card",
				level > 0 && "comment-reply-card",
				isSelf && "comment-card-self",
			)}
		>
			<div
				className={joinClassNames(
					"comment-main",
					isSelf && "comment-main-self",
				)}
			>
				<Avatar
					firstName={comment.actor?.first_name}
					lastName={comment.actor?.last_name}
					size="sm"
				/>

				<div className="comment-content">
					<div
						className={joinClassNames(
							"comment-bubble",
							isSelf && "comment-bubble-self",
						)}
					>
						<div className="comment-meta">
							<p className="comment-author">{getAuthorName(comment)}</p>
							<time className="comment-submeta" dateTime={comment.createdAt}>
								{formatDateTime(comment.createdAt)}
							</time>
						</div>
						<p className="comment-text">{comment.message}</p>
					</div>
				</div>
			</div>

			{comment.replies?.length ? (
				<div className="comment-replies">
					{comment.replies.map((reply) => (
						<CommentCard
							key={reply.id}
							comment={reply}
							currentUserId={currentUserId}
							level={level + 1}
						/>
					))}
				</div>
			) : null}
		</article>
	);
});

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export type CommentsSectionProps = {
	subjectType: string;
	subjectId: string;
	approvalId?: string | null;
	mentionableUsers?: CommentUser[];
	ccEmails?: string[];
	refreshKey?: string | number;
	canComment?: boolean;
	currentUserId?: string;
	title?: string;
	emptyTitle?: string;
	emptyDescription?: string;
	api?: CommentApiAdapter;
	onCommentsChange?: (comments: CommentItem[]) => void;
};

export default function CommentsSection({
	subjectType,
	subjectId,
	approvalId,
	mentionableUsers = [],
	ccEmails = [],
	refreshKey = 0,
	canComment = true,
	currentUserId,
	title = "Chat Section",
	emptyTitle = "No comments yet",
	emptyDescription = "Start the discussion by adding the first comment.",
	api = commentApi,
	onCommentsChange,
}: CommentsSectionProps) {
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	const [toEmails, setToEmails] = React.useState<string[]>([]);
	const listRef = React.useRef<HTMLDivElement>(null);
	const hasLoadedRef = React.useRef(false);
	const onCommentsChangeRef = React.useRef(onCommentsChange);

	React.useEffect(() => {
		onCommentsChangeRef.current = onCommentsChange;
	}, [onCommentsChange]);

	const queryKey = React.useMemo(
		() => [...commentKeys.list(subjectType, subjectId), refreshKey] as const,
		[refreshKey, subjectId, subjectType],
	);

	const {
		data: comments = [],
		isLoading,
		error,
	} = useQuery({
		queryKey,
		queryFn: () => api.getComments({ subjectType, subjectId }),
		enabled: Boolean(subjectType && subjectId),
		staleTime: Infinity,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const loadError = error
		? error instanceof Error
			? error.message
			: "Unable to load comments"
		: null;

	React.useEffect(() => {
		onCommentsChangeRef.current?.(comments);
	}, [comments]);

	// Scroll to the newest comment after the first load.
	React.useEffect(() => {
		if (!hasLoadedRef.current) {
			hasLoadedRef.current = true;
			return;
		}
		listRef.current?.scrollTo({
			top: listRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [comments.length]);

	const handleMentionInsert = React.useCallback((user: CommentUser) => {
		if (!user.email) return;
		setToEmails((current) => uniqueEmails([...current, user.email!]));
	}, []);

	const handleCreate = React.useCallback(
		async (message: string) => {
			const to = uniqueEmails(toEmails);
			const cc = uniqueEmails(ccEmails).filter((email) => !to.includes(email));

			try {
				const response = await api.createComment({
					subjectType,
					subjectId,
					approvalId,
					payload: { message, to, cc },
				});

				queryClient.setQueryData<CommentItem[]>(queryKey, (current = []) => [
					...current,
					response.data,
				]);
				setToEmails([]);
				showToast({
					type: "success",
					title: "Success",
					description: response.message,
				});
			} catch (createError) {
				showToast({
					type: "error",
					title: "Error",
					description:
						createError instanceof Error
							? createError.message
							: "Error while adding the comment",
				});
				throw createError;
			}
		},
		[
			api,
			approvalId,
			ccEmails,
			queryClient,
			queryKey,
			showToast,
			subjectId,
			subjectType,
			toEmails,
		],
	);

	const countLabel = `${comments.length} ${comments.length === 1 ? "comment" : "comments"}`;

	return (
		<section aria-label={title} className="comments">
			<div className="comments-body">
				{isLoading ? (
					<CardSkeleton />
				) : loadError ? (
					<CardEmpty
						title="Unable to load comments"
						description={loadError}
						Icon={MessageCircle}
						iconSize={20}
					/>
				) : comments.length === 0 ? (
					<CardEmpty
						title={emptyTitle}
						description={emptyDescription}
						Icon={MessageCircle}
						iconSize={20}
					/>
				) : (
					<div className="comments-section">
						<header className="comments-summary">
							<span className="comments-subtitle">{countLabel}</span>
						</header>
						<div className="comments-list scrollbar-sleek" ref={listRef}>
							{comments.map((comment) => (
								<CommentCard
									key={comment.id}
									comment={comment}
									currentUserId={currentUserId}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{canComment ? (
				<footer className="comments-create">
					<CommentInput
						disabled={isLoading || Boolean(loadError)}
						onSubmit={handleCreate}
						mentionableUsers={mentionableUsers}
						onMentionInsert={handleMentionInsert}
					/>
				</footer>
			) : null}
		</section>
	);
}

export type {
	CommentItem,
	CommentUser,
	MentionableUserInput,
} from "./comment.types";
