import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../components/common/Button";
import type { MedicalClaimListingRow } from "./medicalClaimListing.types";

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
	{ accessorKey: "referenceNumber", header: "Reference No." },
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
		cell: ({ row }) => (
			<span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
				{row.original.statusLabel}
			</span>
		),
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
