import ApprovalFlowSection from "./ApprovalFlowSection";
import type { WorkflowStage } from "../../types/workflow.types";
import SectionAccordion from "../../../../../components/common/SectionAccordion";

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
		<SectionAccordion title="Approval Flow">
			<ApprovalFlowSection
				stages={stages}
				deviationPreviewStages={deviationPreviewStages}
			/>
		</SectionAccordion>
	);
};

export default ApprovalWorkflowSection;
