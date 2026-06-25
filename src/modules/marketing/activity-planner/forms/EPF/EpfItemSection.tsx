import type { Dispatch, SetStateAction } from "react";

import LineItemTable from "../../../../../components/ui/LineItemTable";
import type { LineItemOption } from "../../types/lineItem.types";
import { OVERHEAD_COLUMNS } from "../../utils/columnPresets";

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
	return (
		<LineItemTable
			title="Event Cost Overheads"
			items={items}
			onChange={onChange}
			particularOptions={options}
			isViewer={isViewer}
			category="EVENT_OVERHEAD"
			columns={OVERHEAD_COLUMNS}
		/>
	);
}
