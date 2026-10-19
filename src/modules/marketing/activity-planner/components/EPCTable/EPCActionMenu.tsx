// components/EPCTable/EPCActionMenu.tsx
// Row-level action menu for the EPC listing table.
//
// View / Edit rules (kept identical to the EPC No link in columns.tsx):
//   • Not submitted → the CREATOR can "View", which opens the STEPPER at the
//     EPC Details step (same as clicking the EPC number). The read-only EPC
//     view page is NOT used for unsubmitted EPCs. There is no Edit.
//   • Submitted     → everyone with access can View (opens the EPC view page);
//     Edit follows the existing rules (getEpcRowActionRules — i.e.
//     clarification) and opens the STEPPER in edit mode (EPC → CRF → EPF).
//   • Add CRF / Add EPF / Final Submit stay in the stepper.
//   • "CRF Order" shows only for a submitted EPC that has a CRF, and opens the
//     view page on the order / tracking tab.

import {
	ClipboardCheck,
	Eye,
	FilePlus2,
	FlaskConical,
	Pencil,
	ReceiptIndianRupee,
	Truck,
	UserPlus,
	Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";

import type { EpcListItem } from "../../types/epc.types";
import {
	EPC_DETAIL_PATH,
	EPC_FORMS_WIZARD_PATH,
	EPC_LEADS_VIEW_PATH,
} from "../../utils/constant";
import {
	canValidateReportFromRow,
	getEpcRowActionRules,
	type EpcRowActionRules,
} from "../../utils/activity.helper";
import { canOpenEpcView, isEpcSubmitted } from "../../forms/EPC/epc.utils";
import type { ActivityFormViewLocationState } from "../activityFormView/ActivityFormView";
import type { EpcWizardLocationState } from "../../pages/EpcFormsWizardPage";

type EPCActionMenuProps = {
	row: EpcListItem;
	currentUserId?: string;
	onLeadCreate?: (row: EpcListItem) => void;
	onMachineStudyCreate?: (row: EpcListItem) => void;
	canCreateLead?: boolean;
	canViewLeads?: boolean;
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
	canViewLeads = false,
	canCreateMachineStudy = false,
}: EPCActionMenuProps) => {
	const navigate = useNavigate();
	const rowLabel = row.proposal_number || getEventName(row);

	// Existing EPC / CRF / EPF permissions remain unchanged.
	const rules: EpcRowActionRules = getEpcRowActionRules(row, currentUserId);

	const isSubmitted = isEpcSubmitted(row);

	// Submitted → anyone with access; not submitted → only the creator.
	const canView = canOpenEpcView(row, currentUserId);

	// Edit appears only after the EPC is finally submitted (EPC + CRF + EPF are
	// saved and the workflow has started). Before that, the creator continues
	// from the stepper, so there is no Edit.
	const canEdit = isSubmitted && rules.canEdit;

	const actions: ActionMenuItem<EpcListItem>[] = [
		{
			id: "view-epc",
			label: "View",
			Icon: Eye,
			disabled: !canView,
			ariaLabel: canView
				? `View ${rowLabel}`
				: `View ${rowLabel} (available after submission)`,
			// Same destination as the EPC No link: the EPC view page renders
			// only for a submitted EPC; otherwise continue in the stepper.
			onClick: (selectedRow) =>
				navigate(
					isEpcSubmitted(selectedRow)
						? EPC_DETAIL_PATH(selectedRow.id)
						: EPC_FORMS_WIZARD_PATH(selectedRow.id, "epc"),
				),
		},
		{
			id: "edit-epc",
			label: "Edit",
			Icon: Pencil,
			hidden: !canEdit,
			ariaLabel: `Edit ${rowLabel}`,
			// Opens the stepper in edit mode: EPC → CRF → EPF → Review.
			onClick: (selectedRow) => {
				const state: EpcWizardLocationState = { mode: "edit" };

				navigate(EPC_FORMS_WIZARD_PATH(selectedRow.id, "epc"), { state });
			},
		},
		// Only for a submitted EPC with a CRF → place the CRF's store order /
		// track it. (The view page, and so its order tab, exists only after
		// submission.)
		{
			id: "crf-order",
			label: "CRF Order",
			Icon: Truck,
			hidden: !isSubmitted || !canView || !row.crf_id,
			ariaLabel: `Open CRF order for ${rowLabel}`,
			onClick: (selectedRow) => {
				const state: ActivityFormViewLocationState = { openTab: "order" };
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
			hidden: row.sourceType !== "LEAD_FORM" || !canViewLeads,
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
		// Validate Report
		{
			id: "validate-report",
			label: "Validate report",
			Icon: ClipboardCheck,
			hidden: !canValidateReportFromRow(row, currentUserId),
			ariaLabel: `Validate report for ${rowLabel}`,
			onClick: (selectedRow) => {
				const state: ActivityFormViewLocationState = { openTab: "report" };
				navigate(EPC_DETAIL_PATH(selectedRow.id), { state });
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
