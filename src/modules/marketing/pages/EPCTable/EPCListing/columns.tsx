import type { ColumnDef } from "@tanstack/react-table";
import type { EPCRow } from "../../../../../utils/types";
import { Badge } from "../../../../../components/common/Badge";
import { status } from "../../../constant";
import { NavLink } from "react-router-dom";
import EPCActionMenu from "./EPCActionMenu";

type epcColumnActions = {
	onLeadCreate?: () => void;
};

export const getEPCColumns = ({
	onLeadCreate,
}: epcColumnActions): ColumnDef<EPCRow>[] => [
	{
		accessorKey: "proposal_number",
		header: "EPC No",
		cell: ({ row }) => {
			const epcId = row.original.id;

			return (
				<div>
					<NavLink
						to={`/marketing/epf/${epcId}`}
						className="text-blue-600 underline"
					>
						<div className="font-medium">{row.original.proposal_number}</div>
					</NavLink>
				</div>
			);
		},
	},
	{
		accessorKey: "event_name",
		header: "Event Name",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.event_name}</div>
			</div>
		),
	},
	{
		accessorKey: "created_by",
		header: "Created By",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">
					{`${row.original.first_name} ${row.original.last_name}`}
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
					status[(row.original.status as keyof typeof status) || "Pending"]
				}
			/>
		),
	},
	{
		accessorKey: "location",
		header: "Location",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.location}</div>
			</div>
		),
	},
	{
		id: "action",
		header: "Actions",
		cell: ({ row }) => (
			<EPCActionMenu row={row.original} onLeadCreate={onLeadCreate} />
		),
	},
];
