type Props = {
	module: string;
	stageCount: number;
	approverCount: number;
};

const WorkflowCreateSidebar = ({
	module,
	stageCount,
	approverCount,
}: Props) => {
	return (
		<div className="workflow-create-sidebar">
			<div className="workflow-sidebar-card">
				<h3 className="workflow-sidebar-title">Workflow summary</h3>

				<div className="workflow-summary-list">
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Module</span>
						<span className="workflow-summary-value">{module}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Stages</span>
						<span className="workflow-summary-value">{stageCount}</span>
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
