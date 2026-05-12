import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Portal,
} from "@headlessui/react";
import { ChevronDown, FileText, Users } from "lucide-react";
import type { EPCRow } from "../../../../../utils/types";

type EPCActionMenuProps = {
	row: EPCRow;
	onLeadCreate?: () => void;
};

export default function EPCActionMenu({
	row,
	onLeadCreate,
}: EPCActionMenuProps) {
	const lead = row?.lead_id || null;

	const handleLead = () => {
		localStorage.setItem(
			"LeadInfo",
			JSON.stringify({
				epcId: row.id,
				lead: row.lead_id,
			}),
		);

		onLeadCreate?.();
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
					className=" z-99999 mt-1 w-44 origin-top-right
                        rounded-md border border-zinc-100 bg-white p-1 shadow-lg
                        outline-none transition
                        data-closed:scale-95 data-closed:transform data-closed:opacity-0
                        data-enter:duration-100 data-enter:ease-out
                        data-leave:duration-75 data-leave:ease-in
                    "
				>
					<MenuItem>
						<button
							type="button"
							onClick={handleLead}
							className="
                                flex w-full items-center gap-2 rounded px-3 py-2
                                text-left text-xs font-medium text-zinc-700
                                data-focus:bg-orange-50 data-focus:text-orange-700
                            "
						>
							{lead ? <Users size={14} /> : <FileText size={14} />}
							{lead ? "Edit Lead" : "Create Lead"}
						</button>
					</MenuItem>
				</MenuItems>
			</Portal>
		</Menu>
	);
}
