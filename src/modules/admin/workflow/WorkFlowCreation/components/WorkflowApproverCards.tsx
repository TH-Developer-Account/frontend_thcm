import type { WorkflowStage } from "../../types/workflow.types";

type Props = {
  stages: WorkflowStage[];
  title?: string;
};

const WorkflowApproverCards = ({ stages }: Props) => {
  return (
    <>
      <div className="workflow-approval-table">
        <table className="workflow-approval-table-inner">
          <thead>
            <tr>
              <th className="workflow-approval-th">Stage Name</th>
              <th className="workflow-approval-th">Strategy</th>
              <th className="workflow-approval-th">Approvers</th>
            </tr>
          </thead>

          <tbody>
            {stages.map((stage) => {
              const approverNames =
                stage.approvers?.length > 0
                  ? stage.approvers.map((user) => user.name).join(", ")
                  : "--";
              return (
                <tr className="workflow-approval-row" key={stage.id}>
                  <td className="workflow-approval-td workflow-approval-name">
                    {stage.name}
                  </td>

                  <td className="workflow-approval-td">
                    <span className="workflow-approval-badge">
                      {stage.approvers.length > 1 ? "Parallel" : "Sequential"}
                    </span>
                  </td>

                  <td className="workflow-approval-td workflow-approval-approvers">
                    {approverNames}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <hr className="epf-divider mb-8 mt-6" />
    </>
  );
};

export default WorkflowApproverCards;
