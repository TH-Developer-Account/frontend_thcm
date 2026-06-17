import type { ColumnDef } from "@tanstack/react-table";
import { NavLink } from "react-router-dom";
import { formatDate } from "../../../../../utils/format";
import type { FileModuleListingRow } from "./fileModule.types";
import { Badge } from "../../../../../components/common/Badge";

export const getFilesListingColumns = (): ColumnDef<FileModuleListingRow>[] => [
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
		accessorKey: "fileName",
		header: "File Name",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.fileName || "--"}</div>
		),
	},
	{
		accessorKey: "event_name",
		header: "Event Name",
		cell: ({ row }) => (
			<div className="font-medium">{row.original.event_name || "--"}</div>
		),
	},
	{
		accessorKey: "updated_at",
		header: "Updated On",
		cell: ({ row }) => (
			<div className="font-medium">
				{row.original.updated_at
					? formatDate(row.original.updated_at)
					: formatDate(row.original.created_at)}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<div className="font-medium">
				<Badge status={row.original.status} />
			</div>
		),
	},
];
