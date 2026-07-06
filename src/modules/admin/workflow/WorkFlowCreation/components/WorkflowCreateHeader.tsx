import React from "react";
import { Check } from "lucide-react";
// import NavigateButton from "../../../../../components/common/NavigateButton";

type Props = {
	currentStep: number;
};

const steps = [
	{ id: 1, label: "Workflow basics" },
	{ id: 2, label: "Approval stages" },
	{ id: 3, label: "Review & Submit" },
];

const WorkflowCreateHeader = ({ currentStep }: Props) => {
	return (
		<>
			{/* <div className="workflow-create-topbar">
				<NavigateButton text="Back" direction="back" iconPosition="left" />
			</div> */}

			<div className="workflow-progress mt-4">
				{steps.map((step, index) => {
					const isDone = currentStep > step.id;
					const isActive = currentStep === step.id;

					return (
						<React.Fragment key={step.id}>
							<div className="workflow-progress-step">
								<div
									className={`workflow-progress-dot ${
										isDone
											? "workflow-progress-dot-done"
											: isActive
												? "workflow-progress-dot-active"
												: "workflow-progress-dot-wait"
									}`}
								>
									{isDone ? <Check size={12} /> : step.id}
								</div>

								<span
									className={`workflow-progress-label ${
										isDone
											? "workflow-progress-label-done"
											: isActive
												? "workflow-progress-label-active"
												: "workflow-progress-label-wait"
									}`}
								>
									{step.label}
								</span>
							</div>

							{index < steps.length - 1 && (
								<div className="workflow-progress-line" />
							)}
						</React.Fragment>
					);
				})}
			</div>
		</>
	);
};

export default WorkflowCreateHeader;
