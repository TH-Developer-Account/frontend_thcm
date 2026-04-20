import type { WorkflowBasics, WorkflowStage } from "../types/workflow.types";
import WorkflowApproverCards from "./WorkflowApproverCards";

type WorkflowViewFormProps = {
	basics: WorkflowBasics;
	stages: WorkflowStage[];
};

const WorkflowViewForm = ({ basics, stages }: WorkflowViewFormProps) => {
	return (
		<>
			<div className="workflow-create-field-row workflow-create-field-row-2 gap-6 items-center mb-4">
				<div className="workflow-summary-item">
					<label className="workflow-summary-key">Workflow name</label>
					<div className="workflow-summary-value">{basics.name || "--"}</div>
				</div>
				<div className="workflow-summary-item">
					<label className="workflow-summary-key">Description</label>
					<p className="workflow-summary-value">{basics.description || "--"}</p>
				</div>
			</div>

			<WorkflowApproverCards stages={stages} />
		</>
	);
};

export default WorkflowViewForm;
