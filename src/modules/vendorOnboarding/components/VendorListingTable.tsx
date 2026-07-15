import { useMemo } from "react";
import { FileDown } from "lucide-react";
import { VENDOR_FILTER_TABS } from "../utils/vendor.constant";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { SearchInput } from "../../../components/forms/SearchInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";

import { getVendorInitiationColumns } from "../utils/vendorListing.columns";
import { getVendorOnboardingColumns } from "../utils/vendorOnboardingListing.columns";

import type { ColumnDef } from "@tanstack/react-table";
import type {
  VendorInitiationListingRow,
  VendorOnboardingListingRow,
  VendorListingFilter,
} from "../types/vendorListing.types";

type VendorListingDisplayRow =
  | VendorInitiationListingRow
  | VendorOnboardingListingRow;

type VendorListingTableProps = {
  selectedFilter: VendorListingFilter;
  onFilterChange: (value: VendorListingFilter) => void;

  search: string;
  onSearchChange: (value: string) => void;

  rows?: VendorListingDisplayRow[];

  isLoading?: boolean;
  isFetching?: boolean;

  pageIndex: number;
  pageSize: number;
  pageCount: number;

  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  onExport: () => void;

  onViewRow: (row: VendorListingDisplayRow) => void;
};

const SKELETON_ROW_COUNT = 8;

export default function VendorListingTable({
  selectedFilter,
  onFilterChange,

  search,
  onSearchChange,

  rows = [],

  isLoading = false,
  isFetching = false,

  pageIndex,
  pageSize,
  pageCount,

  onPageChange,
  onPageSizeChange,

  onExport,

  onViewRow,
}: VendorListingTableProps) {
  const isInitiationTab = selectedFilter === "initiation";

  const initiationColumns = useMemo(
    () =>
      getVendorInitiationColumns({
        onView: onViewRow as (row: VendorInitiationListingRow) => void,
      }),
    [onViewRow],
  );

  const onboardingColumns = useMemo(
    () =>
      getVendorOnboardingColumns({
        onView: onViewRow as (row: VendorOnboardingListingRow) => void,
      }),
    [onViewRow],
  );

  const columns = (isInitiationTab
    ? initiationColumns
    : onboardingColumns) as unknown as ColumnDef<VendorListingDisplayRow>[];

  return (
    <Card
      className="vendor-listing-card"
      title={
        <FilterTabs
          id="vendor-listing-tabs"
          ariaLabel="Filter vendor listings"
          items={VENDOR_FILTER_TABS}
          value={selectedFilter}
          onChange={onFilterChange}
          className="border-b-none px-0 py-0"
        />
      }
      secondaryHeader={
        <>
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder={
              isInitiationTab
                ? "Search vendor initiation requests"
                : "Search vendor onboarding records"
            }
          />

          <Button
            type="button"
            text="Export"
            Icon={FileDown}
            iconPosition="left"
            iconSize={16}
            appearance="cta"
            variant="brand"
            size="sm"
            onClick={onExport}
          />
        </>
      }
    >
      <section
        className="vendor-listing"
        aria-labelledby="vendor-listing-tabs"
        aria-busy={isLoading || isFetching}
      >
        <div className="vendor-listing-table">
          {isLoading ? (
            <DataTableSkeleton
              rows={SKELETON_ROW_COUNT}
              columns={columns.length}
              showPagination
            />
          ) : (
            <DataTable<VendorListingDisplayRow>
              data={rows}
              columns={columns}
              manualPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              emptyTitle={
                isInitiationTab
                  ? "No vendor initiation requests found"
                  : "No vendor onboarding records found"
              }
              emptyDescription={
                isInitiationTab
                  ? "Vendor initiation form entries will appear here."
                  : "Vendor onboarding records will appear here."
              }
              scrollTargetId={
                isInitiationTab
                  ? "vendor-initiation-table-scroll"
                  : "vendor-onboarding-table-scroll"
              }
            />
          )}
        </div>

        {isFetching && !isLoading ? (
          <span className="sr-only" role="status" aria-live="polite">
            Refreshing vendor list
          </span>
        ) : null}
      </section>
    </Card>
  );
}
