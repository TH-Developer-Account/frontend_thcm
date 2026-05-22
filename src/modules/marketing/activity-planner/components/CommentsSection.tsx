import React, { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useToast } from "../../../../context/Auth/AuthContext";
import { useAuth } from "../../../../context/Auth/useAuth";
import Button from "../../../../components/common/Button";
import TextareaInput from "../../../../components/FormElements/TextareaInput";
import Avatar from "../../../../components/common/Avatar";
import Section from "./Section";
import ApprovalFlowSection from "./ApprovalFlowSection";
import { Modal } from "../../../../components/common/Modal";
import { formatDateTime } from "../../../../utils/format";
import type { WorkflowStage } from "../types/workflow.types";
import { workflowApi } from "../api/workflow.api";
import CommentInput from "./CommentInput";
import "../../marketing.styles.css";

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
	stages: WorkflowStage[];
	onWorkflowUpdate: () => Promise<void>;
	epcCreatedById?: string;
};

type AuditComment = {
	action?: string | null;
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
	const timeStamp = formatDateTime(comment.createdAt);

	const reasonText = reason ? ` • ${reason} • ` : "";
	const stageText = stageName ? `${stageName} • ` : "";

	switch (action) {
		case "APPROVED":
			return `${stageText}${actorName} approved this${reasonText} ${timeStamp}`;

		case "RECOMMENDED":
			return `${stageText}${actorName} recommended this${reasonText} ${timeStamp}`;

		case "CLARIFIED":
		case "CLARIFY":
			return `${stageText}${actorName} asked for clarification${reasonText} ${timeStamp}`;

		case "SENT_BACK":
			return `${stageText}${actorName} sent this back${reasonText} ${timeStamp}`;

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
				? `${stageText}${actorName} updated this — ${reason} ${timeStamp}`
				: `${actorName} updated this ${timeStamp}`;
	}
};

