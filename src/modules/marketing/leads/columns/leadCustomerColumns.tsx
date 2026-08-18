import type { ColumnDef } from "@tanstack/react-table";
import { NavLink } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../../components/common/ActionMenu";
import { formatDate } from "../../../../utils/format";

import type { LeadEventGroup, LeadRow } from "../types/leads.types";

type GroupedLeadColumnOptions = {
	onViewLeads: (group: LeadEventGroup) => void;
	onCreateLead?: (group: LeadEventGroup) => void;
	canCreateLead?: (group: LeadEventGroup) => boolean;
};

export const getLeadCustomerColumns = (): ColumnDef<LeadRow>[] => [
	{
		accessorKey: "proposalNumber",
		header: "EPC No",
		cell: ({ row }) => {
			const { epcId, proposalNumber } = row.original;

			return epcId ? (
				<NavLink
					to={`/marketing/activity-planner/${epcId}`}
					className="table-link"
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
			<div className="min-w-0">
				<div
					className="truncate font-medium"
					title={row.original.event_name || "--"}
				>
					{row.original.event_name || "--"}
				</div>

				<div
					className="truncate text-xs max-w-50  text-muted"
					title={row.original.location || "--"}
				>
					{row.original.location || "--"}
				</div>
			</div>
		),
	},
	{
		accessorKey: "name",
		header: "Lead Name",
		cell: ({ row }) => (
			<div className="truncate font-medium" title={row.original.name || "--"}>
				{row.original.name || "--"}
			</div>
		),
	},
	{
		accessorKey: "phone",
		header: "Phone",
		cell: ({ row }) => row.original.phone || "--",
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => (
			<div className="max-w-60 truncate" title={row.original.email || "--"}>
				{row.original.email || "--"}
			</div>
		),
	},
	{
		accessorKey: "notes",
		header: "Notes",
		cell: ({ row }) => (
			<div className="max-w-60 truncate" title={row.original.notes || "--"}>
				{row.original.notes || "--"}
			</div>
		),
	},
	{
		accessorKey: "created_at",
		header: "Created On",
		cell: ({ row }) =>
			row.original.created_at ? formatDate(row.original.created_at) : "--",
	},
];

export const getGroupedLeadColumns = ({
	onViewLeads,
	onCreateLead,
	canCreateLead,
}: GroupedLeadColumnOptions): ColumnDef<LeadEventGroup>[] => [
	{
		accessorKey: "proposalNumber",
		header: "Proposal Number",
		cell: ({ row }) => {
			const { epcId, proposalNumber } = row.original;

			return epcId ? (
				<NavLink
					to={`/marketing/activity-planner/${epcId}`}
					className="table-link"
				>
					{proposalNumber || epcId}
				</NavLink>
			) : (
				<span>{proposalNumber || "--"}</span>
			);
		},
	},
	{
		accessorKey: "event_name",
		header: "Event Name",
		cell: ({ row }) => (
			<div className="min-w-0">
				<div
					className="truncate font-medium"
					title={row.original.event_name || "--"}
				>
					{row.original.event_name || "--"}
				</div>

				<div
					className="truncate text-xs max-w-50  text-muted"
					title={row.original.location || "--"}
				>
					{row.original.location || "--"}
				</div>
			</div>
		),
	},
	{
		accessorKey: "lead_count",
		header: "Leads",
		cell: ({ row }) => row.original.lead_count ?? 0,
	},
	{
		accessorKey: "created_at",
		header: "Created On",
		cell: ({ row }) =>
			row.original.created_at ? formatDate(row.original.created_at) : "--",
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const group = row.original;
			const rowLabel = group.proposalNumber || group.event_name || "EPC";

			const isCreateAllowed =
				Boolean(onCreateLead) && Boolean(canCreateLead?.(group));

			const actions: ActionMenuItem<LeadEventGroup>[] = [
				{
					id: "view-leads",
					label: "View all leads",
					Icon: Users,
					ariaLabel: `View all leads for ${rowLabel}`,
					onClick: onViewLeads,
				},
				{
					id: "create-lead",
					label: "Create Lead",
					Icon: UserPlus,
					hidden: !isCreateAllowed,
					ariaLabel: `Create lead for ${rowLabel}`,
					onClick: (selectedGroup) => {
						onCreateLead?.(selectedGroup);
					},
				},
			];

			return (
				<ActionMenu<LeadEventGroup>
					row={group}
					actions={actions}
					ariaLabel={`Open actions for ${rowLabel}`}
				/>
			);
		},
	},
];
