import React, { useState } from "react";
import LineItemTable from "../../components/ui/LineItemTable";

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
			<EventCostOverheads
				items={costItems}
				onChange={setCostItems}
				isViewer={false}
			/>
		</>
	);
}
