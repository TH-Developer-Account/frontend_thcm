import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";

import Avatar from "../../common/Avatar";
import { useToast } from "../../../context/Auth/AuthContext";
import { formatDateTime } from "../../../utils/format";

import { commentApi } from "./comment.api";
import CommentInput from "./CommentInput";
import type {
	CommentApiAdapter,
	CommentItem,
	CommentUser,
} from "./comment.types";

import "./comments.css";
import { CardEmpty, CardSkeleton } from "../CardSkeleton";

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
	formatAuditMessage?: (comment: CommentItem) => React.ReactNode;
	onCommentsChange?: (comments: CommentItem[]) => void;
};

type CommentCardProps = {
	comment: CommentItem;
	currentUserId?: string;
	level?: number;
	formatAuditMessage?: (comment: CommentItem) => React.ReactNode;
};

const commentsKeys = {
	activity: (
		subjectType: string,
		subjectId: string,
		refreshKey: string | number,
	) => ["comments", "activity", subjectType, subjectId, refreshKey] as const,
};

const getCommentAuthorName = (comment: CommentItem): string => {
	const name =
		`${comment.actor?.first_name ?? ""} ${comment.actor?.last_name ?? ""}`.trim();
	return name || "Unknown user";
};

const getDefaultAuditMessage = (comment: CommentItem): React.ReactNode =>
	comment.message || comment.reason || comment.action || "Activity updated";

const normalizeEmailList = (emails: string[]) =>
	Array.from(new Set(emails.map((email) => email.trim()).filter(Boolean)));

const CommentCard = React.memo(function CommentCard({
	comment,
	currentUserId,
	level = 0,
	formatAuditMessage,
}: CommentCardProps) {
	const isAuditLog = comment.entryType === "ACTIVITY_LOG";
	const isSelf = comment.actor?.id === currentUserId;

	if (isAuditLog) {
		return (
			<div
				className={["comment-card", level > 0 && "comment-reply-card"]
					.filter(Boolean)
					.join(" ")}
			>
				<div className="comment-audit-message">
					<span>
						{formatAuditMessage?.(comment) ?? getDefaultAuditMessage(comment)}
					</span>
				</div>
			</div>
		);
	}

	return (
		<article
			className={[
				"comment-card",
				level > 0 && "comment-reply-card",
				isSelf && "comment-card-self",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<div
				className={["comment-main", isSelf && "comment-main-self"]
					.filter(Boolean)
					.join(" ")}
			>
				<Avatar
					firstName={comment.actor?.first_name}
					lastName={comment.actor?.last_name}
					size="sm"
				/>
				<div className="comment-content">
					<div
						className={["comment-bubble", isSelf && "comment-bubble-self"]
							.filter(Boolean)
							.join(" ")}
					>
						<div className="comment-meta">
							<p className="comment-author">{getCommentAuthorName(comment)}</p>
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
							formatAuditMessage={formatAuditMessage}
						/>
					))}
				</div>
			) : null}
		</article>
	);
});

export default function CommentsSection({
	subjectType,
	subjectId,
	approvalId,
	mentionableUsers = [],
	ccEmails = [],
	refreshKey = 0,
	canComment = true,
	currentUserId,
	title = "Comments & activity",
	emptyTitle = "No comments yet",
	emptyDescription = "Start the discussion by adding the first comment.",
	api = commentApi,
	formatAuditMessage,
	onCommentsChange,
}: CommentsSectionProps) {
	const { showToast } = useToast();
	const queryClient = useQueryClient();
	const [toEmails, setToEmails] = React.useState<string[]>([]);
	const commentsListRef = React.useRef<HTMLDivElement>(null);
	const hasLoadedRef = React.useRef(false);
	const onCommentsChangeRef = React.useRef(onCommentsChange);

	React.useEffect(() => {
		onCommentsChangeRef.current = onCommentsChange;
	}, [onCommentsChange]);

	const queryKey = React.useMemo(
		() => commentsKeys.activity(subjectType, subjectId, refreshKey),
		[refreshKey, subjectId, subjectType],
	);

	const {
		data: comments = [],
		isLoading: commentsLoading,
		error,
	} = useQuery({
		queryKey,
		queryFn: () => api.getActivity({ subjectType, subjectId }),
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

	React.useEffect(() => {
		if (!hasLoadedRef.current) {
			hasLoadedRef.current = true;
			return;
		}

		commentsListRef.current?.scrollTo({
			top: commentsListRef.current.scrollHeight,
			behavior: "smooth",
		});
	}, [comments.length]);

	const handleMentionInsert = React.useCallback((user: CommentUser) => {
		if (!user.email) return;
		setToEmails((current) => normalizeEmailList([...current, user.email!]));
	}, []);

	const handleCreate = React.useCallback(
		async (message: string) => {
			const to = normalizeEmailList(toEmails);
			const cc = normalizeEmailList(ccEmails).filter(
				(email) => !to.includes(email),
			);

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

	const commentCountLabel = `${comments.length} ${
		comments.length === 1 ? "comment" : "comments"
	}`;

	return (
		<section aria-label={title}>
			<div className="comments-body">
				{commentsLoading ? (
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
							<span className="comments-subtitle">{commentCountLabel}</span>
						</header>
						<div
							className="comments-list scrollbar-sleek"
							ref={commentsListRef}
						>
							{comments.map((comment) => (
								<CommentCard
									key={comment.id}
									comment={comment}
									currentUserId={currentUserId}
									formatAuditMessage={formatAuditMessage}
								/>
							))}
						</div>
					</div>
				)}
			</div>

			{canComment ? (
				<footer className="comments-create">
					<div className="comments-create-input">
						<CommentInput
							disabled={commentsLoading || Boolean(loadError)}
							onSubmit={handleCreate}
							mentionableUsers={mentionableUsers}
							onMentionInsert={handleMentionInsert}
						/>
					</div>
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
