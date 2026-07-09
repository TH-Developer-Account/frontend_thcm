import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type { VendorListingRow } from "../types/vendorListing.types";

type VendorListingColumnsParams = {
	selectedIds: string[];
	onToggleRow: (id: string) => void;
	onToggleAll: () => void;
	isAllSelected: boolean;
	onView: (row: VendorListingRow) => void;
};

const getVendorStatusLabel = (status: VendorListingRow["status"]): string => {
	switch (status) {
		case "PENDING":
			return "Pending";
		case "APPROVED":
			return "Approved";
		case "CLARIFICATION":
			return "Clarification";
		case "CLOSED":
			return "Closed";
		default:
			return status;
	}
};

export const getVendorListingColumns = ({
	selectedIds,
	onToggleRow,
	onToggleAll,
	isAllSelected,
	onView,
}: VendorListingColumnsParams): ColumnDef<VendorListingRow>[] => [
	{
		id: "select",
		header: () => (
			<input
				type="checkbox"
				className="vendor-listing-checkbox"
				checked={isAllSelected}
				onChange={onToggleAll}
				aria-label="Select all vendors"
			/>
		),
		cell: ({ row }) => {
			const vendor = row.original;
			const checked = selectedIds.includes(vendor.id);

			return (
				<input
					type="checkbox"
					className="vendor-listing-checkbox"
					checked={checked}
					onChange={() => onToggleRow(vendor.id)}
					aria-label={`Select ${vendor.vendorName}`}
				/>
			);
		},
		enableSorting: false,
		size: 44,
	},
	{
		accessorKey: "vendorCode",
		header: "Vendor Code",
		cell: ({ row }) => (
			<span className="vendor-listing-code">{row.original.vendorCode}</span>
		),
	},
	{
		accessorKey: "vendorName",
		header: "Vendor Name",
		cell: ({ row }) => (
			<div className="vendor-listing-identity">
				<span className="vendor-listing-title">{row.original.vendorName}</span>
				<span className="vendor-listing-subtitle">
					{row.original.vendorType}
				</span>
			</div>
		),
	},
	{
		accessorKey: "companyCode",
		header: "Company Code",
	},
	{
		accessorKey: "region",
		header: "Region",
	},
	{
		accessorKey: "createdBy",
		header: "Created By",
	},
	{
		accessorKey: "createdDate",
		header: "Created Date",
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<span
				className={`vendor-listing-status vendor-listing-status-${row.original.status.toLowerCase()}`}
			>
				{getVendorStatusLabel(row.original.status)}
			</span>
		),
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
