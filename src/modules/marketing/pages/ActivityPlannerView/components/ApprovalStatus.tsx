import React from "react";
import ApprovalDot from "../../../../../components/common/ApprovalDot";
import type { EPCStatus } from "../../../../../utils/types";

const approval: EPCStatus[] = [
	"Approved",
	"Pending",
	"Sent Back",
	"Recommended",
	"Submitted",
	"Report Submitted",
	"Cancelled",
	"Completed",
];

const ApprovalStatus = () => {
	return (
		<React.Fragment>
			<div className=" bg-white  rounded-xl h-full grid min-h-screen">
				<div className="approval-dot-section max-w-[260px] w-full h-auto p-4 border shadow-sm border-zinc-300 mt-6 rounded-lg">
					{approval.map((status, index) => {
						return (
							<div
								key={status}
								className="approval-details flex items-center justify-start gap-2 mb-4"
							>
								<ApprovalDot
									status={status ? status : "Pending"}
									className="m-4"
									isLast={index === approval.length - 1}
								/>
								<div className="info text-sm italic">
									<p className=" font-semibold">John Doe</p>
									<span className="italic text-xs font-serif font-light ">
										Approved
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
