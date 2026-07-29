import { GitFork, Paperclip, Pencil, Plus, Users } from "lucide-react";

import Button from "../../../components/common/Button";
import type {
	SaveMode,
	WorkflowFilter,
	WorkflowSummary,
} from "../types/workflow.types";

interface WorkflowFetchListProps {
	filter: WorkflowFilter;
	onFilterChange: (filter: WorkflowFilter) => void;
	createdWorkflows: WorkflowSummary[];
	assignedWorkflows: WorkflowSummary[];
	editingId: string | null;
	onToggleEdit: (id: string) => void;
	getSaveMode: (id: string) => SaveMode;
	onSetSaveMode: (id: string, mode: SaveMode) => void;
	onAttach: (workflow: WorkflowSummary) => void | Promise<void>;
	onContinueEdit: (
		workflow: WorkflowSummary,
		saveMode: SaveMode,
	) => void | Promise<void>;
	disabled?: boolean;
	loading?: boolean;
}

export function WorkflowFetchList({
	filter,
	onFilterChange,
	createdWorkflows,
	assignedWorkflows,
	editingId,
	onToggleEdit,
	getSaveMode,
	onSetSaveMode,
	onAttach,
	onContinueEdit,
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
					{workflows.map((workflow) => {
						const isEditing = editingId === workflow.id;
						const saveMode = getSaveMode(workflow.id);

						return (
							<section className="workflow-fetch-item" key={workflow.id}>
								<div className="workflow-fetch-row">
									<div className="workflow-fetch-row-main">
										<div
											className="workflow-fetch-item-icon"
											aria-hidden="true"
										>
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
											onClick={() => onToggleEdit(workflow.id)}
											disabled={disabled}
											aria-expanded={isEditing}
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

								{isEditing ? (
									<div className="workflow-customise-panel">
										<div>
											<p className="workflow-customise-title">
												How should your customised version be used?
											</p>
											<p className="workflow-customise-copy">
												The original workflow will remain unchanged.
											</p>
										</div>
										<div className="workflow-save-options">
											<label
												className={
													saveMode === "once"
														? "workflow-save-option workflow-save-option--active"
														: "workflow-save-option"
												}
											>
												<input
													type="radio"
													name={`save-mode-${workflow.id}`}
													checked={saveMode === "once"}
													onChange={() => onSetSaveMode(workflow.id, "once")}
												/>
												<span>
													<strong>Use once</strong>
													<small>Only for this form</small>
												</span>
											</label>
											<label
												className={
													saveMode === "template"
														? "workflow-save-option workflow-save-option--active"
														: "workflow-save-option"
												}
											>
												<input
													type="radio"
													name={`save-mode-${workflow.id}`}
													checked={saveMode === "template"}
													onChange={() =>
														onSetSaveMode(workflow.id, "template")
													}
												/>
												<span>
													<strong>Save as template</strong>
													<small>Reuse in other forms</small>
												</span>
											</label>
										</div>
										<Button
											type="button"
											onClick={() => onContinueEdit(workflow, saveMode)}
											disabled={disabled}
										>
											Continue
										</Button>
									</div>
								) : null}
							</section>
						);
					})}
				</div>
			)}
		</div>
	);
}
