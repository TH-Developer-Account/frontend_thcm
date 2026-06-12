import React from "react";
import { MessageCircle } from "lucide-react";
import { useToast } from "../../../../../context/Auth/AuthContext";
import Avatar from "../../../../../components/common/Avatar";
import Section from "../common/Section";
import { formatDateTime } from "../../../../../utils/format";
import { workflowApi } from "../../api/workflow.api";
import CommentInput from "./CommentInput";
import "../../../marketing.styles.css";
import { getAuditMessage } from "../../helpers/activityLogMessage.helper";

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

const CommentCard = React.memo(function CommentCard({
	comment,
	ref,
	level = 0,
	isSelf = false,
}: {
	comment: CommentItem;
	level?: number;
	ref?: React.Ref<HTMLDivElement>;
	isSelf?: boolean;
}) {
	const isAuditLog = comment.entryType === "ACTIVITY_LOG";

	return (
		<div className={`comment-card ${level > 0 ? "comment-reply-card" : ""}`}>
			{isAuditLog ? (
				<div className="comment-auditMessage">
					<span>{getAuditMessage(comment)}</span>
				</div>
			) : (
				<div
					className={`comment-main ${isSelf ? "comment-main--self" : ""}`}
					ref={ref}
				>
					{!isSelf && (
						<Avatar
							firstName={comment.actor?.first_name}
							lastName={comment.actor?.last_name}
							size="sm"
						/>
					)}

					<div className="comment-content">
						<div
							className={`comment-bubble ${isSelf ? "comment-bubble--self" : ""}`}
						>
							<div className="comment-meta">
								{!isSelf ? (
									<p className="comment-author">
										{`${comment.actor?.first_name ?? ""} ${comment.actor?.last_name ?? ""}`.trim()}
									</p>
								) : (
									<p className="comment-author">
										{`${comment.actor?.first_name ?? ""} ${comment.actor?.last_name ?? ""}`.trim()}
									</p>
								)}
								<span className="comment-submeta">
									{formatDateTime(comment.createdAt)}
								</span>
							</div>
							<p className="comment-text">{comment.message}</p>
						</div>
					</div>

					{isSelf && (
						<Avatar
							firstName={comment.actor?.first_name}
							lastName={comment.actor?.last_name}
							size="sm"
						/>
					)}
				</div>
			)}
		</div>
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
				if (!cancelled) setComments(data);
			} catch (err) {
				console.error(err);
			} finally {
				if (!cancelled) setCommentsLoading(false);
			}
		};

		if (epcId) void fetchAllComments();

		return () => {
			cancelled = true;
		};
	}, [epcId, refreshKey]);

	React.useEffect(() => {
		if (isInitialLoad.current) {
			isInitialLoad.current = false;
			return;
		}

		listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [comments.length]);

	const handleMentionInsert = React.useCallback((user: CommentUser) => {
		if (!user.email) return;

		setToEmails((prev) =>
			prev.includes(user.email!) ? prev : [...prev, user.email!],
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

				const response = approvalId
					? await workflowApi.createApprovalComment({
							approvalId,
							message: text,
							to: toEmails,
							cc: ccEmails.filter((email) => !toEmails.includes(email)),
						})
					: await workflowApi.createCreatorComment({
							epcId,
							message: text,
							to: toEmails,
							cc: ccEmails.filter((email) => !toEmails.includes(email)),
						});

				showToast({
					type: "success",
					title: "Success",
					description: response.message,
				});

				const data = response.data;
				setComments((prev) => [
					...prev,
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
			} catch (err) {
				showToast({
					type: "error",
					title: "Error",
					description:
						err instanceof Error
							? err.message
							: "Error while adding the comment",
				});
			}
		},
		[approvalId, ccEmails, epcId, isProposer, showToast, toEmails],
	);

	return (
		<Section title="Comment Section">
			<section className="comments-section mb-2">
				<div className="flex flex-row justify-end bg-zinc-100">
					<p className="comments-subtitle">
						{comments.length} {comments.length === 1 ? "comment" : "comments"}
					</p>
				</div>

				{commentsLoading ? (
					<div className="comments-loading">
						<div />
						<div />
						<div />
					</div>
				) : comments.length === 0 ? (
					<div className="comments-empty">
						<MessageCircle size={24} />
						<p>No comments yet</p>
						<span>Start the discussion by adding the first comment.</span>
					</div>
				) : (
					<div className="comments-list scrollbar-sleek">
						{comments.map((comment) => (
							<CommentCard
								key={comment.id}
								comment={comment}
								isSelf={comment.actor?.id === currentUserId}
								ref={listEndRef}
							/>
						))}
					</div>
				)}

				<div className="comments-create light-blue-bg-header">
					{!canComment && (
						<div className="comments-create-input" ref={listEndRef}>
							<CommentInput
								disabled={commentsLoading}
								onSubmit={handleCreate}
								mentionableUsers={mentionableUsers}
								onMentionInsert={handleMentionInsert}
							/>
						</div>
					)}
				</div>
			</section>
		</Section>
	);
}
