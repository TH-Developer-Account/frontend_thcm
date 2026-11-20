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

/**
 * One workflow can hold two parts, WF1 and WF2 (CPP: plant / SCM chain, then the
 * committee). Stages are tagged in their NAME ("WF2 · ..."), so no schema change is
 * needed. Workflows without tags render as a single table, exactly as before.
 */
const WORKFLOW_PART_TITLES: Record<string, string> = {
	WF1: "WF1 · Plant / SCM approval",
	WF2: "WF2 · CPP committee approval",
};
const PART_PREFIX = /^(WF[12])\s*·\s*/;

type WorkflowPart = { key: string; title?: string; stages: WorkflowStage[] };

const splitIntoParts = (stages: WorkflowStage[]): WorkflowPart[] => {
	const tagged = stages.some((stage) => PART_PREFIX.test(stage.name ?? ""));
	if (!tagged) return [{ key: "all", stages }];

	const parts = new Map<string, WorkflowStage[]>();
	for (const stage of stages) {
		const match = PART_PREFIX.exec(stage.name ?? "");
		const key = match?.[1] ?? "WF1";
		const bare = match ? stage.name.replace(PART_PREFIX, "") : stage.name;
		parts.set(key, [...(parts.get(key) ?? []), { ...stage, name: bare }]);
	}
	return [...parts.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([key, list]) => ({
			key,
			title: WORKFLOW_PART_TITLES[key] ?? key,
			stages: list,
		}));
};

const joinClassNames = (
	...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(" ");

type DetailItemProps = {
	label: string;
	children: ReactNode;
	/** Native tooltip for truncated text values. */
	title?: string;
	className?: string;
	/** Long free text: wraps and keeps line breaks instead of truncating. */
	multiline?: boolean;
};

const DetailItem = ({
	label,
	children,
	title,
	className,
	multiline = false,
}: DetailItemProps) => (
	<div className={joinClassNames("min-w-0", className)}>
		<dt className="text-xs text-slate-500">{label}</dt>
		<dd
			className={joinClassNames(
				"mt-0.5 text-sm font-medium text-slate-800",
				multiline ? "whitespace-pre-line break-words" : "truncate",
			)}
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

	const parts = useMemo(
		() =>
			splitIntoParts(stages).map((part) => ({
				...part,
				rows: mapWorkflowStagesToApprovalRows(
					part.stages.filter((stage) => stage.approvers?.length > 0),
					{ showOnlyCurrentStageStatus: false },
				),
			})),
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
	const description = basics.description?.trim();

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

					{/* Full width, wraps: CPP templates carry a long description
					    (type, conditions, who approves). */}
					<DetailItem label="Description" multiline className="col-span-full">
						{description || "—"}
					</DetailItem>
				</dl>
			) : null}

			{/* WF1 and WF2 one below the other; a plain workflow is one table. */}
			<div className="flex flex-col gap-6">
				{parts.map((part) => (
					<section key={part.key} aria-label={part.title}>
						{part.title ? (
							<h3 className="mb-2 text-sm font-semibold text-slate-700">
								{part.title}
							</h3>
						) : null}
						<ApprovalTable
							data={part.rows}
							hiddenColumns={[...HIDDEN_DRAFT_COLUMNS]}
							emptyTitle={emptyTitle}
							emptyDescription={emptyDescription}
						/>
					</section>
				))}
			</div>
		</>
	);
};

export default WorkflowViewForm;
