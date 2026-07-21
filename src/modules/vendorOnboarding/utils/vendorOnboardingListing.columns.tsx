import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type {
	VendorOnboardingListingRow,
	VendorOnboardingColumnsParams,
} from "../types/vendorListing.types";
import { Badge } from "../../../components/common/Badge";
import { NavLink } from "react-router-dom";

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || "—";

export const getVendorOnboardingColumns = ({
	onView,
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
				to={`/vendor/onboarding/${row.original.id}/view`}
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
					{renderCellValue(row.original.vendorName)}
				</span>

				{row.original.vendorType ? (
					<span className="vendor-listing-subtitle">
						{row.original.vendorType}
					</span>
				) : null}
			</div>
		),
	},
	{
		accessorKey: "companyCode",
		header: "Company Code",
		cell: ({ row }) => renderCellValue(row.original.companyCode),
	},
	{
		accessorKey: "vendorType",
		header: "Vendor Type",
		cell: ({ row }) => renderCellValue(row.original.vendorType),
	},
	{
		accessorKey: "createdBy",
		header: "Initiated By",
		cell: ({ row }) =>
			renderCellValue(
				`${row.original.initiatedBy.first_name} ${row.original.initiatedBy.last_name}`,
			),
	},
	{
		accessorKey: "createdDate",
		header: "Created Date",
		cell: ({ row }) => renderCellValue(row.original.createdDate),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			return <Badge status={row.original.status} />;
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => (
			<Button
				type="button"
				text="View"
				Icon={Eye}
				iconPosition="left"
				size="sm"
				appearance="standard"
				variant="outline"
				onClick={() => onView(row.original)}
			/>
		),
		enableSorting: false,
		size: 120,
	},
];
