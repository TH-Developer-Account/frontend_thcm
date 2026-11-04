import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import { trimText } from "../../../../../utils/format";
import type { EpcListItem } from "../../types/epc.types";

import { canOpenEpcView } from "../../forms/EPC/epc.utils";
import { formatDate } from "../../utils/formatters";
import { getEpcOpenRoute } from "../../utils/epcClarification";
import EPCActionMenu from "./EPCActionMenu";
import { formatPendingOn } from "../../../../../utils/statusAlert.helper";
import { Badge } from "../../../../../components/common/Badge";

type EpcColumnActions = {
	onLeadCreate?: (row: EpcListItem) => void;
	onMachineStudyCreate?: (row: EpcListItem) => void;
	currentUserId?: string;
};

const getCreatedByName = (row: EpcListItem) => {
	const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
	return name || "--";
};

const getEventName = (row: EpcListItem) => {
	if (typeof row.event_name === "string") return row.event_name;
	return row.event_title || "--";
};

const hasEventStarted = (eventFromDate?: string | null) => {
	if (!eventFromDate) return false;

	const today = new Date();
	const startDate = new Date(eventFromDate);

	today.setHours(0, 0, 0, 0);
	startDate.setHours(0, 0, 0, 0);

	return today >= startDate;
};

const canCreateLead = (row: EpcListItem) =>
	row.status?.toUpperCase() === "APPROVED" ||
	(row.status?.toUpperCase() === "CONDUCTED" && true);

// "View all leads" is useful only once leads can exist (event approved /
// conducted) or already do (leads were added at some point, e.g. before the
// event was marked Not Conducted).
const canViewLeads = (row: EpcListItem) => {
	const status = row.status?.toUpperCase();
	return status === "APPROVED" || status === "CONDUCTED";
};

const canCreateMachineStudy = (row: EpcListItem) =>
	row.status?.toUpperCase() === "APPROVED" ||
	(row.status?.toUpperCase() === "CONDUCTED" &&
		hasEventStarted(row.event_from_date));

export const getEPCColumns = ({
	onLeadCreate,
	onMachineStudyCreate,
	currentUserId,
}: EpcColumnActions): ColumnDef<EpcListItem>[] => [
	{
		accessorKey: "proposal_number",
		header: "EPC No",
		meta: {
			headerClassName: "epc-column-number",
			cellClassName: "epc-column-number",
		},
		cell: ({ row }) => {
			const proposalNumber = row.original.proposal_number || "--";

			// Same rule as the menu's "View": submitted → anyone with access;
			// not submitted → only its creator. Otherwise plain text.
			if (!canOpenEpcView(row.original, currentUserId)) {
				return (
					<span
						className="epc-cell-primary"
						title="Available after the EPC is submitted"
					>
						{proposalNumber}
					</span>
				);
			}

			// Not finally submitted → continue in the stepper (EPC Details step).
			// Submitted → the read-only view page.
			const { to, state } = getEpcOpenRoute(row.original, currentUserId);

			return (
				<Link
					to={to}
					state={state}
					className="epc-number-link"
					onClick={(e) => e.stopPropagation()}
				>
					{proposalNumber}
				</Link>
			);
		},
	},
	{
		accessorKey: "event_name",
		header: "Event",
		meta: {
			headerClassName: "epc-column-event",
			cellClassName: "epc-column-event",
		},
		cell: ({ row }) => (
			<div className="epc-event-cell">
				<span className="epc-event-name">{getEventName(row.original)}</span>
				{row.original.location ? (
					<span className="epc-event-meta">
						<MapPin size={12} aria-hidden="true" />
						{trimText(row.original.location, 60)}
					</span>
				) : null}
			</div>
		),
	},
	{
		accessorKey: "created_by",
		header: "Created By",
		meta: {
			headerClassName: "epc-column-owner",
			cellClassName: "epc-column-owner",
		},
		cell: ({ row }) => (
			<span className="epc-cell-primary">{getCreatedByName(row.original)}</span>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		meta: {
			headerClassName: "epc-column-status",
			cellClassName: "epc-column-status",
		},
		cell: ({ row }) => (
			<Badge
				status={formatPendingOn(row.original.pendingOn, row.original.status)}
			/>
		),
	},
	{
		accessorKey: "created_at",
		header: "Created",
		meta: {
			headerClassName: "epc-column-date",
			cellClassName: "epc-column-date",
		},
		cell: ({ row }) => (
			<span className="epc-date-cell">
				<CalendarDays size={12} aria-hidden="true" />
				{formatDate(row.original.created_at) || "--"}
			</span>
		),
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const epc = row.original;

			return (
				<EPCActionMenu
					row={epc}
					// The menu needs currentUserId to decide Edit / Add CRF / Add EPF.
					currentUserId={currentUserId}
					canCreateLead={canCreateLead(epc)}
					canViewLeads={canViewLeads(epc)}
					onLeadCreate={onLeadCreate}
					canCreateMachineStudy={canCreateMachineStudy(epc)}
					onMachineStudyCreate={onMachineStudyCreate}
				/>
			);
		},
	},
];