const CommentCard = React.memo(function CommentCard({
	comment,
	ref,
	level = 0,
}: {
	comment: CommentItem;
	level?: number;
	ref?: React.Ref<HTMLDivElement>;
}) {
	const isAuditLog = comment.entryType === "ACTIVITY_LOG";

	return (
		<div className={`comment-card ${level > 0 ? "comment-reply-card" : ""}`}>
			{isAuditLog ? (
				<div className="comment-auditMessage">
					<span>{getAuditMessage(comment)}</span>
				</div>
			) : (
				<div className="comment-main" ref={ref}>
					<Avatar
						firstName={comment.actor?.first_name}
						lastName={comment.actor?.last_name}
						size="sm"
					/>

					<div className="comment-content">
						<div className="comment-bubble">
							<div className="comment-meta">
								<p className="comment-author">
									{`${comment.actor?.first_name ?? ""} ${
										comment.actor?.last_name ?? ""
									}`}
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
});

export default function CommentsSection({
	epcId,
	stages,
	onWorkflowUpdate,
	epcCreatedById,
}: CommentsSectionProps) {
	const { showToast } = useToast();
	const { user } = useAuth();

	const [comments, setComments] = React.useState<CommentItem[]>([]);
	const [commentsLoading, setCommentsLoading] = React.useState(false);
	const [isClarifyModalOpen, setIsClarifyModalOpen] = useState(false);
	const [clarifyLoading, setClarifyLoading] = useState(false);
	const [clarifyReason, setClarifyReason] = useState("");
	const [mentionedUsers, setMentionedUsers] = React.useState<CommentUser[]>([]);

	const userId = user?.id as string | undefined;
	const isProposer = userId === epcCreatedById;

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
	}, [epcId]);

	const currentStage = useMemo(() => {
		return stages.find(
			(stage) => stage.status === "IN_PROGRESS" && stage.isCurrentIteration,
		);
	}, [stages]);

	const approvalId = useMemo(() => {
		if (!currentStage || !userId) return null;

		const approval = currentStage.approvals.find(
			(item) => item.approverId === userId || item.approver?.id === userId,
		);

		return approval?.id ?? null;
	}, [currentStage, userId]);

	const isUserInCurrentStage = React.useMemo(
		() =>
			Boolean(
				currentStage?.approvals.some(
					(item) => item.approverId === userId || item.approver?.id === userId,
				),
			),
		[currentStage, userId],
	);
	const listEndRef = React.useRef<HTMLDivElement>(null);
	const isInitialLoad = React.useRef(true); // ← tracks first render

	React.useEffect(() => {
		// Skip scroll on initial fetch
		if (isInitialLoad.current) {
			isInitialLoad.current = false;
			return;
		}
		listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [comments.length]);
	// Derives mentionable users from stages — add this in CommentsSection
	const mentionableUsers = useMemo(() => {
		const seen = new Set<string>();
		const users: CommentUser[] = [];

		for (const stage of stages) {
			for (const approval of stage.approvals) {
				const u = approval.approver;
				if (u && !seen.has(u.id)) {
					seen.add(u.id);
					users.push(u);
				}
			}
		}
		console.log("mentionableUsers", users);
		return users;
	}, [stages]);

	const handleMentionInsert = React.useCallback((user: CommentUser) => {
		setMentionedUsers((prev) =>
			prev.some((u) => u.id === user.id) ? prev : [...prev, user],
		);
	}, []);

	// Stable callbacks — won't break React.memo on CommentInput
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
							mentionedUsers, // ← add to payload
						})
					: await workflowApi.createCreatorComment({
							epcId,
							message: text,
							mentionedUsers, // ← add to payload
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
				setMentionedUsers([]);
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
		[approvalId, isProposer, epcId, showToast, mentionedUsers],
	);

	const handleApprove = React.useCallback(async () => {
		if (!currentStage?.id) return;
		try {
			const { message } = await workflowApi.approveStage(currentStage.id);
			showToast({ type: "success", title: "Success", description: message });
			await onWorkflowUpdate();
		} catch (err) {
			showToast({
				type: "error",
				title: "Error",
				description:
					err instanceof Error ? err.message : "Error while approving",
			});
		}
	}, [currentStage, onWorkflowUpdate, showToast]); // ← use full object

	// Stable — no inline arrow passed to CommentInput
	const openClarifyModal = React.useCallback(() => {
		setIsClarifyModalOpen(true);
	}, []);
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

		if (!currentStage?.id) {
			showToast({
				type: "error",
				title: "Not allowed",
				description: "No active approval stage found",
			});
			return;
		}

		try {
			setClarifyLoading(true);

			const { data, message } = await workflowApi.clarifyStage(
				currentStage.id,
				trimmedReason,
			);

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
			showToast({
				type: "error",
				title: "Error",
				description:
					err instanceof Error
						? err.message
						: "Error while sending clarification request",
			});
		} finally {
			setClarifyLoading(false);
		}
	};

	const disabled = !currentStage || !isUserInCurrentStage;
	// const canComment = isProposer || isUserInCurrentStage;

	return (
		<>
			<Section title="Approval Flow">
				<ApprovalFlowSection stages={stages} />
			</Section>
			<Section
				title="Comment Section"
				action={
					<p className="comments-subtitle">
						{comments.length} {comments.length === 1 ? "comment" : "comments"}
					</p>
				}
			>
				<section className="comments-section mb-2">
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
								<>
									<CommentCard
										key={comment.id}
										comment={comment}
										ref={listEndRef}
									/>
								</>
							))}
						</div>
					)}
					{/* {canComment && ( */}
					<div className="comments-create light-blue-bg-header">
						<div className="comments-create-input" ref={listEndRef}>
							<CommentInput
								disabled={commentsLoading}
								onSubmit={handleCreate}
								canApprove={!disabled && isUserInCurrentStage}
								canClarify={!disabled && isUserInCurrentStage}
								onApprove={handleApprove}
								onClarify={openClarifyModal} // ← same modal, triggered from menu now
								mentionableUsers={mentionableUsers}
								onMentionInsert={handleMentionInsert}
							/>
						</div>
					</div>
					{/* )} */}
				</section>

				<Modal open={isClarifyModalOpen}>
					<div className="w-full rounded-2xl bg-white p-5 shadow-xl border border-zinc-200">
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
		</>
	);
}
