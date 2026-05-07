import React, { useState } from "react";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { MessageCircle, X, Send } from "lucide-react";
import Button from "../../../../../components/common/Button";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import Avatar from "../../../../../components/common/Avatar";
import { ServerAxios } from "../../../../../services/ServerAxios";
import type { EpcWorkflowStage } from "../types/ActivityView.types";
import Section from "./Section";
import ApprovalTable, {
	type ApprovalRow,
} from "../../../../../components/ui/ApprovalTable";
import { Modal } from "../../../../../components/common/Modal";
import { Alert } from "../../../../../components/common/Alert";
import { formatDateTime } from "../../../../../utils/format";

export type CommentUser = {
	id: string;
	first_name: string;
	last_name: string;
	avatarUrl?: string;
};

export type CommentItem = {
	id: string;
	message: string;
	actor: CommentUser;
	createdAt: string;
	updatedAt?: string;
	replies?: CommentItem[];
};

type CommentsSectionProps = {
	epcId: string;
	stages: EpcWorkflowStage[];
	approvalRows: ApprovalRow[];
	onWorkflowUpdate: () => Promise<void>;
	epcCreatedById?: string; // 👈
};

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
	level = 0,
}: {
	comment: CommentItem;
	level?: number;
}) {
	return (
		<div className={`comment-card ${level > 0 ? "comment-reply-card" : ""}`}>
			<div className="comment-main">
				<Avatar
					firstName={comment?.actor.first_name}
					lastName={comment?.actor.last_name}
					size="sm"
				/>

				<div className="comment-content">
					<div className="comment-bubble">
						<div className="comment-meta">
							<p className="comment-author">{`${comment?.actor.first_name} ${comment?.actor.last_name}`}</p>
							<div className="comment-submeta">
								<span>{formatDateTime(comment.createdAt)}</span>
							</div>
						</div>
						<p className="comment-text">{comment.message}</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function CommentsSection({
	epcId,
	stages,
	approvalRows,
	onWorkflowUpdate,
	epcCreatedById, // 👈
}: CommentsSectionProps) {
	const { showToast } = useToast();
	const { user } = useAuth();
	const [comments, setComments] = React.useState<CommentItem[]>([]);
	const [commentsLoading, setCommentsLoading] = React.useState(false);
	const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
	const [clarifyLoading, setClarifyLoading] = useState(false);

	const userId = user?.id as string;
	const isProposer = user?.id === epcCreatedById;

	React.useEffect(() => {
		const fetchAllComments = async () => {
			try {
				setCommentsLoading(true);
				const {
					data: { data },
				} = await ServerAxios.get(`/comment/${epcId}`);

				console.log({ data });

				setComments(data);
			} catch (err) {
				console.log({ err });
			} finally {
				setCommentsLoading(false);
			}
		};

		if (epcId) fetchAllComments();
	}, [epcId]);

	const currentStage = stages.find(
		(stage) => stage.status === "IN_PROGRESS" && stage.isCurrentIteration,
	);

	const getApprovalIdByUser = (
		stage: EpcWorkflowStage | undefined,
		userId?: string | null,
	) => {
		if (!stage || !userId) return null;

		const approval = stage.approvals.find(
			(a) => a.approverId === userId || a.approver?.id === userId,
		);

		return approval?.id ?? null;
	};

	const approvalId = getApprovalIdByUser(currentStage, user?.id);
	const isUserInCurrentStage = currentStage?.approvals.some(
		(approval) =>
			approval.approverId === userId || approval.approver?.id === userId,
	);

	const handleCreate = async (text: string) => {
		try {
			if (!approvalId && !isProposer) {
				showToast({
					type: "error",
					title: "Not allowed",
					description: "You are not assigned to this approval stage",
				});
				return;
			}
			const payload: Record<string, string | boolean> = { message: text };

			if (approvalId) {
				payload.approvalId = approvalId;
			} else {
				payload.epcId = epcId;
			}

			const {
				data: { message, data },
			} = await ServerAxios.post(
				`${approvalId ? "/comment" : "/comment/creator-comment"}`,
				payload,
			);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			setComments((prev) => [
				...prev,
				{
					id: data.id,
					message: data.message,
					createdAt: data.createdAt,
					updatedAt: data.updatedAt,
					actor: {
						id: data.user.id,
						first_name: data.user.first_name,
						last_name: data.user.last_name,
					},
				},
			]);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: "Error while adding the comment";
			showToast({
				type: "error",
				title: "error",
				description: message,
			});
		}
	};

	const handleApprove = async () => {
		try {
			const {
				data: { message },
			} = await ServerAxios.post(`/soa/stages/${currentStage?.id}/approve`);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});
			await onWorkflowUpdate();
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: "Error while adding the comment";
			showToast({
				type: "error",
				title: "Error",
				description: message,
			});
		}
	};

	const handleClarify = async () => {
		try {
			if (!currentStage?.id) {
				showToast({
					type: "error",
					title: "Not allowed",
					description: "No active approval stage found",
				});
				return;
			}

			setClarifyLoading(true);

			const {
				data: { message },
			} = await ServerAxios.post(`/soa/stages/${currentStage.id}/clarify`);

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			setIsClarifyModalOpen(false);
			await onWorkflowUpdate();
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: typeof err === "string"
						? err
						: "Error while sending clarification request";

			showToast({
				type: "error",
				title: "Error",
				description: message,
			});
		} finally {
			setClarifyLoading(false);
		}
	};
	const disabled = !currentStage || !isUserInCurrentStage;
	const canComment = !isProposer && (!currentStage || !isUserInCurrentStage);
	return (
		<React.Fragment>
			<section className="comments-section mb-4">
				<div className="comments-header">
					<div className="px-2.5 py-2 flex flex-row justify-between gap-4 w-full">
						<h3 className="comments-title">
							<MessageCircle size={16} />
							Comment Section
						</h3>
						<p className="comments-subtitle">
							{comments.length} {comments.length === 1 ? "comment" : "comments"}
						</p>
					</div>
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
					<div className="comments-list">
						{comments.map((comment) => (
							<CommentCard key={comment.id} comment={comment} />
						))}
					</div>
				)}

				{!canComment && (
					<div className="comments-create">
						<div className="comments-create-input">
							<CommentInput
								disabled={commentsLoading}
								onSubmit={handleCreate}
							/>
						</div>
					</div>
				)}
			</section>
			<Section title="Approval Flow">
				{!disabled && (
					<div className="flex flex-row gap-4 items-center justify-end">
						<Button
							text="Clarify"
							status="outline"
							onClick={() => setIsClarifyModalOpen(true)}
						/>
						<Button text="Approve" status="brand" onClick={handleApprove} />
					</div>
				)}

				<ApprovalTable data={approvalRows} />
			</Section>
			<Modal
				open={isClarifyModalOpen}
				// onClose={() => setIsClarifyModalOpen(false)}
			>
				<Alert
					description="Are you sure you want to send this back for clarification?"
					variant="warning"
					title="Send for Clarification"
					primaryAction={{
						label: clarifyLoading ? "Sending..." : "Confirm",
						onClick: handleClarify,
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setIsClarifyModalOpen(false),
					}}
				/>
			</Modal>
		</React.Fragment>
	);
}
