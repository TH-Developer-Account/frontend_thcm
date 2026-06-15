import type { ColumnDef } from "@tanstack/react-table";
import { NavLink } from "react-router-dom";
import { formatDate } from "../../../../../utils/format";
import type { LeadRow } from "../types/leads.types";

export const getLeadCustomerColumns = (): ColumnDef<LeadRow>[] => [
	{
		accessorKey: "proposalNumber",
		header: "EPC No",
		cell: ({ row }) => {
			const { epcId, proposalNumber } = row.original;

			return epcId ? (
				<NavLink
					to={`/marketing/activity-planner/${epcId}`}
					className="font-medium text-blue-600 underline"
				>
					{proposalNumber || epcId}
				</NavLink>
			) : (
				<span>--</span>
			);
		},
	},
	{
		accessorKey: "event_name",
		header: "Event Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.event_name || "--"}</div>
				<div className="text-xs text-gray-500">
					{row.original.location || "--"}
				</div>
			</div>
		),
	},
	{
		accessorKey: "name",
		header: "Lead Name",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.name || "--"}</div>
		),
	},
	{
		accessorKey: "phone",
		header: "Phone Number",
		cell: ({ row }) => <div>{row.original.phone || "--"}</div>,
	},
	{
		accessorKey: "email",
		header: "Lead Email",
		cell: ({ row }) => <div>{row.original.email || "--"}</div>,
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
