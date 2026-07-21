import SectionAccordion from "../../common/SectionAccordion";
import ApprovalWorkflowTableContent from "./ApprovalWorkflowTableContent";
import type { ApprovalStageLike } from "./approvalWorkflow.types";

type ApprovalWorkflowSectionProps = {
	stages: ApprovalStageLike[];
	deviationPreviewStages?: ApprovalStageLike[];
};

const ApprovalWorkflowSection = ({
	stages,
	deviationPreviewStages = [],
}: ApprovalWorkflowSectionProps) => {
	return (
		<SectionAccordion title="Approval Flow">
			<ApprovalWorkflowTableContent
				stages={stages}
				deviationPreviewStages={deviationPreviewStages}
			/>
		</SectionAccordion>
	);
};

export default ApprovalWorkflowSection;
