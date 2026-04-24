import React from "react";
import ApprovalDot from "../../../../../components/common/ApprovalDot";
import { useEPC } from "../../../context/useEPC";

import { type ApprovalApiStatus } from "../../../types";
import { getApprovalSteps } from "./helper";

interface Props {
	epcData?: [];
}
const ApprovalStatus = ({ epcData }: Props) => {
	const { data, loading } = useEPC();
	if (loading) return <p>Loading...</p>;
	if (!epcData) return <p>No EPC selected</p>;
	const epc = data.find((item) => String(item.id) === String(epcData));
	if (!epc) return <p>EPC not found</p>;

	const currentStatus = epc.status as ApprovalApiStatus;

	const steps = getApprovalSteps(currentStatus);

	const currentIndex = steps.findIndex((step) => step.api === currentStatus);

	return (
		<React.Fragment>
			<div className=" bg-white  rounded-xl h-auto grid  relative">
				<div className="approval-dot-section sticky  top-0 max-w-[220px] w-full h-auto p-2 border shadow-sm border-zinc-300 mt-6 rounded-lg">
					{steps.map((status, index) => {
						const isFuture = index > currentIndex;
						const isCurrent = index === currentIndex;
						const isCompleted = index < currentIndex;
						const isLast = index === steps.length - 1; // ✅ always correct
						return (
							<div
								key={status.api}
								className="approval-details flex items-center justify-start gap-2 mb-4"
							>
								<ApprovalDot
									status={status.label ? status.label : "Pending"}
									className="m-4"
									isLast={isLast}
									isFuture={isFuture}
									isCompleted={isCompleted}
									isCurrent={isCurrent}
									size="sm"
								/>

								<div className="info text-sm italic">
									<p className=" font-semibold">{status.label}</p>
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
