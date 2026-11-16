import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { NavLink } from "react-router-dom";

import Button from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import type { CppListingRow, CppListingTab } from "../types/cpp.types";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
	style: "currency",
	currency: "INR",
	maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

const formatCurrency = (value: number | null): string =>
	value === null ? "—" : currencyFormatter.format(value);

const formatDate = (value: string): string => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
};

/** Drafts open in the form; everything else opens the read-only view. */
export const getCppRowRoute = (row: Pick<CppListingRow, "id" | "status">) =>
	row.status === "DRAFT" ? `/cpp/${row.id}/edit` : `/cpp/${row.id}/view`;

export const getCppListingColumns = ({
	onView,
}: {
	onView: (row: CppListingRow) => void;
	tab?: CppListingTab;
}): ColumnDef<CppListingRow>[] => [
	{
		accessorKey: "referenceNumber",
		header: "Reference Number",
		meta: {
			headerClassName: "vendor-reference-number",
			cellClassName: "vendor-reference-number",
		},
		cell: ({ row }) => (
			<NavLink to={getCppRowRoute(row.original)} className="epc-number-link">
				{row.original.referenceNumber}
			</NavLink>
		),
	},
	{
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => (
			<span className="block max-w-56 truncate" title={row.original.title}>
				{row.original.title}
			</span>
		),
	},
	{
		accessorKey: "supplier",
		header: "Supplier",
		cell: ({ row }) => (
			<span className="block max-w-56 truncate" title={row.original.supplier}>
				{row.original.supplier}
			</span>
		),
	},
	{ accessorKey: "materialCategory", header: "Material Category" },
	{ accessorKey: "requestType", header: "Request Type" },
	{ accessorKey: "plants", header: "Plants" },
	{ accessorKey: "itemCount", header: "Lines" },
	{
		accessorKey: "annualisedImpact",
		header: "Annualised Impact",
		cell: ({ row }) => formatCurrency(row.original.annualisedImpact),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => <Badge status={row.original.status} />,
	},
	{
		accessorKey: "updatedAt",
		header: "Last Updated",
		cell: ({ row }) => formatDate(row.original.updatedAt),
	},
	{
		id: "actions",
		header: "Actions",
		enableSorting: false,
		cell: ({ row }) => {
			const isDraft = row.original.status === "DRAFT";
			return (
				<Button
					type="button"
					text={isDraft ? "Continue" : "View"}
					Icon={isDraft ? Pencil : Eye}
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
];
