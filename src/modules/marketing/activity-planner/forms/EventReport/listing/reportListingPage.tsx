import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "../../../../../../components/ui/PageHeader";
import PageSectionLayout from "../../../../../../layout/PageSectionLayout";
import { useDownloadReportMutation } from "../useEventReportMutations";

import ReportListingTable from "./reportListingTable";
import { useReportListingQuery } from "../useEventReportQueries";
import type { ReportListingRow, ReportStatus } from "../eventReport.types";
import { useToast } from "../../../../../../context/Auth/AuthContext";

const INITIAL_PAGE_INDEX = 0;
const INITIAL_PAGE_SIZE = 20;

export default function ReportListingPage() {
  const navigate = useNavigate();
  const downloadMutation = useDownloadReportMutation();
  const { showToast } = useToast();

  const [pageIndex, setPageIndex] = useState(INITIAL_PAGE_INDEX);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | null>(null);

  const { data, isLoading, isFetching } = useReportListingQuery({
    page: pageIndex + 1,
    pageSize,
    status: statusFilter ?? undefined,
    search: search || undefined,
  });

  const rows = data?.data ?? [];
  const pageCount = data?.pagination.totalPages ?? 0;

  const handlePageChange = useCallback(
    (next: number) => setPageIndex(next),
    [],
  );
  const handlePageSizeChange = useCallback((next: number) => {
    setPageSize(next);
    setPageIndex(INITIAL_PAGE_INDEX);
  }, []);
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPageIndex(INITIAL_PAGE_INDEX);
  }, []);
  const handleStatusFilterChange = useCallback((value: ReportStatus | null) => {
    setStatusFilter(value);
    setPageIndex(INITIAL_PAGE_INDEX);
  }, []);

  const handleView = useCallback(
    (row: ReportListingRow) => {
      navigate(`/marketing/activity-planner/${row.epc.id}`);
    },
    [navigate],
  );

  const handleDownload = useCallback(
    (row: ReportListingRow) => {
      downloadMutation.mutate(row.epc.id, {
        onError: (err: any) => {
          showToast({
            type: "error",
            title: "Download failed",
            description: err?.message || "Unable to download this report.",
          });
        },
      });
    },
    [downloadMutation, showToast],
  );

  return (
    <PageSectionLayout>
      <PageHeader
        headerText="Event Reports"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "Event reports listing",
          breadcrumbs: [
            { label: "Home Screen", href: "/" },
            { label: "Event Reports" },
          ],
          separator: "›",
        }}
      />

      <ReportListingTable
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        rows={rows}
        isLoading={isLoading}
        isFetching={isFetching}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageCount={pageCount}
        onView={handleView}
        onDownload={handleDownload}
      />
    </PageSectionLayout>
  );
}
