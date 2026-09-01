import SectionAccordion from "../../../components/common/SectionAccordion";
import type { ApprovalStageLike } from "../types/types";
import {
	ApprovalWorkflowTableContent,
	type ApprovalWorkflowFlowGroup,
} from "./ApprovalWorkflowTableContent";

export type ApprovalWorkflowSectionProps = {
	stages: ApprovalStageLike[];
	additionalFlows?: ApprovalWorkflowFlowGroup[];
};

export const ApprovalWorkflowSection = ({
	stages,
	additionalFlows = [],
}: ApprovalWorkflowSectionProps) => (
	<SectionAccordion title="Approval Flow">
		<ApprovalWorkflowTableContent
			stages={stages}
			additionalFlows={additionalFlows}
		/>
	</SectionAccordion>
);
