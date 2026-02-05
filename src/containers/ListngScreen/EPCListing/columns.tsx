import type { ColumnDef } from "@tanstack/react-table";
import type { EPCRow } from "../types";
import { Badge } from "../../../components/common/Badge";

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
		cell: ({ getValue }) => <Badge status={getValue<Status>()} />,
	},
	{
		accessorKey: "about",
		header: "About",
		cell: ({ getValue }) => (
			<p className="text-gray-600 line-clamp-2">{getValue<Status>()}</p>
		),
	},
];
