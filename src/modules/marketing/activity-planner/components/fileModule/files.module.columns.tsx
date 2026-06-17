import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "../../../../../utils/format";
import type { FileModuleListingRow } from "../../types/fileModule.types";
import { Badge } from "../../../../../components/common/Badge";

export const getFilesListingColumns = (): ColumnDef<FileModuleListingRow>[] => [
	{
		accessorKey: "proposalNumber",
		header: "EPC No",
		cell: ({ row }) => {
			<div className="font-medium">{row.original.created_at || "--"}</div>;
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
		cell: ({ row }) => {
			console.log("epc no", row.original.proposal_number);
			return (
				<div className="font-medium">
					<Badge status={row.original.status} />
				</div>
			);
		},
	},
];
