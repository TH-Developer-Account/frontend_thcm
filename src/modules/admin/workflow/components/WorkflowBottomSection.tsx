import React from "react";
import { ChevronRight } from "lucide-react";
import type { WorkflowFilterKey, WorkflowItem } from "../utils/workflow.types";
import { statusClassMap } from "../utils/workflow.data";

type WorkflowBottomSectionProps = {
	activeFilter: WorkflowFilterKey;
	items: WorkflowItem[];
	onViewWorkflow?: (item: WorkflowItem) => void;
};

const filterLabelMap: Record<WorkflowFilterKey, string> = {
	all: "Total Workflows",
	mine: "My Workflows",
	draft: "Drafts",
	active: "Active",
	pending: "Pending Approval",
};

const WorkflowBottomSection = ({
	activeFilter,
	items,
	onViewWorkflow,
}: WorkflowBottomSectionProps) => {
	return (
		<section className="workflow-section">
			<div className="workflow-list-header">
				<div>
					<h3 className="workflow-list-title">
						{filterLabelMap[activeFilter]}
					</h3>
					<p className="workflow-list-subtitle">
						Showing {items.length} workflow{items.length === 1 ? "" : "s"} in
						this section.
					</p>
				</div>

				<div className="workflow-list-note">
					Click a row to open workflow details or continue editing.
				</div>
			</div>

			<div className="workflow-table-wrap">
				<table className="workflow-table">
					<thead className="workflow-table-head">
						<tr>
							<th>Workflow</th>
							<th>Module</th>
							<th>Owner</th>
							<th>Stages</th>
							<th>Status</th>
							<th>Last Updated</th>
							<th className="workflow-table-action-head">Action</th>
						</tr>
					</thead>

					<tbody>
						{items.length > 0 ? (
							items.map((item) => (
								<tr key={item.id} className="workflow-table-row">
									<td className="workflow-table-cell">
										<div>
											<p className="workflow-name">{item.name}</p>
											<p className="workflow-id">{item.id}</p>
										</div>
									</td>

									<td className="workflow-table-cell-text">{item.module}</td>
									<td className="workflow-table-cell-text">{item.owner}</td>
									<td className="workflow-table-cell-text">{item.stages}</td>

									<td className="workflow-table-cell">
										<span
											className={`workflow-status-badge ${statusClassMap[item.status]}`}
										>
											{item.status}
										</span>
									</td>

									<td className="workflow-table-cell-text">
										{item.lastUpdated}
									</td>

									<td className="workflow-table-cell-action">
										<button
											type="button"
											className="workflow-view-btn"
											onClick={() => onViewWorkflow?.(item)}
										>
											View
											<ChevronRight size={14} />
										</button>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={7} className="workflow-empty-state">
									No workflows found for this view.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</section>
	);
};

export default WorkflowBottomSection;
