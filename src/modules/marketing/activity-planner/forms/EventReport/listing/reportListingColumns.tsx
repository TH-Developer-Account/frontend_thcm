import type { ColumnDef } from "@tanstack/react-table";
import { NavLink } from "react-router-dom";
import { MapPin } from "lucide-react";

import ActionMenu from "../../../../../../components/common/ActionMenu";
import { formatDate } from "../../../../../../utils/format";
import { REPORT_STATUS_BADGE } from "./reportStatusBadge";

import type { ReportListingRow } from "../eventReport.types";
import type { ActionMenuItem } from "../../../../../../components/common/ActionMenu";

type ReportListingColumnOptions = {
  onView: (row: ReportListingRow) => void;
  onDownload: (row: ReportListingRow) => void;
};

export const getReportListingColumns = ({
  onView,
  onDownload,
}: ReportListingColumnOptions): ColumnDef<ReportListingRow>[] => [
  {
    accessorKey: "proposalNumber",
    header: "EPC No",
    cell: ({ row }) => {
      const { id, proposal_number } = row.original.epc;
      return (
        <NavLink
          to={`/marketing/activity-planner/${id}`}
          className="table-link font-medium"
        >
          {proposal_number}
        </NavLink>
      );
    },
  },
  {
    accessorKey: "event",
    header: "Event",
    cell: ({ row }) => {
      const { event_name, location } = row.original.epc;
      return (
        <div className="min-w-0">
          <div
            className="truncate font-medium text-gray-900"
            title={event_name?.title || "--"}
          >
            {event_name?.title || "--"}
          </div>
          {location ? (
            <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) => {
      const creator = row.original.epc.created_by;
      return creator ? `${creator.first_name} ${creator.last_name}` : "--";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const badge = REPORT_STATUS_BADGE[row.original.status];
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      );
    },
  },
  {
    accessorKey: "submittedAt",
    header: "Created",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        {formatDate(row.original.submittedAt)}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const report = row.original;
      const rowLabel = report.epc.proposal_number;

      const actions: ActionMenuItem<ReportListingRow>[] = [
        {
          id: "view",
          label: "View EPC",
          ariaLabel: `View epc for ${rowLabel}`,
          onClick: onView,
        },
        {
          id: "download",
          label: "Download PDF",
          hidden: !report.hasPdf,
          ariaLabel: `Download report PDF for ${rowLabel}`,
          onClick: onDownload,
        },
      ];

      return (
        <ActionMenu<ReportListingRow>
          row={report}
          actions={actions}
          ariaLabel={`Open actions for ${rowLabel}`}
        />
      );
    },
  },
];
