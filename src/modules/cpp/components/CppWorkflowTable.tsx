// components/CppWorkflowTable.tsx — CPP approval workflow, one row per approver.
// Columns: Stage · Approver (avatar, name, email) · Status.
// Built here, not in the shared ApprovalTable, so other modules keep their columns.
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

/** One line per approver. The stage name is shown on the first line of its group only. */
const toLines = (stages: ApprovalStageLike[]): WorkflowLine[] => {
	const rows = mapWorkflowStagesToApprovalRows(stages, {
		showOnlyCurrentStageStatus: true,
	});
	const names = namesByEmail(stages);
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
			};
			return line;
		});
	});
};

type CppWorkflowTableProps = {
	stages: ApprovalStageLike[];
};

const CppWorkflowTable = ({ stages }: CppWorkflowTableProps) => {
	const lines = useMemo(() => toLines(stages), [stages]);

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
						render: (line) =>
							line.isFirstInStage ? (
								<span className="cpp-wf-stage">
									<span className="cpp-wf-stage-no">{line.stageOrder}</span>
									{line.stageName}
								</span>
							) : null,
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
