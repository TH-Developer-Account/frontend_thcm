import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Portal,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";

import type { EpcListItem } from "../../types/epc.types";
import Button from "../../../../../components/common/Button";

type EPCActionMenuProps = {
	row: EpcListItem;
	onLeadCreate?: (row: EpcListItem) => void;
	canCreateLead?: boolean;
};

const getEventName = (row: EpcListItem) => {
	if (typeof row.event_name === "string") return row.event_name;

	return row.event_title || "--";
};

export default function EPCActionMenu({
	row,
	onLeadCreate,
	canCreateLead,
}: EPCActionMenuProps) {
	const handleLead = () => {
		localStorage.setItem(
			"LeadInfo",
			JSON.stringify({
				epcId: row.id,
				proposalNumber: row.proposal_number || "",
				eventName: getEventName(row),
				location: row.location || "",
				status: row.status || "",
			}),
		);

		onLeadCreate?.(row);
	};

	return (
		<Menu as="div" className="relative inline-block text-left">
			<MenuButton
				className="
					inline-flex items-center justify-center gap-1.5 rounded-md
					border border-zinc-200 bg-white px-3 py-1.5
					text-xs font-medium text-zinc-700 shadow-sm transition
					hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700
					focus:outline-none focus:ring-2 focus:ring-orange-100
				"
			>
				Actions
				<ChevronDown size={14} />
			</MenuButton>

			<Portal>
				<MenuItems
					anchor="bottom end"
					transition
					className="
						z-99 mt-1 w-44 origin-top-right
						rounded-md border border-zinc-100 bg-white p-1 shadow-lg
						outline-none transition
						data-closed:scale-95 data-closed:transform data-closed:opacity-0
						data-enter:duration-100 data-enter:ease-out
						data-leave:duration-75 data-leave:ease-in
					"
				>
					<MenuItem>
						<Button
							type="button"
							onClick={handleLead}
							className="
								flex w-full items-center gap-2 rounded px-3 py-2
								text-left text-xs font-medium text-zinc-700
								data-focus:bg-orange-50 data-focus:text-orange-700
							"
							disabled={!canCreateLead}
							text="Create Lead"
						/>
					</MenuItem>
				</MenuItems>
			</Portal>
		</Menu>
	);
}
