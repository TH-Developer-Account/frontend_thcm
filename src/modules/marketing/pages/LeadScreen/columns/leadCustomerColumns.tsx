import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../../components/common/Badge";
import { status } from "../../../constant";
import { formatDate } from "../../../../../utils/format";
import type { LeadRow } from "../types/leads.types";

export const getLeadCustomerColumns = (): ColumnDef<LeadRow>[] => [
	{
		id: "name",
		header: "Lead Name",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.name || "--"}</div>
		),
	},
	{
		accessorKey: "phone",
		header: "Phone Number",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.phone || "--"}</div>
		),
	},
	{
		accessorKey: "email",
		header: "Lead Email",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.email || "--"}</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge
				status={
					status[row.original.status as keyof typeof status] ||
					row.original.status ||
					"--"
				}
			/>
		),
	},
	{
		accessorKey: "notes",
		header: "Remarks",
		cell: ({ row }) => (
			<div className="max-w-[240px] truncate">{row.original.notes || "--"}</div>
		),
	},
	{
		accessorKey: "created_at",
		header: "Created On",
		cell: ({ row }) => (
			<div className="font-medium">
				{row.original.created_at ? formatDate(row.original.created_at) : "--"}
			</div>
		),
	},
];
