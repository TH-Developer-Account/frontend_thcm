import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { NavLink } from "react-router-dom";

import Button from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import type { CppListingRow, CppListingTab } from "../types/cpp.types";
import { CPP_CATEGORY_LABELS, CPP_STATUS } from "./cpp.constants";
import { getCondition } from "./cpp.utils";

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
	row.status === CPP_STATUS.DRAFT ? `/cpp/${row.id}/edit` : `/cpp/${row.id}/view`;

const clip = (text: string, className = "max-w-56") => (
	<span className={`block truncate ${className}`} title={text}>
		{text}
	</span>
);

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
		accessorKey: "category",
		header: "Category",
		cell: ({ row }) =>
			clip(CPP_CATEGORY_LABELS[row.original.category] ?? row.original.category),
	},
	{
		accessorKey: "condition",
		header: "Condition",
		cell: ({ row }) =>
			clip(getCondition(row.original.condition)?.label ?? row.original.condition),
	},
	{
		accessorKey: "plant",
		header: "Plant",
		cell: ({ row }) => (
			<span>
				{row.original.plant}
				{row.original.isSpare && row.original.plant !== "Spares" ? " (Spares)" : ""}
			</span>
		),
	},
	{
		accessorKey: "supplier",
		header: "Recommended Supplier",
		cell: ({ row }) => clip(row.original.supplier),
	},
	{
		accessorKey: "amount",
		header: "Amount",
		cell: ({ row }) => (
			<span title={row.original.amountLabel}>
				{formatCurrency(row.original.amount)}
				{row.original.amount !== null ? (
					<span className="ml-1 text-xs text-slate-400">{row.original.amountLabel}</span>
				) : null}
			</span>
		),
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
			const isDraft = row.original.status === CPP_STATUS.DRAFT;
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
