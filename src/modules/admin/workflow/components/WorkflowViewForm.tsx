import type { WorkflowBasics, WorkflowStage } from "../types/workflow.types";
import WorkflowApproverCards from "./WorkflowApproverCards";

type ViewValues = {
	status: "active" | "inactive";
};

type WorkflowViewFormProps = {
	basics: WorkflowBasics;
	values: ViewValues;
	stages: WorkflowStage[];
	noOfStages?: string;
	noOfApprovers?: string;
	noOfApprovernneded?: string;
};

const WorkflowViewForm = ({
	basics,
	values,
	stages,
}: WorkflowViewFormProps) => {
	console.log("Stagesss ======>", stages);
	return (
		<>
			<div className="workflow-create-field-row workflow-create-field-row-2 gap-6">
				<div className="workflow-summary-list">
					<div className="workflow-summary-item">
						<label className="workflow-summary-key">Workflow name</label>
						<div className="workflow-summary-value">{basics.name || "--"}</div>
					</div>
					<div className="workflow-summary-item">
						<label className="workflow-summary-key">Status</label>
						<div className="workflow-summary-value">
							{values.status === "active" ? "Active" : "Inactive"}
						</div>
					</div>
				</div>

				<div className="workflow-summary-list">
					<div className="workflow-summary-item">
						<label className="workflow-summary-key">Budget</label>
						<div className="workflow-summary-value">
							{basics.minBudget || "0"} - {basics.maxBudget || "0"}
						</div>
					</div>
					<div className="workflow-summary-item">
						<label className="workflow-summary-key">Priority</label>
						<div className="workflow-summary-value">
							{basics.priority || "1"}
						</div>
					</div>
				</div>
			</div>
			<div className="workflow-summary-item mb-4">
				<label className="workflow-summary-key">Description</label>
				<p className="workflow-summary-value">{basics.description || "--"}</p>
			</div>
			<WorkflowApproverCards stages={stages} />
		</>
	);
};

export default WorkflowViewForm;
