import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Portal,
} from "@headlessui/react";
import { EllipsisVertical, UserPlus } from "lucide-react";

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
		if (!canCreateLead) return;

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
		<Menu as="div" className="epc-action-menu">
			<MenuButton
				className="epc-action-trigger"
				aria-label={`Open actions for ${row.proposal_number || "EPC"}`}
			>
				<EllipsisVertical size={16} aria-hidden="true" />
			</MenuButton>

			<Portal>
				<MenuItems anchor="bottom end" transition className="epc-action-panel">
					<MenuItem>
						{({ focus }) => (
							<Button
								type="button"
								text="Create Lead"
								disabled={!canCreateLead}
								onClick={handleLead}
								Icon={UserPlus}
								appearance="transparent"
								variant="transparent"
								className={`epc-action-item ${focus ? "epc-action-item-focus" : ""}`}
							/>
						)}
					</MenuItem>
				</MenuItems>
			</Portal>
		</Menu>
	);
}
