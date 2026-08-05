import { useState } from "react";
import {
	CheckCircle2,
	Circle,
	Clock,
	MessageSquare,
	XCircle,
	type LucideIcon,
} from "lucide-react";

import Button from "../../components/common/Button";
import FormHeader from "../../components/ui/FormHeader";

import type {
	ApprovalActionType,
	ApprovalStage,
	ApprovalStageStatus,
} from "./reimbursementClaim.types";

const STAGE_STYLE: Record<
	ApprovalStageStatus,
	{
		Icon: LucideIcon;
		className: string;
		label: string;
	}
> = {
	approved: {
		Icon: CheckCircle2,
		className: "bg-approved/10 text-approved",
		label: "Approved",
	},
	rejected: {
		Icon: XCircle,
		className: "bg-rejected/10 text-rejected",
		label: "Rejected",
	},
	in_review: {
		Icon: Clock,
		className: "bg-brand/10 text-brand",
		label: "In review",
	},
	clarification_requested: {
		Icon: MessageSquare,
		className: "bg-pending/10 text-pending",
		label: "Clarification requested",
	},
	pending: {
		Icon: Circle,
		className: "bg-page text-muted",
		label: "Pending",
	},
};

interface ApprovalSectionProps {
	stages: ApprovalStage[];
	/** Whether the person viewing this form is the approver for the active stage. */
	canApprove?: boolean;
	onAction?: (
		stageId: string,
		action: ApprovalActionType,
		comment: string,
	) => void | Promise<void>;
}

const ApprovalSection = ({
	stages,
	canApprove = false,
	onAction,
}: ApprovalSectionProps) => {
	const [comment, setComment] = useState("");
	const [isActing, setIsActing] = useState(false);

	const activeStage = stages.find((stage) => stage.status === "in_review");

	const act = async (action: ApprovalActionType) => {
		if (!activeStage || !onAction || isActing) return;

		setIsActing(true);

		try {
			await onAction(activeStage.id, action, comment.trim());
			setComment("");
		} finally {
			setIsActing(false);
		}
	};

	if (stages.length === 0) return null;

	return (
		<div className="flex flex-col gap-4">
			<FormHeader title="Approval Status" Icon={CheckCircle2} />

			<p className="-mt-2 text-sm leading-relaxed text-muted">
				Your claim moves through {stages.length} approval{" "}
				{stages.length === 1 ? "stage" : "stages"} in order, shown below.
			</p>

			<div className="flex flex-col">
				{stages.map((stage, index) => {
					const style = STAGE_STYLE[stage.status];
					const StageIcon = style.Icon;

					return (
						<div key={stage.id} className="flex gap-3">
							<div className="flex flex-col items-center">
								<span
									className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.className}`}
								>
									<StageIcon size={14} aria-hidden="true" />
								</span>

								{index < stages.length - 1 ? (
									<span className="my-0.5 w-px flex-1 bg-border" />
								) : null}
							</div>

							<div className="flex-1 pb-5">
								<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
									<p className="text-sm font-semibold text-iron-dark">
										<span className="text-muted">Stage {index + 1} — </span>
										{stage.stageName}
									</p>

									<span
										className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
									>
										{style.label}
									</span>
								</div>

								<p className="mt-0.5 text-sm text-muted">
									{stage.approverName}
								</p>

								{stage.comment ? (
									<p className="mt-2 rounded-md bg-page px-2.5 py-1.5 text-sm leading-relaxed text-iron">
										{stage.comment}
									</p>
								) : null}

								{stage.actedOn ? (
									<p className="mt-1 text-xs text-muted">
										Actioned on {stage.actedOn}
									</p>
								) : null}
							</div>
						</div>
					);
				})}
			</div>

			{activeStage && canApprove ? (
				<div className="rounded-lg border border-brand/30 bg-page p-4">
					<p className="mb-3 text-sm font-semibold text-iron-dark">
						Acting as {activeStage.approverName} — {activeStage.stageName}
					</p>

					<label
						htmlFor="approval-comment"
						className="mb-1 block text-xs font-medium text-secondary"
					>
						Comments
					</label>

					<textarea
						id="approval-comment"
						rows={2}
						placeholder="Optional to approve. Required to reject or request clarification."
						value={comment}
						onChange={(event) => setComment(event.target.value)}
						disabled={isActing}
						className="mb-3 w-full rounded-md border border-border bg-white px-2.5 py-1.5 text-sm text-iron-dark outline-none focus:border-brand"
					/>

					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							text="Approve"
							Icon={CheckCircle2}
							size="sm"
							appearance="standard"
							variant="brand"
							disabled={isActing}
							onClick={() => act("approve")}
						/>

						<Button
							type="button"
							text="Request Clarification"
							Icon={MessageSquare}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isActing || !comment.trim()}
							onClick={() => act("request_clarification")}
						/>

						<Button
							type="button"
							text="Reject"
							Icon={XCircle}
							size="sm"
							appearance="standard"
							variant="outline"
							disabled={isActing || !comment.trim()}
							onClick={() => act("reject")}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default ApprovalSection;
