import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { NavLink } from "react-router-dom";

import ActionMenu, {
	type ActionMenuItem,
} from "../../../components/common/ActionMenu";
import PendingOnStatus from "../../../components/common/PendingOnStatus";
import { formatDateTime24 } from "../../../utils/format";

import type {
	VendorOnboardingColumnsParams,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || "—";

const getRowLabel = (record: VendorOnboardingListingRow): string =>
	record.vendorName ||
	record.vendorReferenceName ||
	record.referenceNumber ||
	"vendor";

export const getVendorOnboardingColumns = ({
	onView,
	onEdit,
	onRetrigger,
	getRowPermissions,
}: VendorOnboardingColumnsParams): ColumnDef<VendorOnboardingListingRow>[] => [
	{
		accessorKey: "referenceNumber",
		header: "Reference Number",
		meta: {
			headerClassName: "vendor-reference-number",
			cellClassName: "vendor-reference-number",
		},
		cell: ({ row }) => (
			<NavLink
				to={`/vendor-onboarding/${row.original.id}`}
				className="epc-number-link"
			>
				{row.original.referenceNumber || "--"}
			</NavLink>
		),
	},
	{
		accessorKey: "vendorName",
		header: "Vendor Name",
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
		header: "Vendor Email",
		cell: ({ row }) => renderCellValue(row.original.email),
	},
	{
		accessorKey: "vendorPhone",
		header: "Vendor Contact",
		cell: ({ row }) => renderCellValue(row.original.mobile),
	},
	{
		accessorKey: "createdBy",
		header: "Initiated By",
		cell: ({ row }) => {
			const initiatedBy = row.original.initiatedBy;

			if (!initiatedBy) return "—";

			return renderCellValue(
				`${initiatedBy.first_name ?? ""} ${initiatedBy.last_name ?? ""}`,
			);
		},
	},
	{
		accessorKey: "createdDate",
		header: "Created Date",
		cell: ({ row }) =>
			renderCellValue(formatDateTime24(row.original.createdDate)),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<PendingOnStatus
				pendingOn={row.original.pendingOn}
				status={row.original.status}
			/>
		),
	},
	{
		id: "actions",
		header: "Actions",
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

			if (!showView && !showEdit && !showRetrigger) return "—";

			const actions: ActionMenuItem<VendorOnboardingListingRow>[] = [
				{
					id: "view",
					label: "View",
					Icon: Eye,
					onClick: (r) => onView?.(r),
					hidden: !showView,
				},
				{
					id: "edit",
					label: "Edit",
					Icon: Pencil,
					onClick: (r) => onEdit?.(r),
					hidden: !showEdit,
				},
				// {
				// 	id: "retrigger",
				// 	label: "Retrigger Email",
				// 	Icon: Send,
				// 	onClick: (r) => onRetrigger?.(r),
				// 	hidden: !showRetrigger,
				// },
			];

			return (
				<ActionMenu<VendorOnboardingListingRow>
					row={record}
					actions={actions}
					ariaLabel={`Actions for ${getRowLabel(record)}`}
				/>
			);
		},
	},
];
