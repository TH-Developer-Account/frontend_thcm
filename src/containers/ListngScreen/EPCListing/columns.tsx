import type { ColumnDef } from "@tanstack/react-table";
import type { EPCRow } from "../../../utils/types";
import { Badge } from "../../../components/common/Badge";
import { status } from "../constant";
import Button from "../../../components/common/Button";
import { Edit } from "lucide-react";

export const columns: ColumnDef<EPCRow>[] = [
	{
		accessorKey: "proposal_number",
		header: "EPF No",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{row.original.proposal_number}</div>
			</div>
		),
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
	// {
	// 	accessorKey: "event_description",
	// 	header: "Event Description",
	// 	cell: ({ row }) => (
	// 		<div>
	// 			<div className="font-medium">{row.original.event_description}</div>
	// 		</div>
	// 	),
	// },
	{
		accessorKey: "created_by",
		header: "Created By",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">{`${row.original.first_name} ${row.original.last_name}`}</div>
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
		accessorKey: "epf",
		header: "EPF",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">
					<Button
						text=""
						className="bg-gray-400 text-orange-900"
						type="submit"
						Icon={Edit}
						iconPosition="right"
					/>
				</div>
			</div>
		),
	},
	{
		accessorKey: "crf",
		header: "CRF",
		cell: ({ row }) => (
			<div>
				<div className="font-medium">
					<Button
						text=""
						type="submit"
						className="bg-gray-400 text-orange-900"
						Icon={Edit}
						iconPosition="right"
					/>
				</div>
			</div>
		),
	},
];
