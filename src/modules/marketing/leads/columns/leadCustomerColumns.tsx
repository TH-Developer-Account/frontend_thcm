import type { ColumnDef } from "@tanstack/react-table";
import { NavLink } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

import ActionMenu, {
  type ActionMenuItem,
} from "../../../../components/common/ActionMenu";
import { formatDate } from "../../../../utils/format";

import { FIELD_LABELS } from "../helpers/lead.fieldConfig";
import type {
  LeadEventGroup,
  LeadFormFieldKey,
  LeadRow,
} from "../types/leads.types";
import {
  PARTICIPANT_STATUS_LABELS,
  PARTICIPANT_TYPE_LABELS,
} from "../types/leads.types";

type GroupedLeadColumnOptions = {
  onViewLeads: (group: LeadEventGroup) => void;
  onCreateLead?: (group: LeadEventGroup) => void;
  canCreateLead?: (group: LeadEventGroup) => boolean;
};

// ── Formats a LeadRow's value for a given config field for table display.
// Mirrors the label/enum lookups already used in the entry form, so the
// saved-leads table and the entry form never disagree on how a value reads. ─
const formatCellValue = (lead: LeadRow, field: LeadFormFieldKey): string => {
  switch (field) {
    case "eventDate":
      return lead.eventDate ? formatDate(lead.eventDate) : "--";
    case "participantType":
      return lead.participantType
        ? PARTICIPANT_TYPE_LABELS[lead.participantType]
        : "--";
    case "participantStatus":
      return lead.participantStatus
        ? PARTICIPANT_STATUS_LABELS[lead.participantStatus]
        : "--";
    case "valueOfServiceOffers":
      return lead.valueOfServiceOffers != null
        ? lead.valueOfServiceOffers.toLocaleString("en-IN")
        : "--";
    case "valueOfPartsOffers":
      return lead.valueOfPartsOffers != null
        ? lead.valueOfPartsOffers.toLocaleString("en-IN")
        : "--";
    case "valueOfPartsBilled":
      return lead.valueOfPartsBilled != null
        ? lead.valueOfPartsBilled.toLocaleString("en-IN")
        : "--";
    case "name":
      return lead.name || "--";
    case "email":
      return lead.email || "--";
    case "phone":
      return lead.phone || "--";
    case "companyName":
      return lead.companyName || "--";
    case "dealership":
      return lead.dealership || "--";
    case "location":
      return lead.location || "--";
    case "district":
      return lead.district || "--";
    case "state":
      return lead.state || "--";
    case "machineModel":
      return lead.machineModel || "--";
    case "machineSerial":
      return lead.machineSerial || "--";
    case "notes":
      return lead.notes || "--";
    default:
      return "--";
  }
};

// ── Every LeadRow-driven table (LeadEntryTable's saved-leads section, and
// potentially others later) builds its columns from this, keyed off the
// same `fields` array LeadFormConfig returns — one column set per variant,
// not a fixed hardcoded list. ────────────────────────────────────────────
export const buildLeadColumns = (
  fields: LeadFormFieldKey[],
): ColumnDef<LeadRow>[] => {
  const proposalColumn: ColumnDef<LeadRow> = {
    accessorKey: "proposalNumber",
    header: "EPC No",
    cell: ({ row }) => {
      const { epcId, proposalNumber } = row.original;
      return epcId ? (
        <NavLink
          to={`/marketing/activity-planner/${epcId}`}
          className="table-link"
        >
          {proposalNumber || epcId}
        </NavLink>
      ) : (
        <span>--</span>
      );
    },
  };

  const eventNameColumn: ColumnDef<LeadRow> = {
    accessorKey: "event_name",
    header: "Event Name",
    cell: ({ row }) => (
      <div className="min-w-0">
        <div
          className="truncate font-medium"
          title={row.original.event_name || "--"}
        >
          {row.original.event_name || "--"}
        </div>
        <div
          className="truncate text-xs max-w-50 text-muted"
          title={row.original.epcLocation || "--"}
        >
          {row.original.epcLocation || "--"}
        </div>
      </div>
    ),
  };

  const fieldColumns: ColumnDef<LeadRow>[] = fields.map((field) => ({
    accessorKey: field,
    header: FIELD_LABELS[field],
    cell: ({ row }) => {
      const value = formatCellValue(row.original, field);
      return (
        <div className="max-w-60 truncate" title={value}>
          {value}
        </div>
      );
    },
  }));

  const createdAtColumn: ColumnDef<LeadRow> = {
    accessorKey: "created_at",
    header: "Created On",
    cell: ({ row }) =>
      row.original.created_at ? formatDate(row.original.created_at) : "--",
  };

  return [proposalColumn, eventNameColumn, ...fieldColumns, createdAtColumn];
};

// ─────────────────────────────────────────────────────────────────────────────
// Grouped view — unchanged, operates on LeadEventGroup, not variant-dependent
// (grouping is by EPC, one row per event regardless of that event's form
// variant).
// ─────────────────────────────────────────────────────────────────────────────

export const getGroupedLeadColumns = ({
  onViewLeads,
  onCreateLead,
  canCreateLead,
}: GroupedLeadColumnOptions): ColumnDef<LeadEventGroup>[] => [
  {
    accessorKey: "proposalNumber",
    header: "Proposal Number",
    cell: ({ row }) => {
      const { epcId, proposalNumber } = row.original;
      return epcId ? (
        <NavLink
          to={`/marketing/activity-planner/${epcId}`}
          className="table-link"
        >
          {proposalNumber || epcId}
        </NavLink>
      ) : (
        <span>{proposalNumber || "--"}</span>
      );
    },
  },
  {
    accessorKey: "event_name",
    header: "Event Name",
    cell: ({ row }) => (
      <div className="min-w-0">
        <div
          className="truncate font-medium"
          title={row.original.event_name || "--"}
        >
          {row.original.event_name || "--"}
        </div>
        <div
          className="truncate text-xs max-w-50 text-muted"
          title={row.original.location || "--"}
        >
          {row.original.location || "--"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "lead_count",
    header: "Leads",
    cell: ({ row }) => row.original.lead_count ?? 0,
  },
  {
    accessorKey: "created_at",
    header: "Created On",
    cell: ({ row }) =>
      row.original.created_at ? formatDate(row.original.created_at) : "--",
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const group = row.original;
      const rowLabel = group.proposalNumber || group.event_name || "EPC";
      const isCreateAllowed =
        Boolean(onCreateLead) && Boolean(canCreateLead?.(group));

      const actions: ActionMenuItem<LeadEventGroup>[] = [
        {
          id: "view-leads",
          label: "View all leads",
          Icon: Users,
          ariaLabel: `View all leads for ${rowLabel}`,
          onClick: onViewLeads,
        },
        {
          id: "create-lead",
          label: "Create Lead",
          Icon: UserPlus,
          hidden: !isCreateAllowed,
          ariaLabel: `Create lead for ${rowLabel}`,
          onClick: (selectedGroup) => {
            onCreateLead?.(selectedGroup);
          },
        },
      ];

      return (
        <ActionMenu<LeadEventGroup>
          row={group}
          actions={actions}
          ariaLabel={`Open actions for ${rowLabel}`}
        />
      );
    },
  },
];
