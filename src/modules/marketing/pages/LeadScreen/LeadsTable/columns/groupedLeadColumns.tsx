// columns/groupedLeadColumns.tsx

import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import Button from "../../../../../../components/common/Button";
import { NavLink } from "react-router-dom";
import { formatDate } from "../../../../../../utils/format";
import type { LeadEventGroup } from "../../types/leads.types";

type GroupedLeadColumnActions = {
	onViewLeads: (group: LeadEventGroup) => void;
};

export const getGroupedLeadColumns = ({
	onViewLeads,
}: GroupedLeadColumnActions): ColumnDef<LeadEventGroup>[] => [
	{
		accessorKey: "proposal_number",
		header: "EPC No",
		cell: ({ row }) => (
			<NavLink
				to={`/marketing/activity-planner/${row.original.epc_id}`}
				className="text-blue-600 underline"
			>
				<div className="font-medium">
					{row.original.proposal_number || "--"}
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
			<div className="font-medium">{formatDate(row.original.created_at)}</div>
		),
	},
	{
		id: "action",
		header: "Actions",
		cell: ({ row }) => (
			<Button
				type="button"
				text="View Leads"
				Icon={Eye}
				status="outline"
				size="sm"
				className="text-xs"
				onClick={() => onViewLeads(row.original)}
			/>
		),
	},
];
