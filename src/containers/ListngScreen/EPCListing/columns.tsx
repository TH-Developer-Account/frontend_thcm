import type { ColumnDef } from "@tanstack/react-table";
import StatusBadge from "./StatusBadge";
import type { EPCRow, Status } from "../types";

export const columns: ColumnDef<EPCRow>[] = [
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.company}</div>
        <div className="text-xs text-gray-500">{row.original.domain}</div>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email address",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue<Status>()} />,
  },
  {
    accessorKey: "about",
    header: "About",
    cell: ({ getValue }) => (
      <p className="text-gray-600 line-clamp-2">{getValue<Status>()}</p>
    ),
  },
];
