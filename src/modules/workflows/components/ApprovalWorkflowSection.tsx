import type { ApprovalStageLike } from "../types/types";
import {
	ApprovalWorkflowTableContent,
	type ApprovalWorkflowFlowGroup,
} from "./ApprovalWorkflowTableContent";

export type ApprovalWorkflowSectionProps = {
	stages: ApprovalStageLike[];
	additionalFlows?: ApprovalWorkflowFlowGroup[];
	/** activeWorkflow.currentStage: highlights the stage the workflow is at. */
	currentStageOrder?: number | null;
};

export const ApprovalWorkflowSection = ({
	stages,
	additionalFlows = [],
	currentStageOrder,
}: ApprovalWorkflowSectionProps) => (
	<ApprovalWorkflowTableContent
		stages={stages}
		additionalFlows={additionalFlows}
		currentStageOrder={currentStageOrder}
	/>
);
