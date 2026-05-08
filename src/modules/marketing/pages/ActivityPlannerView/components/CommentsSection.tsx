import React, { useMemo, useState } from "react";
import { useToast } from "../../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../../context/Auth/useAuth";
import { MessageCircle, X, Send } from "lucide-react";
import Button from "../../../../../components/common/Button";
import TextareaInput from "../../../../../components/FormElements/TextareaInput";
import Avatar from "../../../../../components/common/Avatar";
import { ServerAxios } from "../../../../../services/ServerAxios";
import type { EpcWorkflowStage } from "../types/ActivityView.types";
import Section from "./Section";
import ApprovalTable from "../../../../../components/ui/ApprovalTable";
import { Modal } from "../../../../../components/common/Modal";
import { formatDateTime } from "../../../../../utils/format";
import type { ApprovalTableRow } from "../../../../../utils/types";
import { getApprovalStrategyLabel } from "../helpers/activityFormView.helper";

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
	entryType?: string;
	reason?: string;
	action?: string;
	stageName?: string;
};

type CommentsSectionProps = {
	epcId: string;
	stages: EpcWorkflowStage[];
	onWorkflowUpdate: () => Promise<void>;
	epcCreatedById?: string; // 👈
};
type AuditAction =
	| "APPROVED"
	| "RECOMMENDED"
	| "CLARIFIED"
	| "SENT_BACK"
	| "SUBMITTED"
	| "CANCELLED"
	| "COMPLETED"
	| "REPORT_SUBMITTED"
	| string;

type AuditComment = {
	action?: AuditAction | null;
	reason?: string | null;
	stageName?: string | null;
	actor?: {
		first_name?: string | null;
		last_name?: string | null;
	};
	createdAt: string;
};
const getActorName = (comment: AuditComment) => {
	return [comment.actor?.first_name, comment.actor?.last_name]
		.filter(Boolean)
		.join(" ");
};

