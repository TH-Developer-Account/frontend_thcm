// components/EPCTable/EPCActionMenu.tsx
// Row-level action menu for the EPC listing table.

import {
	Eye,
	FilePlus2,
	FlaskConical,
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
	currentUserId?: string;
	onLeadCreate?: (row: EpcListItem) => void;
	onMachineStudyCreate?: (row: EpcListItem) => void;
	canCreateLead?: boolean;
	canCreateMachineStudy?: boolean;
};

const getEventName = (row: EpcListItem): string => {
	if (typeof row.event_name === "string") {
		return row.event_name;
	}

	return row.event_title || "--";
};

/** Shared context stored for Lead / Machine Study creation. */
const buildEntryInfo = (row: EpcListItem) => ({
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
	onMachineStudyCreate,
	canCreateLead = false,
	canCreateMachineStudy = false,
}: EPCActionMenuProps) => {
	const navigate = useNavigate();
	const rowLabel = row.proposal_number || getEventName(row);

	// Existing EPC / CRF / EPF permissions remain unchanged.
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
				const state: ActivityPlannerLocationState = {
					editSection: "epc",
				};

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

		// LEAD_FORM → existing Lead actions.
		{
			id: "create-lead",
			label: "Create Lead",
			Icon: UserPlus,
			hidden: row.sourceType !== "LEAD_FORM",
			disabled: !canCreateLead,
			ariaLabel: `Create lead for ${rowLabel}`,
			onClick: (selectedRow) => {
				localStorage.setItem(
					"LeadInfo",
					JSON.stringify(buildEntryInfo(selectedRow)),
				);

				onLeadCreate?.(selectedRow);
			},
		},
		{
			id: "view-lead-listing",
			label: "View all leads",
			Icon: Users,
			hidden: row.sourceType !== "LEAD_FORM",
			ariaLabel: `View all leads for ${rowLabel}`,
			onClick: (selectedRow) => {
				const leadInfo = buildEntryInfo(selectedRow);

				localStorage.setItem("LeadInfo", JSON.stringify(leadInfo));

				navigate(EPC_LEADS_VIEW_PATH, {
					state: {
						mode: "view",
						leadInfo,
					},
				});
			},
		},

		// DATA_FORM → incoming Machine Study functionality.
		{
			id: "create-machine-study",
			label: "Create Machine Study",
			Icon: FlaskConical,
			hidden: row.sourceType !== "DATA_FORM",
			disabled: !canCreateMachineStudy,
			ariaLabel: `Create machine study for ${rowLabel}`,
			onClick: (selectedRow) => {
				localStorage.setItem(
					"MachineStudyInfo",
					JSON.stringify(buildEntryInfo(selectedRow)),
				);

				onMachineStudyCreate?.(selectedRow);
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
