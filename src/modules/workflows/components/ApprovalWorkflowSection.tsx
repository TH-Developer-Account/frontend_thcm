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
	<ApprovalWorkflowTableContent
		stages={stages}
		additionalFlows={additionalFlows}
	/>
);
