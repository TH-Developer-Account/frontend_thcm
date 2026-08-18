import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type { MedicalClaimListingRow } from "../types/medicalClaimListing.types";
import { NavLink } from "react-router-dom";
import { Badge } from "../../../components/common/Badge";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const formatDate = (value: string): string => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
};

export const getMedicalClaimListingColumns = ({
	onView,
}: {
	onView: (row: MedicalClaimListingRow) => void;
}): ColumnDef<MedicalClaimListingRow>[] => [
	{
		accessorKey: "referenceNumber",
		header: "Reference Number",
		meta: {
			headerClassName: "vendor-reference-number",
			cellClassName: "vendor-reference-number",
		},
		cell: ({ row }) => (
			<NavLink
				to={`/medi-claim/${row.original.id}/view`}
				className="epc-number-link"
			>
				{row.original.referenceNumber || "--"}
			</NavLink>
		),
	},
	{ accessorKey: "employeeName", header: "Employee Name" },
	{ accessorKey: "ticketNumber", header: "Ticket No." },
	{ accessorKey: "grade", header: "Grade" },
	{
		accessorKey: "totalClaimed",
		header: "Claimed Amount",
		cell: ({ row }) => currencyFormatter.format(row.original.totalClaimed),
	},
	{
		accessorKey: "statusLabel",
		header: "Status",
		cell: ({ row }) => <Badge status={row.original.statusLabel} />,
	},
	{
		accessorKey: "createdAt",
		header: "Created On",
		cell: ({ row }) => formatDate(row.original.createdAt),
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => (
			<Button
				type="button"
				text="View"
				Icon={Eye}
				iconPosition="left"
				iconSize={16}
				appearance="standard"
				variant="outline"
				size="sm"
				onClick={() => onView(row.original)}
			/>
		),
	},
];
