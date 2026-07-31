import type { WorkflowBasics } from "../types/types";

type Props = {
	stageCount: number;
	approverCount: number;
	minApprovers: number;
	basics: WorkflowBasics;
};

const WorkflowCreateSidebar = ({
	stageCount,
	approverCount,
	minApprovers,
	basics,
}: Props) => {
	return (
		<div className="workflow-create-sidebar">
			<div className="workflow-sidebar-card">
				<h3 className="workflow-sidebar-title">Workflow summary</h3>

				<div className="workflow-summary-list">
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Workflow Name</span>
						<span className="workflow-summary-value">{basics.name}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">App Name</span>
						<span className="workflow-summary-value">{basics.appDesc}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Category</span>
						<span className="workflow-summary-value">{basics.category}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Stages</span>
						<span className="workflow-summary-value">{stageCount}</span>
					</div>
					<div className="workflow-summary-item workflow-summary-item-last">
						<span className="workflow-summary-key">Minimum approvers</span>
						<span className="workflow-summary-value">
							{minApprovers ? minApprovers : 0}
						</span>
					</div>
					<div className="workflow-summary-item workflow-summary-item-last">
						<span className="workflow-summary-key">Total approvers</span>
						<span className="workflow-summary-value">{approverCount}</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WorkflowCreateSidebar;
