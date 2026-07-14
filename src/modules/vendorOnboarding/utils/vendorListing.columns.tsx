import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type { VendorInitiationListingRow } from "../types/vendorListing.types";

type VendorInitiationColumnsParams = {
	selectedIds: string[];
	onToggleRow: (id: string) => void;
	onToggleAll: () => void;
	isAllSelected: boolean;
	onView: (row: VendorInitiationListingRow) => void;
};

type VendorInitiationStatus = NonNullable<VendorInitiationListingRow["status"]>;

const VENDOR_INITIATION_STATUS_CONFIG: Partial<
	Record<
		VendorInitiationStatus,
		{
			label: string;
			className: string;
		}
	>
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
	status: VendorInitiationListingRow["status"],
) => {
	if (!status) {
		return {
			label: "Not Available",
			className: "vendor-listing-status-inactive",
		};
	}

	return (
		VENDOR_INITIATION_STATUS_CONFIG[status] ?? {
			label: status,
			className: "vendor-listing-status-inactive",
		}
	);
};

const renderCellValue = (value: string | null | undefined): string =>
	value?.trim() || "—";

const formatDate = (value: string | null | undefined): string => {
	if (!value) {
		return "—";
	}

	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

export const getVendorInitiationColumns = ({
	selectedIds,
	onToggleRow,
	onToggleAll,
	isAllSelected,
	onView,
}: VendorInitiationColumnsParams): ColumnDef<VendorInitiationListingRow>[] => [
	{
		id: "select",
		header: () => (
			<input
				type="checkbox"
				className="vendor-listing-checkbox"
				checked={isAllSelected}
				onChange={onToggleAll}
				aria-label="Select all vendor initiation records"
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
		accessorKey: "vendorName",
		header: "Vendor Name",
		cell: ({ row }) => (
			<span className="vendor-listing-title">
				{renderCellValue(row.original.vendorName)}
			</span>
		),
	},
	{
		accessorKey: "vendorEmail",
		header: "Vendor Email",
		cell: ({ row }) => (
			<a
				className="vendor-listing-link"
				href={`mailto:${row.original.vendorEmail}`}
			>
				{renderCellValue(row.original.vendorEmail)}
			</a>
		),
	},
	{
		accessorKey: "vendorPhone",
		header: "Vendor Phone",
		cell: ({ row }) => (
			<a
				className="vendor-listing-link"
				href={`tel:${row.original.vendorPhone}`}
			>
				{renderCellValue(row.original.vendorPhone)}
			</a>
		),
	},
	{
		accessorKey: "createdBy",
		header: "Created By",
		cell: ({ row }) => renderCellValue(row.original.createdBy),
	},
	{
		accessorKey: "createdAt",
		header: "Created Date",
		cell: ({ row }) => formatDate(row.original.createdAt),
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
