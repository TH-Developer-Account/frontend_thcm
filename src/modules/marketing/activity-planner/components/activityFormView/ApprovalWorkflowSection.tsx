import Section from "../common/Section";
import ApprovalFlowSection from "./ApprovalFlowSection";
import type { WorkflowStage } from "../../types/workflow.types";

type ApprovalWorkflowSectionProps = {
	stages: WorkflowStage[];
	deviationPreviewStages?: WorkflowStage[];
	onWorkflowUpdate: () => Promise<void>;
};

const ApprovalWorkflowSection = ({
	stages,
	deviationPreviewStages = [],
}: ApprovalWorkflowSectionProps) => {
	return (
		<Section title="Approval Flow">
			<ApprovalFlowSection
				stages={stages}
				deviationPreviewStages={deviationPreviewStages}
			/>
		</Section>
	);
};

export default ApprovalWorkflowSection;
