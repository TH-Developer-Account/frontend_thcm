import type { ColumnDef } from "@tanstack/react-table";

import Button from "../../../../components/common/Button";
import type { BusinessPartner } from "../utils/bp.types";

export const getBusinessPartnerColumns = (
	onView: (partner: BusinessPartner) => void,
): ColumnDef<BusinessPartner>[] => [
	{
		accessorKey: "organizationName",
		header: "Business Partner",
		cell: ({ row }) => (
			<span className="font-medium tabular-nums">
				{row.original.organizationName || "--"}
			</span>
		),
	},
	{
		accessorKey: "internalId",
		header: "Short Name",
		cell: ({ row }) => <span>{row.original.internalId || "--"}</span>,
	},
	{
		accessorKey: "bpType",
		header: "BP Type",
		cell: ({ row }) => <span>{row.original.bpType || "--"}</span>,
	},
	{
		accessorKey: "officeType",
		header: "Office Type",
		cell: ({ row }) => <span>{row.original.region || "--"}</span>,
	},
	{
		accessorKey: "gst",
		header: "GST",
		cell: ({ row }) => <span>{row.original.gst || "--"}</span>,
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <span>{row.original.status}</span>,
	},
	{
		id: "actions",
		header: "Action",
		enableSorting: false,
		cell: ({ row }) => (
			<Button
				type="button"
				text="View"
				appearance="standard"
				variant="outline"
				size="sm"
				onClick={() => onView(row.original)}
			/>
		),
	},
];
