import React from "react";
import { Dashboard } from "./Dashboard";
import type { EventRow } from "../../../../utils/types";

export const DashboardPage = () => {
	const tableData: EventRow[] = [
		{
			id: "1",
			type: "EPC",
			status: "Approved",
			budget: 50000,
			participants: 120,
		},
		{
			id: "2",
			type: "EPF",
			status: "Pending",
			budget: 30000,
			participants: 80,
		},
		{
			id: "3",
			type: "CRF",
			status: "Approved",
			budget: 45000,
			participants: 100,
		},
		{
			id: "4",
			type: "EPC",
			status: "Rejected",
			budget: 20000,
			participants: 40,
		},
	];

	return (
		<React.Fragment>
			<Dashboard data={tableData} />
		</React.Fragment>
	);
};
