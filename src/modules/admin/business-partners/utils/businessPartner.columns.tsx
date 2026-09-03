import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../../components/common/Button";
// import { formatDate } from "../../../../utils/format";
import type { BusinessPartner } from "../utils/bp.types";
import { Badge } from "../../../../components/common/Badge";

export const getBusinessPartnerColumns = (
	onView: (partner: BusinessPartner) => void,
): ColumnDef<BusinessPartner>[] => [
	{
		accessorKey: "internalId",
		header: "Internal ID",
		enableSorting: true,
		cell: ({ row }) => (
			<span className="font-medium tabular-nums">
				{row.original.internalId || "--"}
			</span>
		),
	},

	{
		accessorKey: "organizationName",
		header: "Organization Name",
		enableSorting: true,
		cell: ({ row }) => (
			<span className="font-medium">
				{row.original.organizationName || "--"}
			</span>
		),
	},
	{
		accessorKey: "bpType",
		header: "Business Partner Type",
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.bpType || "--"}</span>,
	},
	{
		accessorKey: "officeType",
		header: "Office Type",
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.officeType || "--"}</span>,
	},
	{
		accessorKey: "mainContact",
		header: "Main Contact",
		enableSorting: true,
		cell: ({ row }) => <span>{row.original.mainContact || "--"}</span>,
	},
	{
		accessorKey: "address",
		header: "Address",
		enableSorting: true,
		cell: ({ row }) => (
			<span title={row.original.address}>{row.original.address || "--"}</span>
		),
	},
	// {
	// 	accessorKey: "joinedOn",
	// 	header: "Joined On",
	// 	enableSorting: true,
	// 	sortingFn: "datetime",
	// 	cell: ({ row }) => (
	// 		<span className="whitespace-nowrap">
	// 			{row.original.joinedOn ? formatDate(row.original.joinedOn) : "--"}
	// 		</span>
	// 	),
	// },
	{
		accessorKey: "status",
		header: "Status",
		enableSorting: true,
		cell: ({ row }) => (
			<span className="whitespace-nowrap">
				<Badge variant={row.original.status}>{row.original.status}</Badge>
			</span>
		),
	},
	{
		id: "actions",
		header: "Action",
		enableSorting: false,
		cell: ({ row }) => (
			<Button
				type="button"
				text="View"
				Icon={Eye}
				iconPosition="left"
				iconSize={15}
				appearance="standard"
				variant="outline"
				size="sm"
				onClick={() => onView(row.original)}
				aria-label={`View ${row.original.organizationName}`}
			/>
		),
	},
];
