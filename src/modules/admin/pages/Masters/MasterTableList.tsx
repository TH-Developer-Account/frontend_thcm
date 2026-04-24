import React, { type JSX } from "react";
import BranchesList from "./BranchesList";
import DepartmentsList from "./DepartmentsList";
import RegionsList from "./RegionsList";
import EventNamesList from "./EventNamesList";
import BudgetMasterList from "./BudgetMasterList";

type MasterTableListProps = {
	master?: string;
};

const MasterTableList = ({ master }: MasterTableListProps) => {
	const masterComponents: Record<string, JSX.Element> = {
		Branches: <BranchesList />,
		Departments: <DepartmentsList />,
		Regions: <RegionsList />,
		Budget: <BudgetMasterList />,
		"Event Names": <EventNamesList />,
	};

	return (
		<div className="rounded-lg h-full min-h-screen max-w-4xl border shadow-sm border-zinc-300 p-4">
			{master ? masterComponents[master] : "None Selected"}
		</div>
	);
};

export default MasterTableList;
