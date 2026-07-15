import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";

import Button from "../../../components/common/Button";
import type {
  VendorOnboardingListingRow,
  VendorOnboardingColumnsParams,
} from "../types/vendorListing.types";
import { VENDOR_INITIATION_STATUS_CONFIG } from "./vendor.constant";

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
    VENDOR_INITIATION_STATUS_CONFIG[status] ?? {
      label: status,
      className: "vendor-listing-status-inactive",
    }
  );
};

const renderCellValue = (value: string | null | undefined): string =>
  value?.trim() || "—";

export const getVendorOnboardingColumns = ({
  onView,
}: VendorOnboardingColumnsParams): ColumnDef<VendorOnboardingListingRow>[] => [
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
