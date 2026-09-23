import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";

import Button from "../../../components/common/Button";
import { formatDateTime24 } from "../../../utils/format";

import type {
	VendorOnboardingColumnsParams,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";
import { formatPendingOn } from "../../../utils/statusAlert.helper";
import { Badge } from "../../../components/common/Badge";

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || "—";

const normalizeStatus = (status: string | null | undefined): string =>
	status
		?.trim()
		.toUpperCase()
		.replace(/[\s-]+/g, "_") ?? "";

const EDITABLE_STATUSES = new Set(["VENDOR_SUBMITTED", "IN_REVIEW"]);

export const getVendorOnboardingColumns = ({
	onView,
	onEdit,
	canEdit,
}: VendorOnboardingColumnsParams): ColumnDef<VendorOnboardingListingRow>[] => [
	{
		accessorKey: "referenceNumber",
		header: "Reference Number",
		meta: {
			headerClassName: "vendor-reference-number",
			cellClassName: "vendor-reference-number",
		},
		cell: ({ row }) => {
			return (
				<span className="epc-number-link">
					{row.original.referenceNumber || "--"}
				</span>
			);
		},
	},
	{
		accessorKey: "vendorName",
		header: "Vendor Name",
		cell: ({ row }) => (
			<div className="vendor-listing-identity">
				<span className="vendor-listing-title">
					{renderCellValue(row.original.vendorName)}
				</span>

				{row.original.vendorReferenceName ? (
					<span className="vendor-listing-subtitle">
						{row.original.vendorReferenceName}
					</span>
				) : null}
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
		cell: ({ row }) => {
			console.log("status", row.original.pendingOn);
			return <Badge status={formatPendingOn(row.original.pendingOn)} />;
		},
		// span>{formatPendingOn(row.original?.status)}</span>,
		// <={row.original.status} ,
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const record = row.original;
			const status = normalizeStatus(record.status);

			/**
			 * ACTION RULES
			 *
			 * AWAITING_VENDOR
			 * - No View
			 * - No Edit
			 *
			 * IN_PROGRESS
			 * - View
			 *
			 * VENDOR_SUBMITTED
			 * - View
			 * - Edit
			 *
			 * IN_REVIEW
			 * - View
			 * - Edit
			 *
			 * Everything else
			 * - View
			 */
			const showView = Boolean(onView) && status !== "AWAITING_VENDOR";

			const showEdit =
				Boolean(onEdit) &&
				EDITABLE_STATUSES.has(status) &&
				(canEdit ? canEdit(record) : true);

			if (!showView && !showEdit) {
				return "—";
			}

			return (
				<div className="flex items-center gap-2">
					{showView ? (
						<Button
							type="button"
							// text="View"
							Icon={Eye}
							iconPosition="left"
							size="sm"
							appearance="icon"
							variant="outline"
							onClick={() => onView(record)}
						/>
					) : null}

					{showEdit ? (
						<Button
							type="button"
							// text="Edit"
							Icon={Pencil}
							iconPosition="left"
							size="sm"
							appearance="icon"
							variant="outline"
							onClick={() => onEdit?.(record)}
						/>
					) : null}
				</div>
			);
		},
		enableSorting: false,
		size: 160,
	},
];
