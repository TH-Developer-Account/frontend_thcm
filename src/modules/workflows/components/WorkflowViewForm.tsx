import { capitalize } from "../../../utils/format";
import type { WorkflowBasics, WorkflowStage } from "../types/workflow.types";
import WorkflowApproverCards from "./WorkflowApproverCards";

type WorkflowViewFormProps = {
	basics: WorkflowBasics;
	stages: WorkflowStage[];
};

const WorkflowViewForm = ({ basics, stages }: WorkflowViewFormProps) => {
	const workflow_name = capitalize(basics.name);
	const workflow_app = capitalize(basics.appDesc);
	return (
		<>
			<div className="workflow-create-field-row workflow-create-field-row-2 gap-6 items-center mb-4">
				<div className="workflow-create-card-title">
					<label className="workflow-summary-key">Workflow name</label>
					{workflow_name || "--"}
				</div>
				<div className="workflow-create-card-title">
					<label className="workflow-summary-key">App Name</label>
					{workflow_app || "--"}
				</div>
			</div>

			<WorkflowApproverCards stages={stages} />
		</>
	);
};

export default WorkflowViewForm;
