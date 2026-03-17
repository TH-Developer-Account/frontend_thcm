import React from "react";
import { Card } from "../../../../../components/common/Card";

type ApprovalRole = {
	id: number;
	label: string;
};
type ApprovalCardsView = {
	epcId: string;
	firstName: string;
	lastName: string;
	// approvalList: ApprovalRole;
};
const approvalList: ApprovalRole[] = [
	{ id: 1, label: "Proposer" },
	{ id: 2, label: "Checker" },
	{ id: 3, label: "Recommender" },
	{ id: 4, label: "Approver" },
	{ id: 5, label: "Validator" },
];
const ApprovalCardsView = ({
	// epcId,
	firstName,
	lastName,
	// approvalList,
}: ApprovalCardsView) => {
	return (
		<React.Fragment>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 mb-8">
				{/* ── Section 6: Dealer / PO Share ─────────────────────────── */}
				{approvalList.map((card) => (
					<Card>
						<div
							className="row-7 justify-between flex items-center p-4"
							key={card.id}
						>
							<div>
								<p className="font-bold mb-2">{card.label}</p>
								<p className="font-light">{firstName + ", " + lastName}</p>
								{/* <p className="font-bold ">
									Status :{" "}
									<span className="font-medium">
										<Badge status={"Active"}>{epcId}</Badge>
									</span>
								</p> */}
							</div>
						</div>
					</Card>
				))}
			</div>

			<hr className="epf-divider mb-8" />
		</React.Fragment>
	);
};
export default ApprovalCardsView;
