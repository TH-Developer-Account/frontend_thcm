// components/CppWorkflowTable.tsx — CPP approval workflow, one row per approver.
// Columns: Stage · Approver (avatar, name, email) · Status.
// Built here, not in the shared ApprovalTable, so other modules keep their columns.
// The stage the request is waiting on is highlighted (whole rows + "Pending here"
// tag). SimpleViewTable has no row class, so each line carries a hidden marker and
// cpp.compact.css styles `tr:has(.cpp-wf-pending-marker)`.
import { useMemo } from "react";

import { Badge } from "../../../components/common/Badge";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import type { ApprovalStageLike } from "../../workflows";
import { mapWorkflowStagesToApprovalRows } from "../../workflows/utils/approvalWorkflow.mapper";

const EMPTY = "--";
const AVATAR_TONES = 4;

type WorkflowLine = {
	key: string;
	stageOrder: string;
	stageName: string;
	isFirstInStage: boolean;
	tone: number;
	name: string;
	email: string;
	status: string | null;
	strategy?: string | null;
	/** The stage the request is currently waiting on. */
	isPending: boolean;
};

/** Raw approver shape from the workflow API: first_name and last_name, not a single name. */
type RawApprover = {
	first_name?: string | null;
	last_name?: string | null;
	email?: string | null;
};

/** Full name from first and last name, or the fallback when both are empty. */
const fullNameOf = (
	approver: RawApprover | null | undefined,
	fallback: string,
) => {
	const joined = [approver?.first_name, approver?.last_name]
		.map((part) => (part ?? "").trim())
		.filter(Boolean)
		.join(" ");
	return joined || fallback;
};

/** Email to full name, read from the raw stage approvals. */
const namesByEmail = (stages: ApprovalStageLike[]): Map<string, string> => {
	const names = new Map<string, string>();
	for (const stage of stages) {
		const approvals =
			(stage as { approvals?: { approver?: RawApprover | null }[] })
				.approvals ?? [];
		for (const approval of approvals) {
			const approver = approval.approver;
			const email = (approver?.email ?? "").trim().toLowerCase();
			if (!email) continue;
			const name = fullNameOf(approver, "");
			if (name) names.set(email, name);
		}
	}
	return names;
};

/** Up to two initials from the approver's name. */
const initialsOf = (name: string): string => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0 || name === EMPTY) return EMPTY;
	return parts
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");
};

type StageState = {
	id?: string | number;
	stageOrder?: number;
	status?: string | null;
	isCurrentIteration?: boolean | null;
};

/** Stage orders the request is waiting on: the running stage(s) of this iteration. */
const pendingStageOrders = (
	stages: ApprovalStageLike[],
	currentStageId?: string | null,
): Set<string> => {
	const orders = new Set<string>();
	for (const raw of stages as unknown as StageState[]) {
		const running =
			String(raw.status ?? "").toUpperCase() === "IN_PROGRESS" &&
			raw.isCurrentIteration !== false;
		const isCurrent =
			currentStageId != null && String(raw.id) === String(currentStageId);
		if (running || isCurrent) orders.add(String(raw.stageOrder ?? ""));
	}
	return orders;
};

/** One line per approver. The stage name is shown on the first line of its group only. */
const toLines = (
	stages: ApprovalStageLike[],
	currentStageId?: string | null,
): WorkflowLine[] => {
	const rows = mapWorkflowStagesToApprovalRows(stages, {
		showOnlyCurrentStageStatus: true,
	});
	const names = namesByEmail(stages);
	const pending = pendingStageOrders(stages, currentStageId);
	const nameFor = (email: string | null | undefined, fallback: string) => {
		const key = (email ?? "").trim().toLowerCase();
		return (key && names.get(key)) || fallback || EMPTY;
	};

	let tone = 0;
	return rows.flatMap((row) => {
		const stageOrder = String(row.stageOrder ?? EMPTY);
		const stageName = row.stageName || EMPTY;
		const strategy = row.strategy || EMPTY;
		const approvers = row.approvers ?? [];
		const isPending = pending.has(stageOrder);

		if (approvers.length === 0) {
			const line: WorkflowLine = {
				key: String(row.id),
				stageOrder,
				stageName,
				isFirstInStage: true,
				tone: tone++ % AVATAR_TONES,
				name: nameFor(row.email, row.name ?? ""),
				email: row.email || EMPTY,
				status: row.status ?? null,
				strategy: strategy ?? null,
				isPending,
			};
			return [line];
		}

		return approvers.map((approver, index) => {
			const line: WorkflowLine = {
				key: `${row.id}-${approver.id}`,
				stageOrder,
				stageName,
				isFirstInStage: index === 0,
				tone: tone++ % AVATAR_TONES,
				name: nameFor(approver.email, approver.name ?? ""),
				email: approver.email || EMPTY,
				status: approver.status ?? null,
				strategy: strategy ?? null,
				isPending,
			};
			return line;
		});
	});
};

type CppWorkflowTableProps = {
	stages: ApprovalStageLike[];
	/** Stage the workflow says is current (highlighted even if its status lags). */
	currentStageId?: string | null;
};

const CppWorkflowTable = ({ stages, currentStageId }: CppWorkflowTableProps) => {
	const lines = useMemo(
		() => toLines(stages, currentStageId),
		[stages, currentStageId],
	);

	return (
		<div className="cpp-workflow-table">
			<SimpleViewTable<WorkflowLine>
				data={lines}
				getRowId={(line) => line.key}
				maxHeight="none"
				ariaLabel="Approval workflow approvers"
				emptyTitle="No approval stages"
				emptyDescription="Approvers appear here once the workflow is assigned."
				columns={[
					{
						key: "stage",
						header: "Stage",
						widthUnits: 3,
						minWidth: 180,
						render: (line) => (
							<>
								{line.isPending ? (
									<span className="cpp-wf-pending-marker" aria-hidden="true" />
								) : null}
								{line.isFirstInStage ? (
									<span className="cpp-wf-stage">
										<span className="cpp-wf-stage-no">{line.stageOrder}</span>
										<span className="cpp-wf-stage-text">
											{line.stageName}
											{line.isPending ? (
												<span className="cpp-wf-pending-tag">Pending here</span>
											) : null}
										</span>
									</span>
								) : null}
							</>
						),
					},
					{
						key: "approver",
						header: "Approver",
						widthUnits: 4,
						minWidth: 180,
						render: (line) => (
							<div className="cpp-wf-approver">
								<span
									className={`cpp-wf-avatar cpp-wf-avatar-${line.tone}`}
									aria-hidden="true"
								>
									{initialsOf(line.name)}
								</span>
								<div className="cpp-wf-approver-text">
									<span className="cpp-wf-name">{line.name}</span>
									{line.email !== EMPTY ? (
										<a className="cpp-wf-email" href={`mailto:${line.email}`}>
											{line.email}
										</a>
									) : null}
								</div>
							</div>
						),
					},
					{
						key: "status",
						header: "Status",
						widthUnits: 1,
						minWidth: 120,
						render: (line) =>
							line.status ? (
								<Badge status={line.status} />
							) : (
								<span className="cpp-wf-empty">{EMPTY}</span>
							),
					},
					{
						key: "strategy",
						header: "Strategy",
						widthUnits: 1,
						render: (line) =>
							line.strategy ? (
								<Badge status={line.strategy} />
							) : (
								<span className="cpp-wf-empty">{EMPTY}</span>
							),
					},
				]}
			/>
		</div>
	);
};

export default CppWorkflowTable;
