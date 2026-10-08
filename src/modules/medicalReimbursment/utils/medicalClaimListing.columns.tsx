import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Send } from "lucide-react";
import { NavLink } from "react-router-dom";

import Button from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import type {
	MedicalClaimListingRow,
	MedicalClaimListingTab,
} from "../types/medicalClaimListing.types";

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

/** Awaiting claims open the initiation view (with Re-send link); others the claim view. */
export const getMedicalClaimRowRoute = (row: Pick<MedicalClaimListingRow, "id" | "status">) =>
	row.status === "AWAITING_EX_EMPLOYEE"
		? `/medi-claim/initiation/${row.id}/view`
		: `/medi-claim/${row.id}/view`;

export const getMedicalClaimListingColumns = ({
	onView,
	tab = "claims",
}: {
	onView: (row: MedicalClaimListingRow) => void;
	tab?: MedicalClaimListingTab;
}): ColumnDef<MedicalClaimListingRow>[] => {
	const isInitiationTab = tab === "initiation";

	const columns: ColumnDef<MedicalClaimListingRow>[] = [
		{
			accessorKey: "referenceNumber",
			header: "Reference Number",
			meta: {
				headerClassName: "vendor-reference-number",
				cellClassName: "vendor-reference-number",
			},
			cell: ({ row }) => (
				<NavLink to={getMedicalClaimRowRoute(row.original)} className="epc-number-link">
					{row.original.referenceNumber || "--"}
				</NavLink>
			),
		},
		{ accessorKey: "employeeName", header: "Employee Name" },
		{ accessorKey: "ticketNumber", header: "Ticket No." },
	];

	if (isInitiationTab) {
		columns.push(
			{ accessorKey: "email", header: "Email" },
			{ accessorKey: "mobile", header: "Mobile" },
		);
	} else {
		columns.push(
			{ accessorKey: "grade", header: "Grade" },
			{
				accessorKey: "totalClaimed",
				header: "Claimed Amount",
				cell: ({ row }) => currencyFormatter.format(row.original.totalClaimed),
			},
			{
				accessorKey: "pendingOn",
				header: "Pending On",
				cell: ({ row }) => (
					<span className="block max-w-48 truncate" title={row.original.pendingOn}>
						{row.original.pendingOn}
					</span>
				),
			},
		);
	}

	columns.push(
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => <Badge status={row.original.status} />,
		},
		{
			accessorKey: "createdAt",
			header: isInitiationTab ? "Link Sent On" : "Created On",
			cell: ({ row }) => formatDate(row.original.createdAt),
		},
		{
			id: "actions",
			header: "Actions",
			enableSorting: false,
			cell: ({ row }) => {
				const awaiting = row.original.status === "AWAITING_EX_EMPLOYEE";
				return (
					<Button
						type="button"
						text={awaiting ? "Manage" : "View"}
						Icon={awaiting ? Send : Eye}
						iconPosition="left"
						iconSize={16}
						appearance="standard"
						variant="outline"
						size="sm"
						onClick={() => onView(row.original)}
					/>
				);
			},
		},
	);

	return columns;
};
