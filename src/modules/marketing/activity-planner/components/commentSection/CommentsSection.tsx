import React from "react";
import { MessageCircle } from "lucide-react";

import Avatar from "../../../../../components/common/Avatar";
import SectionAccordion from "../../../../../components/common/SectionAccordion";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { formatDateTime } from "../../../../../utils/format";

import { workflowApi } from "../../api/workflow.api";
import { getAuditMessage } from "../../helpers/activityLogMessage.helper";

import CommentInput from "./CommentInput";

import "../../../marketing.styles.css";

export type MentionableUserInput = {
	id: string;
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
	avatarUrl?: string | null;
};

export type CommentUser = {
	id: string;
	first_name: string;
	last_name: string;
	avatarUrl?: string;
	email?: string;
};

export type CommentItem = {
	id: string;
	message: string;
	actor: CommentUser;
	createdAt: string;
	updatedAt?: string;
	replies?: CommentItem[];
	entryType?: string;
	reason?: string;
	action?: string;
	stageName?: string;
};

type CommentsSectionProps = {
	epcId: string;
	approvalId?: string | null;
	isProposer?: boolean;
	mentionableUsers?: CommentUser[];
	ccEmails?: string[];
	refreshKey?: number;
	canComment?: boolean;
	currentUserId?: string;
};

type CommentCardProps = {
	comment: CommentItem;
	level?: number;
	isSelf?: boolean;
};

const getCommentAuthorName = (comment: CommentItem): string => {
	const name = `${comment.actor?.first_name ?? ""} ${
		comment.actor?.last_name ?? ""
	}`.trim();

	return name || "Unknown user";
};

const CommentCard = React.memo(function CommentCard({
	comment,
	level = 0,
	isSelf = false,
}: CommentCardProps) {
	const isAuditLog = comment.entryType === "ACTIVITY_LOG";

	if (isAuditLog) {
		return (
			<div
				className={["comment-card", level > 0 && "comment-reply-card"]
					.filter(Boolean)
					.join(" ")}
			>
				<div className="comment-audit-message">
					<span>{getAuditMessage(comment)}</span>
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
							level={level + 1}
							isSelf={isSelf}
						/>
					))}
				</div>
			) : null}
		</article>
	);
});

export default function CommentsSection({
	epcId,
	approvalId,
	isProposer = false,
	mentionableUsers = [],
	ccEmails = [],
	refreshKey = 0,
	canComment,
	currentUserId,
}: CommentsSectionProps) {
	const { showToast } = useToast();

	const [comments, setComments] = React.useState<CommentItem[]>([]);
	const [commentsLoading, setCommentsLoading] = React.useState(false);
	const [toEmails, setToEmails] = React.useState<string[]>([]);

	const listEndRef = React.useRef<HTMLDivElement>(null);
	const isInitialLoad = React.useRef(true);

	React.useEffect(() => {
		let cancelled = false;

		const fetchAllComments = async () => {
			try {
				setCommentsLoading(true);

				const data = await workflowApi.getComments(epcId);

				if (!cancelled) {
					setComments(data);
				}
			} catch (error) {
				console.error(error);
			} finally {
				if (!cancelled) {
					setCommentsLoading(false);
				}
			}
		};

		if (epcId) {
			void fetchAllComments();
		}

		return () => {
			cancelled = true;
		};
	}, [epcId, refreshKey]);

	React.useEffect(() => {
		if (isInitialLoad.current) {
			isInitialLoad.current = false;
			return;
		}

		listEndRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	}, [comments.length]);

	const handleMentionInsert = React.useCallback((user: CommentUser) => {
		if (!user.email) return;

		setToEmails((currentEmails) =>
			currentEmails.includes(user.email!)
				? currentEmails
				: [...currentEmails, user.email!],
		);
	}, []);

	const handleCreate = React.useCallback(
		async (text: string) => {
			try {
				if (!approvalId && !isProposer) {
					showToast({
						type: "error",
						title: "Not allowed",
						description: "You are not assigned to this approval stage",
					});

					return;
				}

				const cc = ccEmails.filter((email) => !toEmails.includes(email));

				const response = approvalId
					? await workflowApi.createApprovalComment({
							approvalId,
							message: text,
							to: toEmails,
							cc,
						})
					: await workflowApi.createCreatorComment({
							epcId,
							message: text,
							to: toEmails,
							cc,
						});

				showToast({
					type: "success",
					title: "Success",
					description: response.message,
				});

				const data = response.data;

				setComments((currentComments) => [
					...currentComments,
					{
						id: data.id,
						message: data.message,
						entryType: data.entryType ?? "CREATOR_COMMENT",
						createdAt: data.createdAt,
						updatedAt: data.updatedAt,
						actor: {
							id: data.user.id,
							first_name: data.user.first_name,
							last_name: data.user.last_name,
						},
					},
				]);

				setToEmails([]);
			} catch (error) {
				showToast({
					type: "error",
					title: "Error",
					description:
						error instanceof Error
							? error.message
							: "Error while adding the comment",
				});
			}
		},
		[approvalId, ccEmails, epcId, isProposer, showToast, toEmails],
	);

	const commentCountLabel = `${comments.length} ${
		comments.length === 1 ? "comment" : "comments"
	}`;

	return (
		<SectionAccordion title="Comment Section">
			<section className="comments-section" aria-label="Comments and activity">
				<header className="comments-summary">
					<span className="comments-subtitle">{commentCountLabel}</span>
				</header>

				<div className="comments-body">
					{commentsLoading ? (
						<div
							className="comments-loading"
							aria-label="Loading comments"
							aria-live="polite"
						>
							<div />
							<div />
							<div />
						</div>
					) : comments.length === 0 ? (
						<div className="comments-empty">
							<MessageCircle size={20} aria-hidden="true" />

							<div className="comments-empty-copy">
								<p>No comments yet</p>

								<span>Start the discussion by adding the first comment.</span>
							</div>
						</div>
					) : (
						<div className="comments-list scrollbar-sleek">
							{comments.map((comment) => (
								<CommentCard
									key={comment.id}
									comment={comment}
									isSelf={comment.actor?.id === currentUserId}
								/>
							))}

							<div ref={listEndRef} aria-hidden="true" />
						</div>
					)}
				</div>

				{!canComment ? (
					<footer className="comments-create">
						<div className="comments-create-input">
							<CommentInput
								disabled={commentsLoading}
								onSubmit={handleCreate}
								mentionableUsers={mentionableUsers}
								onMentionInsert={handleMentionInsert}
							/>
						</div>
					</footer>
				) : null}
			</section>
		</SectionAccordion>
	);
}
