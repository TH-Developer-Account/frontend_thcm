import React, { useState } from "react";
import LineItemTable from "../../../../components/ui/LineItemTable";
import EpfForm2 from "./EpfForm2";

export interface CostItem {
	id: string;
	particular: string;
	description: string;
	rate: number;
	quantity: number;
}

interface EventCostOverheadsProps {
	items: CostItem[];
	onChange: (items: CostItem[]) => void;
	isViewer?: boolean;
}

const particularOptions = [
	{ label: "Snacks / Beverage", value: "snacks" },
	{ label: "Miscellaneous Expenses", value: "misc" },
];

export function EventCostOverheads({
	items,
	onChange,
	isViewer,
}: EventCostOverheadsProps) {
	return (
		<LineItemTable
			title="Event Cost Overheads"
			items={items}
			onChange={onChange}
			particularOptions={particularOptions}
			isViewer={isViewer}
		/>
	);
}

/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */

export default function EpfForm() {
	const [costItems, setCostItems] = useState<CostItem[]>([]);

	return (
		<>
			<div className=" bg-white rounded-xl shadow-sm p-6 max-w-6xl mx-auto p-3">
				<EventCostOverheads
					items={costItems}
					onChange={setCostItems}
					isViewer={false}
				/>
				<EpfForm2 userRole="ADMIN" />
			</div>
		</>
	);
}
