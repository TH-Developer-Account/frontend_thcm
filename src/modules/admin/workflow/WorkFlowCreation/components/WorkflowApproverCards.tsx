import type { WorkflowStage } from "../../types/workflow.types";

type Props = {
	stages: WorkflowStage[];
	title?: string;
};

const WorkflowApproverCards = ({ stages }: Props) => {
	return (
		<div className="workflow-approval-table">
			<table className="workflow-approval-table-inner">
				<thead>
					<tr>
						<th className="workflow-approval-th">Stage Name</th>
						<th className="workflow-approval-th">Strategy</th>
						<th className="workflow-approval-th">Approvers</th>
					</tr>
				</thead>

				<tbody>
					{stages.length === 0 ? (
						<tr className="workflow-approval-row">
							<td
								className="workflow-approval-td workflow-approval-name text-center"
								colSpan={3}
							>
								No stages added yet.
							</td>
						</tr>
					) : stages.some((stage) => stage.approvers?.length > 0) ? (
						stages
							.filter((stage) => stage.approvers?.length > 0)
							.map((stage) => {
								const approverNames = stage.approvers
									.map((approver) =>
										`${approver.user.first_name} ${approver.user.last_name}`.trim(),
									)
									.join(", ");

								return (
									<tr className="workflow-approval-row" key={stage.id}>
										<td className="workflow-approval-td workflow-approval-name">
											{stage.name}
										</td>

										<td className="workflow-approval-td">
											<span className="workflow-create-badge">
												{stage.approvers.length > 1 ? "Parallel" : "Sequential"}
											</span>
										</td>

										<td className="workflow-approval-td workflow-approval-approvers">
											{approverNames}
										</td>
									</tr>
								);
							})
					) : (
						<tr className="workflow-approval-row">
							<td
								className="workflow-approval-td workflow-approval-name text-center"
								colSpan={3}
							>
								No Approvers added, Navigate to the{" "}
								<strong>Previous page</strong> to add.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default WorkflowApproverCards;