const getAuditMessage = (comment: AuditComment) => {
	const actorName = getActorName(comment) || "Someone";
	const action = comment.action?.toUpperCase();
	const reason = comment.reason?.trim();
	const stageName = comment.stageName;
	const timeStamp = formatDateTime(comment?.createdAt);

	const reasonText = reason ? ` • ${reason} • ` : "";
	const stageText = stageName ? `${stageName} • ` : "";

	switch (action) {
		case "APPROVED":
			return `${stageText} ${actorName} approved this${reasonText} ${timeStamp}`;

		case "RECOMMENDED":
			return `${stageText} ${actorName} recommended this${reasonText} ${timeStamp}`;

		case "CLARIFY":
			return `${stageText} ${actorName} asked for clarification${reasonText} ${timeStamp}`;

		case "SENT_BACK":
			return `${stageText} ${actorName} sent this back${reasonText} ${timeStamp}`;

		case "SUBMITTED":
			return `${actorName} submitted this${reasonText} ${timeStamp}`;

		case "CANCELLED":
			return `${actorName} cancelled this${reasonText} ${timeStamp}`;

		case "COMPLETED":
			return `${actorName} completed this${reasonText} ${timeStamp}`;

		case "REPORT_SUBMITTED":
			return `${actorName} submitted the report${reasonText} ${timeStamp}`;

		default:
			return reason
				? `${stageText} ${actorName} updated this — ${reason} ${timeStamp}`
				: `${actorName} updated this ${timeStamp}`;
	}
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
	const isAuditLog = comment.entryType === "AUDIT_LOG";

	return (
		<div className={`comment-card ${level > 0 ? "comment-reply-card" : ""}`}>
			{isAuditLog ? (
				<div className="comment-auditMessage">
					<span>{getAuditMessage(comment)}</span>
				</div>
			) : (
				<div className="comment-main">
					<Avatar
						firstName={comment?.actor?.first_name}
						lastName={comment?.actor?.last_name}
						size="sm"
					/>

					<div className="comment-content">
						<div className="comment-bubble">
							<div className="comment-meta">
								<p className="comment-author">
									{`${comment?.actor?.first_name ?? ""} ${comment?.actor?.last_name ?? ""}`}
								</p>

								<div className="comment-submeta">
									<span>{formatDateTime(comment.createdAt)}</span>
								</div>
							</div>

							<p className="comment-text">{comment.message}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default function CommentsSection({
	epcId,
	stages,
	onWorkflowUpdate,
	epcCreatedById, // 👈
}: CommentsSectionProps) {
	const { showToast } = useToast();
	const { user } = useAuth();
	const [comments, setComments] = React.useState<CommentItem[]>([]);
	const [commentsLoading, setCommentsLoading] = React.useState(false);
	const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
	const [clarifyLoading, setClarifyLoading] = useState(false);
	const [clarifyReason, setClarifyReason] = useState("");

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

	const approvalRows = useMemo<ApprovalTableRow[]>(() => {
		return stages.flatMap((stage) =>
			stage.approvals.map((approval) => ({
				id: approval.id,
				stageOrder: stage.stageOrder,
				name: `${approval.approver?.first_name ?? ""} ${
					approval.approver?.last_name ?? ""
				}`.trim(),
				email: approval.approver?.email ?? "--",
				stageName: stage.stageName ?? `Stage ${stage.stageOrder}`,
				strategy: getApprovalStrategyLabel(stage),
				status: approval.status ?? stage.status ?? "--",
			})),
		);
	}, [stages]);

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
				payload.isProposer = true; // 👈
			}

			const {
				data: { message, data },
			} = await ServerAxios.post(`/comment`, payload);

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
		const trimmedReason = clarifyReason.trim();

		if (!trimmedReason) {
			showToast({
				type: "error",
				title: "Reason required",
				description: "Please enter a reason before sending for clarification.",
			});
			return;
		}

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

			console.log("Clarification reason:", trimmedReason);

			const {
				data: { message, data },
			} = await ServerAxios.post(`/soa/stages/${currentStage.id}/clarify`, {
				reason: trimmedReason,
			});

			showToast({
				type: "success",
				title: "Success",
				description: message,
			});

			setComments((prev) => [
				...prev,
				{
					id: data?.id ?? crypto.randomUUID(),
					message: "",
					entryType: "AUDIT_LOG",
					action: "CLARIFIED",
					reason: data?.reason ?? trimmedReason,
					stageName: data?.stageName ?? currentStage.stageName,
					createdAt: data?.createdAt ?? new Date().toISOString(),
					updatedAt: data?.updatedAt ?? new Date().toISOString(),
					actor: {
						id: user?.id ?? "",
						first_name: user?.first_name ?? "",
						last_name: user?.last_name ?? "",
					},
				},
			]);

			setClarifyReason("");
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
			<Section
				title="Comment Section"
				action={
					<p className="comments-subtitle">
						{comments.length} {comments.length === 1 ? "comment" : "comments"}
					</p>
				}
			>
				<section className="comments-section mb-4">
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
								<CommentCard key={comment.id} comment={comment} />
							))}
						</div>
					)}

					{!canComment && (
						<div className="comments-create light-blue-bg-header">
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

					<ApprovalTable data={approvalRows} stages={stages} />
				</Section>
				<Modal open={isClarifyModalOpen}>
					<div className="w-full  rounded-2xl bg-white p-5 shadow-xl border border-zinc-200">
						<div className="mb-4">
							<h3 className="text-sm font-semibold text-zinc-900">
								Send for Clarification
							</h3>

							<p className="mt-1 text-xs text-zinc-500">
								Please mention why this request needs clarification. This reason
								will be shown in the comment section.
							</p>
						</div>

						<TextareaInput
							name="clarifyReason"
							value={clarifyReason}
							onChange={(e) => setClarifyReason(e.target.value)}
							placeholder="Example: Please update the budget breakup before approval."
							rows={4}
							autoFocus
							disabled={clarifyLoading}
							className="bg-white overflow-y-auto px-2 py-1.5 min-h-[90px]"
						/>

						<div className="mt-4 flex justify-end gap-3">
							<Button
								type="button"
								text="Cancel"
								status="outline"
								disabled={clarifyLoading}
								onClick={() => {
									setClarifyReason("");
									setIsClarifyModalOpen(false);
								}}
							/>

							<Button
								type="button"
								text={clarifyLoading ? "Sending..." : "Send Clarification"}
								status="brand"
								disabled={!clarifyReason.trim() || clarifyLoading}
								onClick={handleClarify}
							/>
						</div>
					</div>
				</Modal>
			</Section>
		</React.Fragment>
	);
}
