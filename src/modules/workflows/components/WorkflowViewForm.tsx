import { useMemo } from "react";
// import { capitalize } from "../../../utils/format";
import type { WorkflowBasics, WorkflowStage } from "../types/types";
import { mapWorkflowStagesToApprovalRows } from "../utils/approvalWorkflow.mapper";
import { ApprovalTable } from "./ApprovalTable";

type WorkflowViewFormProps = {
	basics: WorkflowBasics;
	stages: WorkflowStage[];
};

const HIDDEN_DRAFT_COLUMNS = ["status"] as const;

const WorkflowViewForm = ({ stages }: WorkflowViewFormProps) => {
	const approvalRows = useMemo(
		() =>
			mapWorkflowStagesToApprovalRows(
				stages.filter((stage) => stage.approvers?.length > 0),
				{ showOnlyCurrentStageStatus: false },
			),
		[stages],
	);

	const hasStages = stages.length > 0;

	return (
		<>
			<ApprovalTable
				data={approvalRows}
				hiddenColumns={[...HIDDEN_DRAFT_COLUMNS]}
				emptyTitle={hasStages ? "No approvers added" : "No stages added yet"}
				emptyDescription={
					hasStages
						? "Go back to the previous step to add approvers."
						: "Add stages in the previous step to see them here."
				}
			/>
		</>
	);
};

export default WorkflowViewForm;
