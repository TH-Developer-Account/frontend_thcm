import React from "react";
import ApprovalDot from "../../../../../components/common/ApprovalDot";

import { type ApprovalApiStatus } from "../../../types";
import { getApprovalSteps } from "./helper";

type EpcData = {
	id: string;
	status: ApprovalApiStatus;
};

interface Props {
	epcData?: EpcData | null;
}
const ApprovalStatus = ({ epcData }: Props) => {
	if (!epcData) return <p>No EPC selected</p>;

	const currentStatus = epcData.status;
	const steps = getApprovalSteps(currentStatus);
	const currentIndex = steps.findIndex((step) => step.api === currentStatus);
	console.log("Status ======>", epcData);
	return (
		<React.Fragment>
			<div className="content-box w-full">
				<div className="approval-dot-section max-w-[200px] p-2">
					{steps.map((status, index) => {
						const isFuture = index > currentIndex;
						const isCurrent = index === currentIndex;
						const isCompleted = index < currentIndex;
						const isLast = index === steps.length - 1; // ✅ always correct
						return (
							<div
								key={status.api}
								className="approval-details flex items-center justify-start gap-2 mb-2.5"
							>
								<ApprovalDot
									status={status.label}
									className="m-2.5"
									isLast={isLast}
									isFuture={isFuture}
									isCompleted={isCompleted}
									isCurrent={isCurrent}
									size="sm"
								/>

								<div>
									<p className="uppercase-label-text">{status.label}</p>
									<p className="epc-status-approver">John, Doe</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</React.Fragment>
	);
};

export default ApprovalStatus;
