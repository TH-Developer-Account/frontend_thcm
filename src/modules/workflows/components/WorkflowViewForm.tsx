import { useMemo, type ReactNode } from "react";

import { Badge } from "../../../components/common/Badge";
import type { WorkflowBasics, WorkflowStage } from "../types/types";
import { mapWorkflowStagesToApprovalRows } from "../utils/approvalWorkflow.mapper";
import { ApprovalTable } from "./ApprovalTable";

type WorkflowViewFormProps = {
	basics: WorkflowBasics;
	stages: WorkflowStage[];
	/**
	 * "review" — step 3 of create/edit (default). Table only; the sidebar
	 *            already shows the basics.
	 * "view"   — read-only View modal from the workflow table. Adds a
	 *            compact details grid, since there's no sidebar there.
	 */
	mode?: "review" | "view";
};

const HIDDEN_DRAFT_COLUMNS = ["status"] as const;

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

type DetailItemProps = {
	label: string;
	children: ReactNode;
	/** Native tooltip for truncated text values. */
	title?: string;
	className?: string;
};

const DetailItem = ({ label, children, title, className }: DetailItemProps) => (
	<div className={joinClassNames("min-w-0", className)}>
		<dt className="text-xs text-slate-500">{label}</dt>
		<dd
			className="mt-0.5 truncate text-sm font-medium text-slate-800"
			title={title}
		>
			{children}
		</dd>
	</div>
);

const WorkflowViewForm = ({
	basics,
	stages,
	mode = "review",
}: WorkflowViewFormProps) => {
	const isViewMode = mode === "view";

	const approvalRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(
				stages.filter((stage) => stage.approvers?.length > 0),
				{ showOnlyCurrentStageStatus: false },
			),
		[stages],
	);

	const { totalApprovers, minApprovers } = useMemo(
		() =>
			stages.reduce(
				(acc, stage) => {
					const count = stage.approvers?.length ?? 0;
					acc.totalApprovers += count;
					acc.minApprovers += Math.min(Number(stage.minApprovals) || 0, count);
					return acc;
				},
				{ totalApprovers: 0, minApprovers: 0 },
			),
		[stages],
	);

	const hasStages = stages.length > 0;

	const emptyTitle = hasStages ? "No approvers added" : "No stages added yet";
	const emptyDescription = isViewMode
		? hasStages
			? "This workflow's stages don't have any approvers."
			: "This workflow doesn't have any approval stages."
		: hasStages
			? "Go back to the previous step to add approvers."
			: "Add stages in the previous step to see them here.";

	return (
		<>
			{isViewMode ? (
				// Up to 4 columns: the 6–7 short fields fill 2 rows, and the
				// optional description takes a 3rd, clamped to 2 lines.
				<dl className="mb-4 grid grid-cols-2 gap-x-6 gap-y-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-3 lg:grid-cols-5">
					<DetailItem label="App" title={basics.appDesc}>
						{basics.appDesc || "—"}
					</DetailItem>

					{basics.category ? (
						<DetailItem label="Category" title={basics.category}>
							{basics.category}
						</DetailItem>
					) : null}

					<DetailItem label="Status">
						<Badge variant={basics.isActive ? "active" : "inactive"}>
							{basics.isActive ? "Active" : "Inactive"}
						</Badge>
					</DetailItem>

					<DetailItem label="Stages">{stages.length}</DetailItem>

					<DetailItem label="Minimum approvers">{minApprovers}</DetailItem>

					<DetailItem label="Total approvers">{totalApprovers}</DetailItem>
				</dl>
			) : null}

			<ApprovalTable
				data={approvalRows}
				hiddenColumns={[...HIDDEN_DRAFT_COLUMNS]}
				emptyTitle={emptyTitle}
				emptyDescription={emptyDescription}
			/>
		</>
	);
};

export default WorkflowViewForm;
