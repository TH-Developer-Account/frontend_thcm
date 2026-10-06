// components/EPCTable/EPCActionMenu.tsx
// Row-level action menu for the EPC listing table.
//
// Actions (in order):
//   View        → EPC detail page (always visible)
//   Edit        → EPC detail page with the EPC section opened in edit mode
//                 (only while the EPC is awaiting approval or sent for clarification)
//   Add CRF     → EPC → CRF → EPF stepper wizard (only when no CRF exists yet)
//   Add EPF     → same wizard (only when no EPF exists yet)
//   Create Lead / View all leads → unchanged from before
import {
	Eye,
	FilePlus2,
	Pencil,
	ReceiptIndianRupee,
	UserPlus,
	Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";

import type { ActivityPlannerLocationState } from "../../hooks/useActivityPlanner";
import type { EpcListItem } from "../../types/epc.types";
import {
	EPC_DETAIL_PATH,
	EPC_FORMS_WIZARD_PATH,
	EPC_LEADS_VIEW_PATH,
} from "../../utils/constant";
import {
	getEpcRowActionRules,
	type EpcRowActionRules,
} from "../../utils/activity.helper";

type EPCActionMenuProps = {
	row: EpcListItem;
	currentUserId?: string | null;
	onLeadCreate?: (row: EpcListItem) => void;
	canCreateLead?: boolean;
};

const getEventName = (row: EpcListItem): string => {
	if (typeof row.event_name === "string") {
		return row.event_name;
	}

	return row.event_title || "--";
};

/** Lead context shared by "Create Lead" and "View all leads" (read by the Leads module). */
const buildLeadInfo = (row: EpcListItem) => ({
	epcId: row.id,
	proposalNumber: row.proposal_number || "",
	eventName: getEventName(row),
	location: row.location || "",
	status: row.status || "",
});

const EPCActionMenu = ({
	row,
	currentUserId,
	onLeadCreate,
	canCreateLead = false,
}: EPCActionMenuProps) => {
	const navigate = useNavigate();
	const rowLabel = row.proposal_number || getEventName(row);

	// All visibility rules live in activity.helper.ts so they stay in one place
	// next to the detail-page permissions.
	const rules: EpcRowActionRules = getEpcRowActionRules(row, currentUserId);

	const actions: ActionMenuItem<EpcListItem>[] = [
		{
			id: "view-epc",
			label: "View",
			Icon: Eye,
			ariaLabel: `View ${rowLabel}`,
			onClick: (selectedRow) => navigate(EPC_DETAIL_PATH(selectedRow.id)),
		},
		{
			id: "edit-epc",
			label: "Edit",
			Icon: Pencil,
			hidden: !rules.canEdit,
			ariaLabel: `Edit ${rowLabel}`,
			onClick: (selectedRow) => {
				// The detail page reads this state and opens the EPC section in edit mode.
				const state: ActivityPlannerLocationState = { editSection: "epc" };
				navigate(EPC_DETAIL_PATH(selectedRow.id), { state });
			},
		},
		{
			id: "add-crf",
			label: "Add CRF",
			Icon: FilePlus2,
			hidden: !rules.canAddCrf,
			ariaLabel: `Add CRF for ${rowLabel}`,
			onClick: (selectedRow) =>
				navigate(EPC_FORMS_WIZARD_PATH(selectedRow.id, "crf")),
		},
		{
			id: "add-epf",
			label: "Add EPF",
			Icon: ReceiptIndianRupee,
			hidden: !rules.canAddEpf,
			ariaLabel: `Add EPF for ${rowLabel}`,
			onClick: (selectedRow) =>
				navigate(EPC_FORMS_WIZARD_PATH(selectedRow.id, "epf")),
		},
		{
			id: "create-lead",
			label: "Create Lead",
			Icon: UserPlus,
			disabled: !canCreateLead,
			ariaLabel: `Create lead for ${rowLabel}`,
			onClick: (selectedRow) => {
				localStorage.setItem(
					"LeadInfo",
					JSON.stringify(buildLeadInfo(selectedRow)),
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
				const leadInfo = buildLeadInfo(selectedRow);
				localStorage.setItem("LeadInfo", JSON.stringify(leadInfo));

				navigate(EPC_LEADS_VIEW_PATH, {
					state: { mode: "view", leadInfo },
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
