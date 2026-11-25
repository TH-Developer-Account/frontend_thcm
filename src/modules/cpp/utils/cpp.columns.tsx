import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { NavLink } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import { Badge } from "../../../components/common/Badge";
import PendingOnStatus from "../../../components/common/PendingOnStatus";
import type { CppListingRow, CppListingTab } from "../types/cpp.types";
import { CPP_CATEGORY_LABELS, CPP_STATUS } from "./cpp.constants";

const CLARIFICATION_STATUS = "CLARIFICATION_REQUESTED";

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

/** Drafts open in the stepper; everything else opens the read-only view. */
export const getCppRowRoute = (row: Pick<CppListingRow, "id" | "status">) =>
	row.status === CPP_STATUS.DRAFT
		? `/cpp/${row.id}/edit`
		: `/cpp/${row.id}/view`;

/** The stepper form (same page for drafts and clarification). */
export const getCppEditRoute = (row: Pick<CppListingRow, "id">) =>
	`/cpp/${row.id}/edit`;

/**
 * Edit = draft, or sent back for clarification — and only for the proposer
 * (same rule as the approval flow in the other modules). The "My requests" and
 * "Drafts" tabs only ever hold the user's own requests; on the other tabs the
 * row's initiatedById must match.
 */
export const canEditCppRow = (
	row: CppListingRow,
	{ tab, currentUserId }: { tab?: CppListingTab; currentUserId?: string },
): boolean => {
	const status = String(row.status);
	if (status !== CPP_STATUS.DRAFT && status !== CLARIFICATION_STATUS)
		return false;
	if (tab === "myRequests" || tab === "drafts") return true;
	const ownerId = row.initiatedById;
	return Boolean(ownerId && currentUserId && ownerId === currentUserId);
};

const clip = (text: string, className = "max-w-56") => (
	<span className={`block truncate ${className}`} title={text}>
		{text}
	</span>
);

export const getCppListingColumns = ({
	onView,
	onEdit,
	tab,
	currentUserId,
}: {
	onView: (row: CppListingRow) => void;
	onEdit?: (row: CppListingRow) => void;
	tab?: CppListingTab;
	currentUserId?: string;
}): ColumnDef<CppListingRow>[] => {
	const columns: ColumnDef<CppListingRow>[] = [
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
			// Wider than the other text columns: labels like "Electrical Electronics
			// Rubber Hoses and Pipes (ERH)" were cut short. Width rule in cpp.css.
			size: 320,
			meta: {
				headerClassName: "cpp-col-category",
				cellClassName: "cpp-col-category",
			},
			cell: ({ row }) =>
				clip(
					CPP_CATEGORY_LABELS[row.original.category] ?? row.original.category,
					"max-w-80",
				),
		},
		// {
		// 	accessorKey: "condition",
		// 	header: "Condition",
		// 	cell: ({ row }) =>
		// 		clip(
		// 			getCondition(row.original.condition)?.label ?? row.original.condition,
		// 		),
		// },
		{
			accessorKey: "plant",
			header: "Plant",
			cell: ({ row }) => (
				<span>
					{row.original.plant}
					{row.original.isSpare && row.original.plant !== "Spares"
						? " (Spares)"
						: ""}
				</span>
			),
		},
		// {
		// 	accessorKey: "supplier",
		// 	header: "Recommended Supplier",
		// 	cell: ({ row }) => clip(row.original.supplier),
		// },
		{
			accessorKey: "amount",
			header: "Amount",
			cell: ({ row }) => (
				<span title={row.original.amountLabel}>
					{formatCurrency(row.original.amount)}
					{row.original.amount !== null ? (
						<span className="ml-1 text-xs text-slate-400">
							{/* {row.original.amountLabel} */}
						</span>
					) : null}
				</span>
			),
		},
		// {
		// 	accessorKey: "status",
		// 	header: "Status",
		// 	cell: ({ row }) => <Badge status={row.original.status} />,
		// },
		{
			id: "pendingOn",
			header: "Status",
			enableSorting: false,
			// Drafts tab: plain status badge ("Draft"); a draft has no approver yet.
			// Other tabs: same component as the vendor listing: "Pending on <approver>"
			// (+N popover when several), "Pending on Proposer" for a clarification,
			// otherwise the status label. pendingOn comes from the list API (resolveCppPendingOn).
			cell: ({ row }) =>
				tab === "drafts" ? (
					<Badge status={row.original.status} />
				) : (
					<PendingOnStatus
						pendingOn={row.original.pendingOn}
						status={row.original.status}
					/>
				),
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
			size: 80,
			cell: ({ row }) => {
				const record = row.original;
				const showEdit =
					Boolean(onEdit) && canEditCppRow(record, { tab, currentUserId });

				const actions: ActionMenuItem<CppListingRow>[] = [
					{
						id: "view",
						label: "View",
						Icon: Eye,
						onClick: (r) => onView(r),
					},
					{
						id: "edit",
						label:
							String(record.status) === CLARIFICATION_STATUS
								? "Edit for clarification"
								: "Edit",
						Icon: Pencil,
						onClick: (r) => onEdit?.(r),
						hidden: !showEdit,
					},
				];

				return (
					<ActionMenu<CppListingRow>
						row={record}
						actions={actions}
						ariaLabel={`Actions for ${record.referenceNumber}`}
					/>
				);
			},
		},
	];

	return columns;
};
