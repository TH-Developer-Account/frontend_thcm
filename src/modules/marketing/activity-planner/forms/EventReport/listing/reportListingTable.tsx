import { useMemo } from "react";

import Card from "../../../../../../components/common/Card";
import { SearchInput } from "../../../../../../components/forms/SearchInput";
import SelectInput from "../../../../../../components/forms/SelectInput";
import DataTable from "../../../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { getReportListingColumns } from "./reportListingColumns";

import { REPORT_STATUS_BADGE } from "./reportStatusBadge";
import type { BaseOption } from "../../../../../../components/forms/SelectInput";
import type { ReportListingRow, ReportStatus } from "../eventReport.types";

const STATUS_FILTER_OPTIONS: BaseOption[] = (
  Object.entries(REPORT_STATUS_BADGE) as [ReportStatus, { label: string }][]
).map(([value, { label }]) => ({ value, label }));

const SKELETON_ROW_COUNT = 8;

type ReportListingTableProps = {
  search: string;
  onSearchChange: (value: string) => void;

  statusFilter: ReportStatus | null;
  onStatusFilterChange: (value: ReportStatus | null) => void;

  rows: ReportListingRow[];
  isLoading?: boolean;
  isFetching?: boolean;

  pageIndex: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  onView: (row: ReportListingRow) => void;
  onDownload: (row: ReportListingRow) => void;
};

export default function ReportListingTable({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  rows,
  isLoading = false,
  isFetching = false,
  pageIndex,
  pageSize,
  pageCount,
  onPageChange,
  onPageSizeChange,
  onView,
  onDownload,
}: ReportListingTableProps) {
  const columns = useMemo(
    () => getReportListingColumns({ onView, onDownload }),
    [onView, onDownload],
  );

  const selectedStatusOption =
    STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter) ?? null;

  return (
    <Card
      secondaryHeader={
        <>
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Search by event name"
          />

          <div className="w-48">
            <SelectInput
              options={STATUS_FILTER_OPTIONS}
              value={selectedStatusOption}
              isClearable
              placeholder="Filter status"
              onChange={(option) =>
                onStatusFilterChange(
                  (option as BaseOption | null)?.value as ReportStatus | null,
                )
              }
            />
          </div>
        </>
      }
    >
      <section className="report-listing" aria-busy={isLoading || isFetching}>
        {isLoading ? (
          <DataTableSkeleton
            rows={SKELETON_ROW_COUNT}
            columns={columns.length}
            showPagination
          />
        ) : (
          <DataTable<ReportListingRow>
            data={rows}
            columns={columns}
            manualPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            pageCount={pageCount}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            emptyTitle="No reports found"
            emptyDescription="Try changing the current page or search term."
            scrollTargetId="reportListingScroll"
          />
        )}
      </section>
    </Card>
  );
}
