import type { ColumnDef } from "@tanstack/react-table";
import type { EPCRow } from "../types";
import { Badge, type Status } from "../../../components/common/Badge";

export const columns: ColumnDef<EPCRow>[] = [
  {
    accessorKey: "proposal_number",
    header: "EPF No",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.proposal_number}</div>
      </div>
    ),
  },
  {
    accessorKey: "event_name",
    header: "Event Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.event_name.description}</div>
      </div>
    ),
  },
  {
    accessorKey: "event_description",
    header: "Event Description",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.event_description}</div>
      </div>
    ),
  },
  {
    accessorKey: "created_by",
    header: "Created By",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.created_by}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge status={row.original.status as Status} />,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.location}</div>
      </div>
    ),
  },
];
