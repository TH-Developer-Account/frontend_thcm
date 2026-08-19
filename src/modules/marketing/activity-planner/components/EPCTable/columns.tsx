import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, MapPin } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Badge } from "../../../../../components/common/Badge";
import { trimText } from "../../../../../utils/format";
import type { EpcListItem } from "../../types/epc.types";
import { formatDate } from "../../utils/formatters";

import EPCActionMenu from "./EPCActionMenu";

type EpcColumnActions = {
  onLeadCreate?: (row: EpcListItem) => void;
  onMachineStudyCreate?: (row: EpcListItem) => void;
  currentUserId?: string;
};

const getCreatedByName = (row: EpcListItem) => {
  const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return name || "--";
};

const getEventName = (row: EpcListItem) => {
  if (typeof row.event_name === "string") return row.event_name;
  return row.event_title || "--";
};

const hasEventStarted = (eventFromDate?: string | null) => {
  if (!eventFromDate) return false;

  const today = new Date();
  const startDate = new Date(eventFromDate);

  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  return today >= startDate;
};

// Shared eligibility rule for both Lead and Machine Study creation —
// confirmed by Fazal to be identical (APPROVED, or CONDUCTED once the
// event has started). Kept as two named functions rather than one
// generically-named helper: they read the same today, but Lead and
// Machine Study are different domain actions and the rule diverging
// later (e.g. Machine Study needing CONDUCTED only) shouldn't require
// un-abstracting a shared function under time pressure.
const canCreateLead = (row: EpcListItem) =>
  row.status?.toUpperCase() === "APPROVED" ||
  (row.status?.toUpperCase() === "CONDUCTED" &&
    hasEventStarted(row.event_from_date));

const canCreateMachineStudy = (row: EpcListItem) =>
  row.status?.toUpperCase() === "APPROVED" ||
  (row.status?.toUpperCase() === "CONDUCTED" &&
    hasEventStarted(row.event_from_date));

export const getEPCColumns = ({
  onLeadCreate,
  onMachineStudyCreate,
}: EpcColumnActions): ColumnDef<EpcListItem>[] => [
  {
    accessorKey: "proposal_number",
    header: "EPC No",
    meta: {
      headerClassName: "epc-column-number",
      cellClassName: "epc-column-number",
    },
    cell: ({ row }) => (
      <NavLink
        to={`/marketing/activity-planner/${row.original.id}`}
        className="epc-number-link"
      >
        {row.original.proposal_number || "--"}
      </NavLink>
    ),
  },
  {
    accessorKey: "event_name",
    header: "Event",
    meta: {
      headerClassName: "epc-column-event",
      cellClassName: "epc-column-event",
    },
    cell: ({ row }) => (
      <div className="epc-event-cell">
        <span className="epc-event-name">{getEventName(row.original)}</span>
        {row.original.location ? (
          <span className="epc-event-meta">
            <MapPin size={12} aria-hidden="true" />
            {trimText(row.original.location, 60)}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "created_by",
    header: "Created By",
    meta: {
      headerClassName: "epc-column-owner",
      cellClassName: "epc-column-owner",
    },
    cell: ({ row }) => (
      <span className="epc-cell-primary">{getCreatedByName(row.original)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      headerClassName: "epc-column-status",
      cellClassName: "epc-column-status",
    },
    cell: ({ row }) => <Badge status={row.original.status} />,
  },

  {
    accessorKey: "created_at",
    header: "Created",
    meta: {
      headerClassName: "epc-column-date",
      cellClassName: "epc-column-date",
    },
    cell: ({ row }) => (
      <span className="epc-date-cell">
        <CalendarDays size={12} aria-hidden="true" />
        {formatDate(row.original.created_at) || "--"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const epc = row.original;

      return (
        <EPCActionMenu
          row={epc}
          canCreateLead={canCreateLead(epc)}
          onLeadCreate={onLeadCreate}
          canCreateMachineStudy={canCreateMachineStudy(epc)}
          onMachineStudyCreate={onMachineStudyCreate}
        />
      );
    },
  },
];
