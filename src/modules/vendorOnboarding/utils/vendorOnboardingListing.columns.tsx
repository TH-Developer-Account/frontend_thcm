import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Send } from "lucide-react";
import { NavLink } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import PendingOnStatus from "../../../components/common/PendingOnStatus";
import { formatVendorMessage, vendorContent } from "../utils/vendor.content";
import { formatDateTime24 } from "../../../utils/format";

import type {
	VendorOnboardingColumnsParams,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";

// Copy lives in content/vendor.content.en.json -> listing.columns.*, listing.rowActions.*, common.*
const { columns, rowActions } = vendorContent.listing;
const { emptyValue, emptyReference } = vendorContent.common;

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || emptyValue;

const getRowLabel = (record: VendorOnboardingListingRow): string =>
	record.vendorName ||
	record.vendorReferenceName ||
	record.referenceNumber ||
	rowActions.fallbackName;

export const getVendorOnboardingColumns = ({
	onView,
	onEdit,
	onRetrigger,
	getRowPermissions,
}: VendorOnboardingColumnsParams): ColumnDef<VendorOnboardingListingRow>[] => [
	{
		accessorKey: "referenceNumber",
		header: columns.referenceNumber,
		meta: {
			headerClassName: "vendor-reference-number",
			cellClassName: "vendor-reference-number",
		},
		cell: ({ row }) => (
			<NavLink
				to={`/vendor-onboarding/${row.original.id}`}
				className="epc-number-link"
			>
				{row.original.referenceNumber || emptyReference}
			</NavLink>
		),
	},
	{
		accessorKey: "vendorName",
		header: columns.vendorName,
		cell: ({ row }) => (
			<div className="vendor-listing-identity">
				<span className="vendor-listing-title">
					{row.original.vendorName
						? renderCellValue(row.original.vendorName)
						: row.original.vendorReferenceName}
				</span>
			</div>
		),
	},
	{
		accessorKey: "vendorEmail",
		header: columns.vendorEmail,
		cell: ({ row }) => renderCellValue(row.original.email),
	},
	{
		accessorKey: "vendorPhone",
		header: columns.vendorContact,
		cell: ({ row }) => renderCellValue(row.original.mobile),
	},
	{
		accessorKey: "createdBy",
		header: columns.initiatedBy,
		cell: ({ row }) => {
			const initiatedBy = row.original.initiatedBy;

			if (!initiatedBy) return emptyValue;

			return renderCellValue(
				`${initiatedBy.first_name ?? ""} ${initiatedBy.last_name ?? ""}`,
			);
		},
	},
	{
		accessorKey: "createdDate",
		header: columns.createdDate,
		cell: ({ row }) =>
			renderCellValue(formatDateTime24(row.original.createdDate)),
	},
	{
		accessorKey: "status",
		header: columns.status,
		cell: ({ row }) => (
			<PendingOnStatus
				pendingOn={row.original.pendingOn}
				status={row.original.status}
			/>
		),
	},
	{
		id: "actions",
		header: columns.actions,
		enableSorting: false,
		size: 80,
		cell: ({ row }) => {
			const record = row.original;

			// Rules live in helpers/vendor.permissions.ts
			// (getVendorRowPermissions). Columns only decide HOW to render;
			// an action also needs its handler to be wired to show.
			const { canView, canEdit, canRetrigger } = getRowPermissions(record);

			const showView = canView && Boolean(onView);
			const showEdit = canEdit && Boolean(onEdit);
			const showRetrigger = canRetrigger && Boolean(onRetrigger);

			if (!showView && !showEdit && !showRetrigger) return emptyValue;

			const actions: ActionMenuItem<VendorOnboardingListingRow>[] = [
				{
					id: "view",
					label: rowActions.view,
					Icon: Eye,
					onClick: (r) => onView?.(r),
					hidden: !showView,
				},
				{
					id: "edit",
					label: rowActions.edit,
					Icon: Pencil,
					onClick: (r) => onEdit?.(r),
					hidden: !showEdit,
				},
				// Re-sends the invite mail with a fresh link. Only offered while
				// the vendor hasn't submitted (canRetrigger = AWAITING_VENDOR);
				// the moment they submit, the status changes and this disappears.
				{
					id: "retrigger",
					label: rowActions.retrigger,
					Icon: Send,
					onClick: (r) => onRetrigger?.(r),
					hidden: !showRetrigger,
				},
			];

			return (
				<ActionMenu<VendorOnboardingListingRow>
					row={record}
					actions={actions}
					ariaLabel={formatVendorMessage(rowActions.ariaLabel, {
						name: getRowLabel(record),
					})}
				/>
			);
		},
	},
];
