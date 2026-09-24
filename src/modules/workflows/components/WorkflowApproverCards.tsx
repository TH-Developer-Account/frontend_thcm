import Avatar from "../../../components/common/Avatar";
import Button from "../../../components/common/Button";
import Popover from "../../../components/common/Popover";
import type { SimpleTableColumn } from "../../../components/ui/tables/SimpleViewTable";
import SimpleViewTable from "../../../components/ui/tables/SimpleViewTable";
import type { WorkflowApprover, WorkflowStage } from "../types/types";
import { getStrategyLabel } from "../utils/strategy";
import { getFullName } from "../utils/user";

type Props = {
	stages: WorkflowStage[];
	title?: string;
};

const VISIBLE_AVATAR_COUNT = 3;

const getMinimumApprovals = (stage: WorkflowStage): number => {
	const totalApprovers = stage.approvers.length;

	if (stage.strategy === "ALL") return totalApprovers;
	if (stage.strategy === "SOME") {
		return Math.max(1, Number(stage.minApprovals) || 1);
	}

	return totalApprovers > 0 ? 1 : 0;
};

/* -------------------------------------------------------------------------- */
/* Avatar group + "+N" popover (same UI as the profile table)                 */
/* -------------------------------------------------------------------------- */

const renderApproverAvatars = (
	approvers: WorkflowApprover[],
	popoverTitle: string,
) => {
	if (!approvers.length) {
		return <span className="profile-users-empty">--</span>;
	}

	const visibleApprovers = approvers.slice(0, VISIBLE_AVATAR_COUNT);
	const remainingCount = approvers.length - visibleApprovers.length;

	return (
		<div className="profile-users-cell">
			<div
				className="profile-avatar-group"
				aria-label={`${approvers.length} ${popoverTitle.toLowerCase()}`}
			>
				{visibleApprovers.map((approver) => (
					<Avatar
						key={approver.id}
						size="sm"
						firstName={approver.user.firstName}
						lastName={approver.user.lastName}
						className="profile-user-avatar"
						isTooltip
					/>
				))}
			</div>

			{remainingCount > 0 ? (
				<Popover
					placement="bottom-start"
					trigger={
						<Button
							type="button"
							text={`+${remainingCount}`}
							appearance="filter"
							variant="secondary"
							size="sm"
							aria-label={`View ${remainingCount} more ${popoverTitle.toLowerCase()}`}
							className="profile-more-users-button"
						/>
					}
				>
					<div className="profile-users-popover">
						<p className="profile-users-popover-title">{popoverTitle}</p>

						<ul className="profile-users-popover-list">
							{approvers.map((approver) => (
								<li key={approver.id} className="profile-users-popover-item">
									<Avatar
										size="sm"
										firstName={approver.user.firstName}
										lastName={approver.user.lastName}
										isTooltip={false}
									/>

									<span>{getFullName(approver.user, "Unnamed user")}</span>
								</li>
							))}
						</ul>
					</div>
				</Popover>
			) : null}
		</div>
	);
};

/* -------------------------------------------------------------------------- */
/* Columns                                                                    */
/* -------------------------------------------------------------------------- */

const columns: SimpleTableColumn<WorkflowStage>[] = [
	{
		key: "name",
		header: "Stage Name",
		widthUnits: 2,
		minWidth: 120,
		render: (stage) => (
			<span className="font-semibold text-slate-800">{stage.name || "--"}</span>
		),
	},
	{
		key: "strategy",
		header: "Strategy",
		widthUnits: 2,
		minWidth: 110,
		render: (stage) => (
			<span className="workflow-create-badge">
				{getStrategyLabel(stage.strategy, stage.approvers.length)}
			</span>
		),
	},
	{
		key: "min",
		header: "Min",
		align: "center",
		minWidth: 64,
		render: (stage) => getMinimumApprovals(stage),
	},
	{
		key: "total",
		header: "Total",
		align: "center",
		minWidth: 64,
		render: (stage) => stage.approvers.length,
	},
	{
		key: "external",
		header: "External Approvers",
		widthUnits: 2,
		minWidth: 160,
		render: (stage) =>
			renderApproverAvatars(
				stage.approvers.filter((approver) => approver.isExternalApprover),
				"External approvers",
			),
	},
	{
		key: "approvers",
		header: "Approvers",
		widthUnits: 2,
		minWidth: 160,
		render: (stage) => renderApproverAvatars(stage.approvers, "Approvers"),
	},
];

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const WorkflowApproverCards = ({ stages, title }: Props) => {
	const configuredStages = stages.filter(
		(stage) => stage.approvers?.length > 0,
	);

	const hasStages = stages.length > 0;

	return (
		<SimpleViewTable
			title={title}
			data={configuredStages}
			columns={columns}
			getRowId={(stage) => stage.id}
			ariaLabel="Workflow approval stages"
			emptyTitle={hasStages ? "No approvers added" : "No stages added yet"}
			emptyDescription={
				hasStages
					? "Go back to the previous step to add approvers."
					: "Add stages in the previous step to see them here."
			}
		/>
	);
};

export default WorkflowApproverCards;
