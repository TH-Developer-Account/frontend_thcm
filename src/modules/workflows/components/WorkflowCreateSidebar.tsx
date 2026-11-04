import type { WorkflowBasics } from "../types/types";
import { workflowScopeCopy } from "../utils/workflow.constants";

type Props = {
	stageCount: number;
	approverCount: number;
	minApprovers: number;
	basics: WorkflowBasics;
	// Only meaningful while creating — an existing workflow's type is fixed.
	showTemplateType?: boolean;
};

const WorkflowCreateSidebar = ({
	stageCount,
	approverCount,
	minApprovers,
	basics,
	showTemplateType = false,
}: Props) => {
	const templateTypeLabel =
		basics.scope === workflowScopeCopy.shared.value
			? workflowScopeCopy.shared.label
			: basics.scope === workflowScopeCopy.personal.value
				? workflowScopeCopy.personal.label
				: null;

	return (
		<div className="workflow-create-sidebar">
			<div className="workflow-sidebar-card">
				<h3 className="workflow-sidebar-title">Workflow summary</h3>

				<div className="workflow-summary-list">
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Workflow Name</span>
						<span className="workflow-summary-value">{basics.name || "—"}</span>
					</div>
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">App Name</span>
						<span className="workflow-summary-value">
							{basics.appDesc || "—"}
						</span>
					</div>
					{showTemplateType && templateTypeLabel ? (
						<div className="workflow-summary-item">
							<span className="workflow-summary-key">Template type</span>
							<span className="workflow-summary-value">
								{templateTypeLabel}
							</span>
						</div>
					) : null}
					{basics.category ? (
						<div className="workflow-summary-item">
							<span className="workflow-summary-key">Category</span>
							<span className="workflow-summary-value">{basics.category}</span>
						</div>
					) : null}
					<div className="workflow-summary-item">
						<span className="workflow-summary-key">Stages</span>
						<span className="workflow-summary-value">{stageCount}</span>
					</div>
					<div className="workflow-summary-item">
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
