import { UserPlus, Users, FlaskConical, ClipboardList } from "lucide-react";

import ActionMenu, {
  type ActionMenuItem,
} from "../../../../../components/common/ActionMenu";

import type { EpcListItem } from "../../types/epc.types";
import { useNavigate } from "react-router-dom";

type EPCActionMenuProps = {
  row: EpcListItem;
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

// Shared by both LEAD_FORM and DATA_FORM branches — the localStorage
// payload shape is identical, only the storage key and downstream
// consumer differ.
const buildEntryInfo = (row: EpcListItem) => ({
  epcId: row.id,
  proposalNumber: row.proposal_number || "",
  eventName: getEventName(row),
  location: row.location || "",
  status: row.status || "",
});

const buildLeadActions = (
  row: EpcListItem,
  rowLabel: string,
  navigate: ReturnType<typeof useNavigate>,
  onLeadCreate: EPCActionMenuProps["onLeadCreate"],
  canCreateLead: boolean,
): ActionMenuItem<EpcListItem>[] => [
  {
    id: "create-lead",
    label: "Create Lead",
    Icon: UserPlus,
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
    ariaLabel: `View all leads for ${rowLabel}`,
    onClick: (selectedRow) => {
      const leadInfo = buildEntryInfo(selectedRow);
      localStorage.setItem("LeadInfo", JSON.stringify(leadInfo));

      navigate("/marketing/activity-planner/leads/view", {
        state: { mode: "view", leadInfo },
      });
    },
  },
];

// TODO: route wiring for Machine Study create/view is not confirmed yet
// (per session notes: MachineStudyEntryPage.tsx exists but has no
// route/nav wiring). The "view" path below is a placeholder guess mirroring
// the leads path convention — confirm the real path before this ships,
// otherwise "View machine studies" will 404.
const buildMachineStudyActions = (
  row: EpcListItem,
  rowLabel: string,
  navigate: ReturnType<typeof useNavigate>,
  onMachineStudyCreate: EPCActionMenuProps["onMachineStudyCreate"],
  canCreateMachineStudy: boolean,
): ActionMenuItem<EpcListItem>[] => [
  {
    id: "create-machine-study",
    label: "Create Machine Study",
    Icon: FlaskConical,
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

const EPCActionMenu = ({
  row,
  onLeadCreate,
  onMachineStudyCreate,
  canCreateLead = false,
  canCreateMachineStudy = false,
}: EPCActionMenuProps) => {
  const rowLabel = row.proposal_number || getEventName(row);
  const navigate = useNavigate();

  // sourceType === null/undefined → EventName has no reportTemplateKey
  // mapping. Hide both create/view actions rather than showing a disabled
  // button with no explanation (per explicit product decision).
  let actions: ActionMenuItem<EpcListItem>[] = [];

  if (row.sourceType === "LEAD_FORM") {
    actions = buildLeadActions(
      row,
      rowLabel,
      navigate,
      onLeadCreate,
      canCreateLead,
    );
  } else if (row.sourceType === "DATA_FORM") {
    actions = buildMachineStudyActions(
      row,
      rowLabel,
      navigate,
      onMachineStudyCreate,
      canCreateMachineStudy,
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <ActionMenu<EpcListItem>
      row={row}
      actions={actions}
      ariaLabel={`Open actions for ${rowLabel}`}
    />
  );
};

export default EPCActionMenu;
