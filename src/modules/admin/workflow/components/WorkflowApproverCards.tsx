import React from "react";
import { Card } from "../../../../components/common/Card";
import type { WorkflowStage } from "../types/workflow.types";

type Props = {
	stages: WorkflowStage[];
	title?: string;
};

const WorkflowApproverCards = ({
	stages,
	// title = "Approval stages",
}: Props) => {
	return (
		<>
			{/* <div className="workflow-approval-cards-header">
				<h4 className="workflow-approval-cards-title">{title}</h4>
				<p className="workflow-create-card-title-meta">
					{stages.length} stages
				</p>
			</div> */}

			<div className="workflow-approval-cards-grid">
				{stages.map((stage) => {
					const approverNames =
						stage.approvers?.length > 0
							? stage.approvers.map((user) => user.name).join(", ")
							: "--";

					return (
						<Card key={stage.id} className="workflow-approval-card">
							<div className="workflow-approval-card-inner">
								<div className="workflow-approval-card-top">
									<div className="workflow-approval-card-heading">
										<p className="workflow-approval-card-title">{stage.name}</p>
										{/* <p className="workflow-approval-card-step">
											Step {stage.stageOrder}
										</p> */}
									</div>

									<span className="workflow-approval-card-badge">
										{stage.strategy}
									</span>
								</div>

								<div className="workflow-approval-card-section">
									<p className="workflow-create-label">Approvers</p>
									<p className="workflow-approval-card-value">
										{approverNames}
									</p>
								</div>

								{/* <div className="workflow-approval-card-meta">
									<div className="workflow-approval-card-meta-item">
										<p className="workflow-create-label">SLA</p>
										<p className="workflow-approval-card-meta-value">
											{stage.slaDays || "--"} day
											{stage.slaDays === "1" ? "" : "s"}
										</p>
									</div>

									<div className="workflow-approval-card-meta-item workflow-approval-card-meta-item-right">
										<p className="workflow-create-label">Rejection</p>
										<p className="workflow-approval-card-meta-value">
											{stage.rejectionAction || "--"}
										</p>
									</div>
								</div>

								{stage.strategy === "QUORUM" && stage.minApprovals && (
									<div className="workflow-approval-card-footer">
										<p className="workflow-create-label">Minimum approvals</p>
										<p className="workflow-approval-card-footer-value">
											{stage.minApprovals}
										</p>
									</div>
								)} */}
							</div>
						</Card>
					);
				})}
			</div>

			<hr className="epf-divider mb-8 mt-6" />
		</>
	);
};

export default WorkflowApproverCards;
