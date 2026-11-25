// WorkflowStageList — who approves what, in which order, and where the
// request is now.
//
// Display only. The module maps its own workflow data to these props; this
// component never derives an overall request status, never decides who may
// act, and never changes approval strategies. It only shows what it is given,
// plus a summary line read straight from those props ("Stage 2 of 4 ·
// Waiting for Priya N, Arun K").
import { Fragment, type ComponentType, type SVGProps } from "react";
import {
	AlertTriangle,
	Check,
	CheckCircle2,
	Circle,
	Clock,
	MessageSquareText,
	MinusCircle,
	XCircle,
} from "lucide-react";

export type WorkflowStageStatus =
	| "completed"
	| "current"
	| "pending"
	| "rejected"
	| "clarification"
	| "skipped";

export type WorkflowApproverStatus =
	| "approved"
	| "recommended"
	| "rejected"
	| "clarification"
	| "pending"
	| "waiting"
	| "skipped";

export type WorkflowApproverItem = {
	id: string;
	name: string;
	/** Role or designation, e.g. "Plant Head, KGP". */
	role?: string;
	status: WorkflowApproverStatus;
	/** Already formatted, e.g. "24 Nov 2026, 10:42 am". */
	actedAt?: string;
	remarks?: string;
	/** Approver from outside the organisation. */
	external?: boolean;
	/** The signed-in user. Combined with "pending" this shows "Your action is needed". */
	isCurrentUser?: boolean;
};

export type WorkflowStageItem = {
	id: string;
	name: string;
	status: WorkflowStageStatus;
	/** How approvers in this stage decide. Shown as a chip. */
	strategy?: "sequential" | "parallel" | "any";
	/** Overrides the default strategy wording. */
	strategyLabel?: string;
	description?: string;
	approvers: WorkflowApproverItem[];
};

type WorkflowStageListProps = {
	stages: readonly WorkflowStageItem[];
	ariaLabel?: string;
	/** Hide the "Stage 2 of 4 · Waiting for …" line. */
	hideSummary?: boolean;
	className?: string;
};

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const STAGE_META: Record<WorkflowStageStatus, { text: string; Icon: IconType | null }> = {
	completed: { text: "Completed", Icon: Check },
	current: { text: "In progress", Icon: null },
	pending: { text: "Not started", Icon: null },
	rejected: { text: "Rejected", Icon: XCircle },
	clarification: { text: "Clarification requested", Icon: AlertTriangle },
	skipped: { text: "Skipped", Icon: MinusCircle },
};

const APPROVER_META: Record<
	WorkflowApproverStatus,
	{ text: string; Icon: IconType; tone: string }
> = {
	approved: { text: "Approved", Icon: CheckCircle2, tone: "success" },
	recommended: { text: "Recommended", Icon: CheckCircle2, tone: "success" },
	rejected: { text: "Rejected", Icon: XCircle, tone: "danger" },
	clarification: { text: "Asked for clarification", Icon: AlertTriangle, tone: "warning" },
	pending: { text: "Pending", Icon: Clock, tone: "pending" },
	waiting: { text: "Not yet reached", Icon: Circle, tone: "muted" },
	skipped: { text: "Skipped", Icon: MinusCircle, tone: "muted" },
};

const STRATEGY_TEXT = {
	sequential: "One after another",
	parallel: "All approve, in any order",
	any: "Any one approves",
} as const;

const initials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

export function WorkflowStageList({
	stages,
	ariaLabel = "Approval workflow",
	hideSummary = false,
	className,
}: WorkflowStageListProps) {
	const currentIndex = stages.findIndex(
		(stage) => stage.status === "current" || stage.status === "clarification",
	);
	const current = currentIndex >= 0 ? stages[currentIndex] : undefined;
	const waitingFor =
		current?.approvers.filter((approver) => approver.status === "pending") ?? [];
	const youMustAct = waitingFor.some((approver) => approver.isCurrentUser);

	return (
		<div className={joinClassNames("wf-stages", className)}>
			{!hideSummary && current ? (
				<p className="wf-stages-summary">
					<span className="wf-stages-summary-count">
						Stage {currentIndex + 1} of {stages.length}
					</span>
					<span className="wf-stages-summary-text">
						{waitingFor.length > 0 ? (
							<>
								Waiting for{" "}
								{waitingFor.map((approver, index) => (
									<Fragment key={approver.id}>
										{index > 0 ? ", " : null}
										<strong>{approver.isCurrentUser ? "you" : approver.name}</strong>
									</Fragment>
								))}
							</>
						) : (
							current.name
						)}
					</span>
					{youMustAct ? (
						<span className="wf-stages-you">Your action is needed</span>
					) : null}
				</p>
			) : null}

			<ol className="wf-stage-list" aria-label={ariaLabel}>
				{stages.map((stage, index) => {
					const meta = STAGE_META[stage.status];
					const isCurrent = stage === current;
					const strategy =
						stage.strategyLabel ?? (stage.strategy ? STRATEGY_TEXT[stage.strategy] : null);

					return (
						<li
							key={stage.id}
							className={joinClassNames("wf-stage", `wf-stage-${stage.status}`)}
							aria-current={isCurrent ? "step" : undefined}
						>
							<span className="wf-stage-marker" aria-hidden="true">
								{meta.Icon ? <meta.Icon /> : <span>{index + 1}</span>}
							</span>

							<div className="wf-stage-body">
								<div className="wf-stage-head">
									<h4 className="wf-stage-name">{stage.name}</h4>
									<span className="wf-stage-status">{meta.text}</span>
									{strategy ? <span className="wf-stage-strategy">{strategy}</span> : null}
								</div>

								{stage.description ? (
									<p className="wf-stage-description">{stage.description}</p>
								) : null}

								{stage.approvers.length > 0 ? (
									<ul className="wf-approvers">
										{stage.approvers.map((approver) => {
											const approverMeta = APPROVER_META[approver.status];
											const actionNeeded =
												approver.isCurrentUser && approver.status === "pending";

											return (
												<li
													key={approver.id}
													className={joinClassNames(
														"wf-approver",
														`wf-approver-${approverMeta.tone}`,
														actionNeeded && "is-action-needed",
													)}
												>
													<span className="wf-approver-avatar" aria-hidden="true">
														{initials(approver.name)}
													</span>

													<div className="wf-approver-main">
														<div className="wf-approver-line">
															<span className="wf-approver-name">{approver.name}</span>
															{approver.isCurrentUser ? (
																<span className="wf-tag wf-tag-you">You</span>
															) : null}
															{approver.external ? (
																<span className="wf-tag">External</span>
															) : null}
														</div>
														{approver.role ? (
															<span className="wf-approver-role">{approver.role}</span>
														) : null}
														{approver.remarks ? (
															<p className="wf-approver-remarks">
																<MessageSquareText aria-hidden="true" />
																<span>{approver.remarks}</span>
															</p>
														) : null}
													</div>

													<div className="wf-approver-state">
														<span className="wf-approver-status">
															<approverMeta.Icon aria-hidden="true" />
															{actionNeeded ? "Your action is needed" : approverMeta.text}
														</span>
														{approver.actedAt ? (
															<span className="wf-approver-time">{approver.actedAt}</span>
														) : null}
													</div>
												</li>
											);
										})}
									</ul>
								) : null}
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}

export default WorkflowStageList;
