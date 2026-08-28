import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Badge } from "../../../components/common/Badge";
import Button from "../../../components/common/Button";

import type {
	VendorOnboardingColumnsParams,
	VendorOnboardingListingRow,
} from "../types/vendorListing.types";
import { formatDateTime24 } from "../../../utils/format";

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || "—";

export const getVendorOnboardingColumns = ({
	onView,
	onEdit,
	basePath = "/vendor/onboarding",
	getViewPath,
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
			const viewPath = getViewPath
				? getViewPath(row.original)
				: `${basePath}/${row.original.id}/view`;

			return (
				<NavLink to={viewPath} className="epc-number-link">
					{row.original.referenceNumber || "--"}
				</NavLink>
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
						{row.original.vendorReferenceName ?? "Test"}
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
		cell: ({ row }) => <Badge status={row.original.status} />,
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const record = row.original;
			const showEdit = Boolean(onEdit) && (canEdit ? canEdit(record) : true);

			return (
				<div className="flex items-center gap-2">
					<Button
						type="button"
						text="View"
						Icon={Eye}
						iconPosition="left"
						size="sm"
						appearance="standard"
						variant="outline"
						onClick={() => onView(record)}
					/>

					{showEdit ? (
						<Button
							type="button"
							text="Edit"
							Icon={Pencil}
							iconPosition="left"
							size="sm"
							appearance="standard"
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
