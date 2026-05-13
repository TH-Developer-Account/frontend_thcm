import type { Dispatch, SetStateAction } from "react";
import React from "react";

import LineItemTable from "../../../../components/ui/LineItemTable";
import type { LineItemOption } from "../../types";

const EPF_OVERHEAD_CATEGORY = "EVENT_OVERHEAD";

type EpfItemsSectionProps = {
	items: LineItemOption[];
	onChange: Dispatch<SetStateAction<LineItemOption[]>>;
	options: LineItemOption[];
	isViewer?: boolean;
};

export default function EpfItemsSection({
	items,
	onChange,
	options,
	isViewer = false,
}: EpfItemsSectionProps) {
	const overheadItems = React.useMemo(() => {
		return items
			.filter(
				(item) => !item.category || item.category === EPF_OVERHEAD_CATEGORY,
			)
			.map((item) => ({
				...item,
				category: EPF_OVERHEAD_CATEGORY,
			}));
	}, [items]);

	const overheadOptions = React.useMemo(() => {
		return options.map((option) => ({
			...option,
			category: option.category || EPF_OVERHEAD_CATEGORY,
		}));
	}, [options]);

	const handleChange: Dispatch<SetStateAction<LineItemOption[]>> = (
		updater,
	) => {
		onChange((prev) => {
			const nonOverheadItems = prev.filter(
				(item) => item.category && item.category !== EPF_OVERHEAD_CATEGORY,
			);

			const currentOverheadItems = prev
				.filter(
					(item) => !item.category || item.category === EPF_OVERHEAD_CATEGORY,
				)
				.map((item) => ({
					...item,
					category: EPF_OVERHEAD_CATEGORY,
				}));

			const updatedOverheadItems =
				typeof updater === "function" ? updater(currentOverheadItems) : updater;

			const normalizedOverheadItems = updatedOverheadItems.map((item) => ({
				...item,
				category: EPF_OVERHEAD_CATEGORY,
			}));

			return [...nonOverheadItems, ...normalizedOverheadItems];
		});
	};

	return (
		<LineItemTable
			title="Event Cost Overheads"
			items={overheadItems}
			onChange={handleChange}
			particularOptions={overheadOptions}
			isViewer={isViewer}
			category={EPF_OVERHEAD_CATEGORY}
		/>
	);
}
