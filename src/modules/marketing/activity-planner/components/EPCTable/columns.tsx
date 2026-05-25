import type { ColumnDef } from "@tanstack/react-table";
import { NavLink } from "react-router-dom";

import { Badge } from "../../../../../components/common/Badge";
import { status } from "../../utils/constants";

import type { EpcListItem } from "../../types/epc.types";
import EPCActionMenu from "./EPCActionMenu";
import { formatDate } from "../../utils/formatters";

type EpcColumnActions = {
	onLeadCreate?: (row: EpcListItem) => void;
};

const getCreatedByName = (row: EpcListItem) => {
	const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
	return name || "--";
};

const getEventName = (row: EpcListItem) => {
	if (typeof row.event_name === "string") return row.event_name;
	return row.event_title || "--";
};

export const getStatusForBadge = (apiStatus?: string) => {
	if (!apiStatus) return status.PENDING;

	return (
		status[apiStatus as keyof typeof status] ??
		status[apiStatus.toUpperCase() as keyof typeof status] ??
		status[apiStatus.toLowerCase() as keyof typeof status] ??
		status.PENDING
	);
};

const hasEventStarted = (eventFromDate?: string | null) => {
	if (!eventFromDate) return false;

	const today = new Date();
	const startDate = new Date(eventFromDate);

	today.setHours(0, 0, 0, 0);
	startDate.setHours(0, 0, 0, 0);

	return today >= startDate;
};

const canCreateLead = (row: EpcListItem) => {
	return (
		row.status?.toUpperCase() === "APPROVED" &&
		hasEventStarted(row.event_from_date)
	);
};

export const getEPCColumns = ({
	onLeadCreate,
}: EpcColumnActions): ColumnDef<EpcListItem>[] => [
	{
		accessorKey: "proposal_number",
		header: "EPC No",
		cell: ({ row }) => {
			const epcId = row.original.id;
			console.log("Rendering EPC No cell", { row: row.original });
			return (
				<NavLink
					to={`/marketing/activity-planner/${epcId}`}
					className="text-blue-600 underline"
				>
					<span className="font-medium">
						{row.original.proposal_number || "--"}
					</span>
				</NavLink>
			);
		},
	},
	{
		accessorKey: "event_name",
		header: "Event Name",
		cell: ({ row }) => (
			<span className="font-medium">{getEventName(row.original)}</span>
		),
	},
	{
		accessorKey: "created_by",
		header: "Created By",
		cell: ({ row }) => (
			<span className="font-medium">{getCreatedByName(row.original)}</span>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge status={getStatusForBadge(row.original.status)} />
		),
	},
	{
		accessorKey: "location",
		header: "Location",
		cell: ({ row }) => (
			<span className="font-medium">{row.original?.location || "--"}</span>
		),
	},
	{
		accessorKey: "created_at",
		header: "Created At",
		cell: ({ row }) => (
			<span className="font-medium">
				{formatDate(row.original?.created_at) || "--"}
			</span>
		),
	},
	{
		id: "action",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => (
			<EPCActionMenu
				row={row.original}
				onLeadCreate={onLeadCreate}
				canCreateLead={canCreateLead(row.original)}
			/>
		),
	},
];
