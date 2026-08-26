import type { ColumnDef } from "@tanstack/react-table";
import { Eye, FilePenLine } from "lucide-react";
import { NavLink } from "react-router-dom";

import Button from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";

import type { ReimbursementClaimListItem } from "./reimbursementClaim.types";

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

/* -------------------------------------------------------------------------- */
/* Route helpers                                                              */
/* -------------------------------------------------------------------------- */

const EDITABLE_STATUSES = new Set([
	"CLARIFIED",
	"CLARIFICATION_REQUESTED",
	"THCM_CLARIFICATION_REQUESTED",
]);

const normalizeStatus = (status?: string | null): string =>
	String(status ?? "")
		.trim()
		.toUpperCase();

const canEditClaim = (claim: ReimbursementClaimListItem): boolean => {
	return EDITABLE_STATUSES.has(normalizeStatus(claim.status));
};

const getClaimRoute = (claim: ReimbursementClaimListItem): string =>
	`/guest/medi-claim/${claim.id}`;

export const getReimbursementClaimListingColumns = ({
	onView,
}: {
	onView: (row: ReimbursementClaimListItem) => void;
}): ColumnDef<ReimbursementClaimListItem>[] => [
	{
		accessorKey: "claimNumber",
		header: "Claim Number",
		meta: {
			headerClassName: "reimbursement-claim-number",
			cellClassName: "reimbursement-claim-number",
		},
		cell: ({ row }) => (
			<NavLink to={getClaimRoute(row.original)} className="epc-number-link">
				{row.original.claimNumber || "--"}
			</NavLink>
		),
	},

	{
		accessorKey: "employeeName",
		header: "Employee Name",
	},

	{
		accessorKey: "ticketNumber",
		header: "Ticket No.",
	},

	{
		accessorKey: "claimFor",
		header: "Claim For",
		cell: ({ row }) => {
			const value = row.original.claimFor;

			return value ? value.charAt(0) + value.slice(1).toLowerCase() : "—";
		},
	},

	{
		accessorKey: "totalClaimAmount",
		header: "Claimed Amount",
		cell: ({ row }) => currencyFormatter.format(row.original.totalClaimAmount),
	},

	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <Badge status={row.original.status} />,
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
		cell: ({ row }) => {
			const claim = row.original;
			const editable = canEditClaim(claim);

			return (
				<Button
					type="button"
					text={editable ? "Edit" : "View"}
					Icon={editable ? FilePenLine : Eye}
					iconPosition="left"
					iconSize={16}
					appearance="standard"
					variant="outline"
					size="sm"
					onClick={() => onView(claim)}
				/>
			);
		},
	},
];
