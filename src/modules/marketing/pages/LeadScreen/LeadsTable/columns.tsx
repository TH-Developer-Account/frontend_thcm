import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../../../../../components/common/Badge";
import { status } from "../../../constant";
import Button from "../../../../../components/common/Button";
import { Eye, Pencil } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { LeadRow } from "../types/leads.types";
import { formatDate } from "../../../../../utils/format";

type LeadColumnActions = {
	onView: (lead: LeadRow) => void;
	onEdit: (lead: LeadRow) => void;
};

const getLeadName = (row: LeadRow) => {
	const fullName = `${row.lead_first_name || ""} ${
		row.lead_last_name || ""
	}`.trim();

	return fullName || "--";
};

export const getLeadColumns = ({
	onView,
	onEdit,
}: LeadColumnActions): ColumnDef<LeadRow>[] => [
	{
		accessorKey: "lead_no",
		header: "Lead No",
		cell: ({ row }) => (
			<div>
				<NavLink
					to={`/marketing/leads/${row.original.id}`}
					className="text-blue-600 underline"
				>
					<div className="font-medium">{row.original.lead_no}</div>
				</NavLink>
			</div>
		),
	},
	{
		accessorKey: "proposal_number",
		header: "EPC No",
		cell: ({ row }) => (
			<div>
				<NavLink
					to={`/marketing/activity-planner/${row.original.epc_id}`}
					className="text-blue-600 underline"
				>
					<div className="font-medium">
						{row.original.proposal_number || "--"}
					</div>
				</NavLink>
			</div>
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
		id: "lead_name",
		header: "Lead Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{getLeadName(row.original)}</div>
			</div>
		),
	},
	{
		accessorKey: "lead_contact_no",
		header: "Contact No",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">
					{row.original.lead_contact_no || "--"}
				</div>
			</div>
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
			<div className="max-w-[220px] truncate">
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
	{
		id: "action",
		header: "Actions",
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				<Button
					className="rounded-full p-1.5"
					Icon={Eye}
					status="secondary"
					onClick={() => onView(row.original)}
				/>

				<Button
					className="rounded-full p-1.5"
					Icon={Pencil}
					status="brand"
					iconColor="#fff"
					onClick={() => onEdit(row.original)}
				/>
			</div>
		),
	},
];
