// columns/leadCustomerColumns.tsx

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../../../components/common/Badge";
import { status } from "../../../../constant";
import { formatDate } from "../../../../../../utils/format";
import type { LeadRow } from "../../types/leads.types";

const getLeadName = (row: LeadRow) => {
	const fullName = `${row.lead_first_name || ""} ${
		row.lead_last_name || ""
	}`.trim();

	return fullName || "--";
};

export const getLeadCustomerColumns = (): ColumnDef<LeadRow>[] => [
	{
		accessorKey: "lead_no",
		header: "Lead No",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.lead_no || "--"}</div>
		),
	},
	{
		id: "lead_name",
		header: "Customer Name",
		cell: ({ row }) => (
			<div className="font-medium">{getLeadName(row.original)}</div>
		),
	},
	{
		accessorKey: "lead_contact_no",
		header: "Phone Number",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.lead_contact_no || "--"}</div>
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
			<div className="max-w-[240px] truncate">
				{row.original.remarks || "--"}
			</div>
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
