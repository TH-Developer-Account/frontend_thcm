import type { ColumnDef } from "@tanstack/react-table";

import { formatDate } from "../../../../utils/format";
import type { BusinessPartner } from "../utils/bp.types";

type BusinessPartnerListingRow = BusinessPartner & {
	zone?: string;
	status?: string;
};

export const getBusinessPartnerColumns = (): ColumnDef<BusinessPartner>[] => [
	{
		accessorKey: "internalId",
		header: "Internal ID",
		cell: ({ row }) => (
			<span className="font-medium tabular-nums">
				{row.original.internalId || "--"}
			</span>
		),
	},
	{
		accessorKey: "externalId",
		header: "External ID",
		cell: ({ row }) => (
			<span className="tabular-nums">{row.original.externalId || "--"}</span>
		),
	},
	{
		accessorKey: "organizationName",
		header: "Organization Name",
		cell: ({ row }) => (
			<span className="font-medium">
				{row.original.organizationName || "--"}
			</span>
		),
	},
	{
		accessorKey: "region",
		header: "Zone",
		cell: ({ row }) => {
			const partner = row.original as BusinessPartnerListingRow;

			return <span>{partner.zone || partner.region || "--"}</span>;
		},
	},
	{
		accessorKey: "mainContact",
		header: "Main Contact",
		cell: ({ row }) => <span>{row.original.mainContact || "--"}</span>,
	},
	{
		accessorKey: "address",
		header: "Address",
		cell: ({ row }) => (
			<span title={row.original.address}>{row.original.address || "--"}</span>
		),
	},
	{
		accessorKey: "joinedOn",
		header: "Joined On",
		cell: ({ row }) => (
			<span className="whitespace-nowrap">
				{row.original.joinedOn ? formatDate(row.original.joinedOn) : "--"}
			</span>
		),
	},
	{
		id: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = (row.original as BusinessPartnerListingRow).status;

			return <span>{status || "--"}</span>;
		},
	},
];
