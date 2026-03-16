import React from "react";
import ApprovalDot from "../../../../../components/common/ApprovalDot";
import { useEPC } from "../../../context/useEPC";
import {
	approvalSteps,
	type ApprovalApiStatus,
} from "../../../../../components/common/common.types";

interface Props {
	epcId?: string;
}
const ApprovalStatus = ({ epcId }: Props) => {
	const { data, loading } = useEPC();
	if (loading) return <p>Loading...</p>;
	if (!epcId) return <p>No EPC selected</p>;
	const epc = data.find(
		(item) => String(item.proposal_number) === String(epcId),
	);
	if (!epc) return <p>EPC not found</p>;

	const currentIndex = approvalSteps.findIndex(
		(step) => step.api === (epc.status as ApprovalApiStatus),
	);

	return (
		<React.Fragment>
			<div className=" bg-white  rounded-xl h-auto grid col-span-1/2">
				<div className="approval-dot-section max-w-[260px] w-full h-auto p-4 border shadow-sm border-zinc-300 mt-6 rounded-lg">
					{approvalSteps.map((status, index) => {
						const isFuture = index > currentIndex;
						return (
							<div
								key={status.api}
								className="approval-details flex items-center justify-start gap-2 mb-4"
							>
								<ApprovalDot
									status={status.label ? status.label : "Pending"}
									className="m-4"
									isFuture={isFuture}
									isLast={index === approvalSteps.length - 1}
									isCompleted={index <= currentIndex}
								/>
								<div className="info text-sm italic">
									<p className=" font-semibold">John Doe</p>
									<span className="italic text-xs font-serif font-light ">
										{status.label}
									</span>
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
