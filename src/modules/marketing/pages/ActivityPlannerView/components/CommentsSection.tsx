import React from "react";
import { MessageCircle, X, Send } from "lucide-react";
import Button from "../../../../../components/common/Button";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import Avatar from "../../../../../components/common/Avatar";

export type CommentUser = {
	id: string;
	name: string;
	avatarUrl?: string;
	role?: string;
};

export type CommentItem = {
	id: string;
	comment: string;
	user: CommentUser;
	createdAt: string;
	updatedAt?: string;
	replies?: CommentItem[];
};

type CommentsSectionProps = {
	title?: string;
	comments: CommentItem[];
	currentUser: CommentUser;
	loading?: boolean;
	error?: string;
	disabled?: boolean;
	allowReply?: boolean;
	allowEdit?: boolean;
	allowDelete?: boolean;
	onCreate: (comment: string) => Promise<void>;
	onReply?: (parentCommentId: string, comment: string) => Promise<void>;
	onUpdate?: (commentId: string, comment: string) => Promise<void>;
	onDelete?: (commentId: string) => Promise<void>;
};

const formatDate = (value: string) => {
	if (!value) return "";
	return new Date(value).toLocaleString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const getInitials = (name: string) =>
	name
		.split(" ")
		.map((word) => word[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

function CommentInput({
	placeholder = "Write a comment...",
	submitText = "Send",
	disabled,
	autoFocus,
	initialValue = "",
	onCancel,
	onSubmit,
}: {
	placeholder?: string;
	submitText?: string;
	disabled?: boolean;
	autoFocus?: boolean;
	initialValue?: string;
	onCancel?: () => void;
	onSubmit: (value: string) => Promise<void>;
}) {
	const [value, setValue] = React.useState(initialValue);
	const [submitting, setSubmitting] = React.useState(false);

	const handleSubmit = async () => {
		const trimmed = value.trim();
		if (!trimmed || submitting || disabled) return;

		try {
			setSubmitting(true);
			await onSubmit(trimmed);
			setValue("");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<>
			<div className="flex items-center justify-between gap-3">
				<div className="flex-1">
					<TextareaInput
						name="comment"
						autoFocus={autoFocus}
						value={value}
						disabled={disabled || submitting}
						placeholder={placeholder}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
								handleSubmit();
							}
						}}
						rows={4}
						className="bg-white overflow-y-auto px-2 py-1.5 min-h-[5vh]"
					/>
				</div>
				{/* <p className="comment-helper">Press Ctrl + Enter to send</p> */}
				<div>
					{onCancel && (
						<Button
							type="button"
							status="brand"
							onClick={onCancel}
							disabled={submitting}
							text={"Cancel"}
							Icon={X}
							iconSize="14"
						/>
					)}
					<Button
						text={submitting ? "Saving..." : submitText}
						type="button"
						status="brand"
						onClick={handleSubmit}
						disabled={!value.trim() || disabled || submitting}
						Icon={Send}
						iconSize="14"
					/>
				</div>
			</div>
		</>
	);
}

function CommentCard({
	comment,
	currentUser,
	disabled,
	allowEdit,
	allowDelete,
	level = 0,
	onReply,
	onUpdate,
	onDelete,
}: {
	comment: CommentItem;
	currentUser: CommentUser;
	disabled?: boolean;
	allowReply?: boolean;
	allowEdit?: boolean;
	allowDelete?: boolean;
	level?: number;
	onReply?: (parentCommentId: string, comment: string) => Promise<void>;
	onUpdate?: (commentId: string, comment: string) => Promise<void>;
	onDelete?: (commentId: string) => Promise<void>;
}) {
	return (
		<div className={`comment-card ${level > 0 ? "comment-reply-card" : ""}`}>
			<div className="comment-main">
				<Avatar firstName={getInitials(comment?.user.name)} size="sm" />

				<div className="comment-content">
					<div className="comment-bubble">
						<div className="comment-meta">
							<p className="comment-author">{comment.user.name}</p>
							<div className="comment-submeta">
								{comment.user.role && <span>{comment.user.role}</span>}•
								<span>{formatDate(comment.createdAt)}</span>
								{comment.updatedAt && <span>Edited</span>}
							</div>
						</div>

						<p className="comment-text">{comment.comment}</p>
					</div>
					{comment.replies && comment.replies.length > 0 && (
						<div className="comment-replies">
							{comment.replies.map((reply) => (
								<CommentCard
									key={reply.id}
									comment={reply}
									currentUser={currentUser}
									disabled={disabled}
									allowReply={false}
									allowEdit={allowEdit}
									allowDelete={allowDelete}
									level={level + 1}
									onReply={onReply}
									onUpdate={onUpdate}
									onDelete={onDelete}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function CommentsSection({
	title = "Comment Section",
	comments,
	currentUser,
	loading = false,
	error,
	disabled = false,
	allowReply = true,
	allowEdit = true,
	allowDelete = true,
	onCreate,
	onReply,
	onUpdate,
	onDelete,
}: CommentsSectionProps) {
	return (
		<section className="comments-section">
			<div className="comments-header">
				<div className="px-2.5 py-2 flex flex-row justify-between gap-4 w-full">
					<h3 className="comments-title">
						<MessageCircle size={16} />
						{title}
					</h3>
					<p className="comments-subtitle">
						{comments.length} {comments.length === 1 ? "comment" : "comments"}
					</p>
				</div>
			</div>

			{loading ? (
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
				<div className="comments-list">
					{comments.map((comment) => (
						<CommentCard
							key={comment.id}
							comment={comment}
							currentUser={currentUser}
							disabled={disabled}
							allowReply={allowReply}
							allowEdit={allowEdit}
							allowDelete={allowDelete}
							onReply={onReply}
							onUpdate={onUpdate}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}

			{!disabled && (
				<div className="comments-create">
					<Avatar firstName={currentUser.name} size="sm" />
					<div className="comments-create-input">
						<CommentInput disabled={loading} onSubmit={onCreate} />
					</div>
				</div>
			)}

			{error && <div className="comments-error">{error}</div>}
		</section>
	);
}
