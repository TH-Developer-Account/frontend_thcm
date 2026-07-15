import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type {
  VendorInitiationListingRow,
  VendorInitiationColumnsParams,
} from "../types/vendorListing.types";
import { VENDOR_INITIATION_STATUS_CONFIG } from "./vendor.constant";

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
  onView,
}: VendorInitiationColumnsParams): ColumnDef<VendorInitiationListingRow>[] => [
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
      <a className="vendor-listing-link" href={`mailto:${row.original.email}`}>
        {renderCellValue(row.original.email)}
      </a>
    ),
  },
  {
    accessorKey: "vendorPhone",
    header: "Vendor Phone",
    cell: ({ row }) => (
      <a className="vendor-listing-link" href={`tel:${row.original.mobile}`}>
        {renderCellValue(row.original.mobile)}
      </a>
    ),
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
    cell: ({ row }) =>
      renderCellValue(
        `${row.original.initiatedBy.first_name} ${row.original.initiatedBy.last_name}`,
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => formatDate(row.original.created_at),
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
