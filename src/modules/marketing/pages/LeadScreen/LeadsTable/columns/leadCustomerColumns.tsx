// columns/leadCustomerColumns.tsx

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../../../components/common/Badge";
import { status } from "../../../../constant";
import { formatDate } from "../../../../../../utils/format";
import type { LeadRow } from "../../types/leads.types";

const getLeadName = (row: LeadRow) => {
	const fullName = row.name;

	return fullName || "--";
};

export const getLeadCustomerColumns = (): ColumnDef<LeadRow>[] => [
	{
		id: "lead_name",
		header: "Lead Name",
		cell: ({ row }) => (
			<div className="font-medium">{getLeadName(row.original)}</div>
		),
	},
	{
		accessorKey: "lead_contact_no",
		header: "Phone Number",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.phone || "--"}</div>
		),
	},
	{
		accessorKey: "lead_email",
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
					row.original.status
				}
			/>
		),
	},
	{
		accessorKey: "remarks",
		header: "Remarks",
		cell: ({ row }) => (
			<div className="max-w-[240px] truncate">{row.original.notes || "--"}</div>
		),
	},
	{
		accessorKey: "created_at",
		header: "Created On",
		cell: ({ row }) => (
			<div className="font-medium">{formatDate(row.original.created_at)}</div>
		),
	},
];
