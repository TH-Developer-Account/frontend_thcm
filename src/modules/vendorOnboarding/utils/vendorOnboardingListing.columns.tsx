import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type { VendorOnboardingListingRow } from "../types/vendorListing.types";

type VendorOnboardingColumnsParams = {
	selectedIds: string[];
	onToggleRow: (id: string) => void;
	onToggleAll: () => void;
	isAllSelected: boolean;
	onView: (row: VendorOnboardingListingRow) => void;
};

type VendorStatus = NonNullable<VendorOnboardingListingRow["status"]>;

const VENDOR_STATUS_CONFIG: Record<
	VendorStatus,
	{
		label: string;
		className: string;
	}
> = {
	PENDING: {
		label: "Pending",
		className: "vendor-listing-status-pending",
	},
	APPROVED: {
		label: "Approved",
		className: "vendor-listing-status-approved",
	},
	CLARIFICATION: {
		label: "Clarification",
		className: "vendor-listing-status-clarification",
	},
	CLOSED: {
		label: "Closed",
		className: "vendor-listing-status-closed",
	},
};

const getVendorStatusConfig = (
	status: VendorOnboardingListingRow["status"],
) => {
	if (!status) {
		return {
			label: "Not Available",
			className: "vendor-listing-status-inactive",
		};
	}

	return (
		VENDOR_STATUS_CONFIG[status] ?? {
			label: status,
			className: "vendor-listing-status-inactive",
		}
	);
};

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || "—";

export const getVendorOnboardingColumns = ({
	selectedIds,
	onToggleRow,
	onToggleAll,
	isAllSelected,
	onView,
}: VendorOnboardingColumnsParams): ColumnDef<VendorOnboardingListingRow>[] => [
	{
		id: "select",
		header: () => (
			<input
				type="checkbox"
				className="vendor-listing-checkbox"
				checked={isAllSelected}
				onChange={onToggleAll}
				aria-label="Select all vendor onboarding records"
			/>
		),
		cell: ({ row }) => {
			const vendor = row.original;
			const isSelected = selectedIds.includes(vendor.id);

			return (
				<input
					type="checkbox"
					className="vendor-listing-checkbox"
					checked={isSelected}
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
			<span className="vendor-listing-code">
				{renderCellValue(row.original.vendorCode)}
			</span>
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
		accessorKey: "region",
		header: "Region",
		cell: ({ row }) => renderCellValue(row.original.region),
	},
	{
		accessorKey: "createdBy",
		header: "Created By",
		cell: ({ row }) => renderCellValue(row.original.createdBy),
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
			const statusConfig = getVendorStatusConfig(row.original.status);

			return (
				<span
					className={["vendor-listing-status", statusConfig.className].join(
						" ",
					)}
				>
					{statusConfig.label}
				</span>
			);
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
