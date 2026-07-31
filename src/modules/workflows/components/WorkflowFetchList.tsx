import { GitFork, Paperclip, Pencil, Plus, Users } from "lucide-react";

import Button from "../../../components/common/Button";
import type { WorkflowFilter, WorkflowSummary } from "../types/types";

interface WorkflowFetchListProps {
	filter: WorkflowFilter;
	onFilterChange: (filter: WorkflowFilter) => void;
	createdWorkflows: WorkflowSummary[];
	assignedWorkflows: WorkflowSummary[];
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onCustomise: (workflow: WorkflowSummary) => void | Promise<void>;
	disabled?: boolean;
	loading?: boolean;
}

export function WorkflowFetchList({
	filter,
	onFilterChange,
	createdWorkflows,
	assignedWorkflows,
	onAttach,
	onCustomise,
	disabled = false,
	loading = false,
}: WorkflowFetchListProps) {
	const workflows = filter === "created" ? createdWorkflows : assignedWorkflows;

	return (
		<div className="workflow-fetch-panel">
			<div className="workflow-filter-tabs" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={filter === "created"}
					className={`workflow-filter-tab${
						filter === "created" ? " workflow-filter-tab--active" : ""
					}`}
					onClick={() => onFilterChange("created")}
				>
					Created by me <span>{createdWorkflows.length}</span>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={filter === "assigned"}
					className={`workflow-filter-tab${
						filter === "assigned" ? " workflow-filter-tab--active" : ""
					}`}
					onClick={() => onFilterChange("assigned")}
				>
					Assigned to me <span>{assignedWorkflows.length}</span>
				</button>
			</div>

			{loading ? (
				<div className="workflow-fetch-empty" role="status">
					Loading workflows…
				</div>
			) : workflows.length === 0 ? (
				<div className="workflow-fetch-empty">
					<GitFork size={20} aria-hidden="true" />
					<p>No workflows are available in this section.</p>
				</div>
			) : (
				<div className="workflow-fetch-list">
					{workflows.map((workflow) => (
						<section className="workflow-fetch-item" key={workflow.id}>
							<div className="workflow-fetch-row">
								<div className="workflow-fetch-row-main">
									<div className="workflow-fetch-item-icon" aria-hidden="true">
										<GitFork size={16} />
									</div>
									<div className="workflow-fetch-copy">
										<h4>{workflow.name}</h4>
										<p>
											<span>
												<Plus size={12} /> {workflow.stageCount} stage
												{workflow.stageCount === 1 ? "" : "s"}
											</span>
											<span>
												<Users size={12} />{" "}
												{workflow.flowType === "SEQUENTIAL"
													? "Sequential"
													: "Parallel"}
											</span>
										</p>
									</div>
								</div>
								<div className="workflow-fetch-actions">
									<Button
										type="button"
										appearance="standard"
										variant="outline"
										onClick={() => onCustomise(workflow)}
										disabled={disabled}
										Icon={Pencil}
										text="Customise"
									/>
									<Button
										type="button"
										onClick={() => onAttach(workflow)}
										disabled={disabled}
										Icon={Paperclip}
										text="Attach"
										appearance="standard"
										variant="outline"
									/>
								</div>
							</div>
						</section>
					))}
				</div>
			)}
		</div>
	);
}
