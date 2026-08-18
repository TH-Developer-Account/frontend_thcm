import { UserPlus, Users } from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";

import type { EpcListItem } from "../../types/epc.types";
import { useNavigate } from "react-router-dom";

type EPCActionMenuProps = {
	row: EpcListItem;
	onLeadCreate?: (row: EpcListItem) => void;
	canCreateLead?: boolean;
};

const getEventName = (row: EpcListItem): string => {
	if (typeof row.event_name === "string") {
		return row.event_name;
	}

	return row.event_title || "--";
};

const EPCActionMenu = ({
	row,
	onLeadCreate,
	canCreateLead = false,
}: EPCActionMenuProps) => {
	const rowLabel = row.proposal_number || getEventName(row);
	const navigate = useNavigate();
	const actions: ActionMenuItem<EpcListItem>[] = [
		{
			id: "create-lead",
			label: "Create Lead",
			Icon: UserPlus,
			disabled: !canCreateLead,
			ariaLabel: `Create lead for ${rowLabel}`,
			onClick: (selectedRow) => {
				localStorage.setItem(
					"LeadInfo",
					JSON.stringify({
						epcId: selectedRow.id,
						proposalNumber: selectedRow.proposal_number || "",
						eventName: getEventName(selectedRow),
						location: selectedRow.location || "",
						status: selectedRow.status || "",
					}),
				);

				onLeadCreate?.(selectedRow);
			},
		},
		{
			id: "view-lead-listing",
			label: "View all leads",
			Icon: Users,
			ariaLabel: `View all leads for ${rowLabel}`,
			onClick: (selectedRow) => {
				const leadInfo = {
					epcId: selectedRow.id,
					proposalNumber: selectedRow.proposal_number || "",
					eventName: getEventName(selectedRow),
					location: selectedRow.location || "",
					status: selectedRow.status || "",
				};

				localStorage.setItem("LeadInfo", JSON.stringify(leadInfo));

				navigate("/marketing/activity-planner/leads/view", {
					state: {
						mode: "view",
						leadInfo,
					},
				});
			},
		},
	];

	return (
		<ActionMenu<EpcListItem>
			row={row}
			actions={actions}
			ariaLabel={`Open actions for ${rowLabel}`}
		/>
	);
};

export default EPCActionMenu;
