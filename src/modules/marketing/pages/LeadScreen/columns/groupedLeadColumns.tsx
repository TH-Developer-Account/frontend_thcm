import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { NavLink } from "react-router-dom";
import { formatDate } from "../../../../../utils/format";
import type { LeadEventGroup } from "../types/leads.types";

type GroupedLeadColumnActions = {
	onViewLeads?: (group: LeadEventGroup) => void;
};

export const getGroupedLeadColumns = ({
	onViewLeads,
}: GroupedLeadColumnActions): ColumnDef<LeadEventGroup>[] => [
	{
		accessorKey: "proposalNumber",
		header: "EPC No",
		cell: ({ row }) => (
			<NavLink
				to={`/marketing/activity-planner/${row.original.epcId}`}
				className="text-blue-600 underline"
			>
				<div className="font-medium">
					{row.original.proposalNumber || row.original.epcId || "--"}
				</div>
			</NavLink>
		),
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
		accessorKey: "lead_count",
		header: "Total Leads",
		cell: ({ row }) => (
			<span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
				{row.original.lead_count} Leads
			</span>
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
	{
		id: "action",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => (
			<button
				type="button"
				className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-orange-50 hover:text-orange-700"
				onClick={(event) => {
					event.stopPropagation();
					onViewLeads?.(row.original);
				}}
			>
				<Eye size={14} />
				View Leads
			</button>
		),
	},
];
