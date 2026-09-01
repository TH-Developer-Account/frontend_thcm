import React from "react";
import axios from "axios";
import { FileDown, FileUp, List, UserCheck, Users } from "lucide-react";

import Button from "../../../../../components/common/Button";
import Card from "../../../../../components/common/Card";
import DataTable from "../../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { FilterTabs } from "../../../../../components/ui/FilterTabs";
import { ServerAxios } from "../../../../../services/ServerAxios";

import { groupFileRowsByEvent } from "../../helpers/fileModule.helper";
import type {
  FileDownloadKind,
  FileModuleEventGroupRow,
  FileModuleListingRow,
} from "../../types/fileModule.types";

import { getFilesListingColumns } from "./files.module.columns";
import { getGroupedFilesListingColumns } from "./files.module.columns";

export type FileListFilter = "all" | "grouped" | "assigned";

type FileListingTableProps = {
  files: FileModuleListingRow[];
  selectedFilter: FileListFilter;
  onFilterChange: (value: FileListFilter) => void;

  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;

  onImport?: () => void;
  onExport?: () => void;
};

type DownloadNotice = {
  type: "success" | "error";
  message: string;
  url?: string;
};

const SKELETON_ROW_COUNT = 8;
const SKELETON_COLUMN_COUNT = 9;

const FILES_FILTER_TABS = [
  {
    value: "all",
    label: "All Files",
    tooltipLabel: "View all available files",
    Icon: List,
  },
  {
    value: "grouped",
    label: "Grouped",
    tooltipLabel: "View files grouped by event",
    Icon: Users,
  },
  {
    value: "assigned",
    label: "Assigned",
    tooltipLabel: "View files assigned to me",
    Icon: UserCheck,
  },
] as const;

const getFileLabel = (kind: FileDownloadKind): string =>
  kind === "output" ? "success file" : "error file";

const getDownloadKey = (fileId: string, kind: FileDownloadKind): string =>
  `${fileId}:${kind}`;

const getDownloadErrorMessage = (
  error: unknown,
  kind: FileDownloadKind,
): string => {
  const fileLabel = getFileLabel(kind);

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Your session is not authorized. Please sign in again.";
    }

    if (error.response?.status === 403) {
      return `You do not have permission to download this ${fileLabel}.`;
    }

    if (error.response?.status === 404) {
      return `No ${fileLabel} is available for this record.`;
    }

    const responseData = error.response?.data as
      | {
          message?: unknown;
          error?: unknown;
        }
      | undefined;

    if (
      typeof responseData?.message === "string" &&
      responseData.message.trim()
    ) {
      return responseData.message;
    }

    if (typeof responseData?.error === "string" && responseData.error.trim()) {
      return responseData.error;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return `Unable to download the ${fileLabel}.`;
};

const FileListingTable = ({
  files,
  selectedFilter,
  onFilterChange,
  isLoading = false,
  isFetching = false,
  isError = false,
  onImport,
  onExport,
}: FileListingTableProps) => {
  const [downloadingKeys, setDownloadingKeys] = React.useState<Set<string>>(
    () => new Set(),
  );

  const [downloadNotice, setDownloadNotice] =
    React.useState<DownloadNotice | null>(null);

  const handleDownloadFile = React.useCallback(
    async (
      file: FileModuleListingRow,
      kind: FileDownloadKind,
    ): Promise<void> => {
      const downloadKey = getDownloadKey(file.id, kind);

      const endpoint =
        kind === "output"
          ? `/import-export-logs/${encodeURIComponent(file.id)}/file`
          : `/import-export-logs/${encodeURIComponent(file.id)}/errors`;

      setDownloadingKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);

        nextKeys.add(downloadKey);

        return nextKeys;
      });

      setDownloadNotice(null);

      try {
        const response = await ServerAxios.get(endpoint);

        const returnedUrl =
          typeof response.data?.url === "string"
            ? response.data.url
            : undefined;

        setDownloadNotice({
          type: "success",
          message: returnedUrl
            ? `${getFileLabel(kind)} is ready.`
            : `${getFileLabel(kind)} request completed successfully.`,
          url: returnedUrl,
        });
      } catch (error) {
        setDownloadNotice({
          type: "error",
          message: getDownloadErrorMessage(error, kind),
        });
      } finally {
        setDownloadingKeys((currentKeys) => {
          const nextKeys = new Set(currentKeys);

          nextKeys.delete(downloadKey);

          return nextKeys;
        });
      }
    },
    [],
  );

  const detailColumns = React.useMemo(
    () =>
      getFilesListingColumns({
        onDownloadFile: handleDownloadFile,
        downloadingKeys,
      }),
    [downloadingKeys, handleDownloadFile],
  );

  const groupedColumns = React.useMemo(
    () => getGroupedFilesListingColumns(),
    [],
  );

  const tableData = React.useMemo(
    () => (Array.isArray(files) ? files : []),
    [files],
  );

  const groupedTableData = React.useMemo(
    () => groupFileRowsByEvent(tableData),
    [tableData],
  );

  const isGroupedView = selectedFilter === "grouped";

  return (
    <Card
      className="file-listing-card"
      // title="Import and export history"
      // subtitle={
      // 	isGroupedView
      // 		? "Operations grouped by Event Planning Calendar."
      // 		: "Individual import and export operations."
      // }
      title={
        <FilterTabs
          ariaLabel="Filter file listings"
          items={FILES_FILTER_TABS}
          value={selectedFilter}
          onChange={onFilterChange}
          className="border-none px-0 py-0"
        />
      }
      actions={
        <>
          <Button
            type="button"
            text="Export"
            Icon={FileDown}
            iconPosition="left"
            iconSize={16}
            appearance="standard"
            variant="outline"
            size="sm"
            onClick={onExport}
          />

          <Button
            type="button"
            text="Import"
            Icon={FileUp}
            iconPosition="left"
            iconSize={16}
            appearance="cta"
            variant="brand"
            size="sm"
            onClick={onImport}
          />
        </>
      }
    >
      <section
        className="file-listing"
        aria-label="Import and export file history"
        aria-busy={isLoading || isFetching}
      >
        {downloadNotice ? (
          <div
            role={downloadNotice.type === "error" ? "alert" : "status"}
            aria-live={downloadNotice.type === "error" ? "assertive" : "polite"}
            className="alert-card file-download-notice"
          >
            <div className="min-w-0">
              <p
                className={
                  downloadNotice.type === "error"
                    ? "alert-description text-rejected"
                    : "alert-description text-approved"
                }
              >
                {downloadNotice.message}
              </p>
            </div>

            <div className="file-download-notice-actions">
              {downloadNotice.url ? (
                <a
                  href={downloadNotice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-download-link"
                >
                  Open file
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => setDownloadNotice(null)}
                className="file-download-dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}

        <div className="file-listing-table">
          {isLoading ? (
            <DataTableSkeleton
              rows={SKELETON_ROW_COUNT}
              columns={SKELETON_COLUMN_COUNT}
              showPagination
            />
          ) : isError ? (
            <div role="alert" className="alert-card">
              <h2 className="alert-title">Unable to load file history</h2>

              <p className="alert-description">
                The import and export history could not be retrieved. Refresh
                the page or try again.
              </p>
            </div>
          ) : isGroupedView ? (
            <DataTable<FileModuleEventGroupRow>
              data={groupedTableData}
              columns={groupedColumns}
              manualSorting={false}
              manualPagination={false}
              scrollTargetId="file-module-grouped-table-scroll"
              emptyTitle="No grouped event records found"
              emptyDescription="Event-based import and export history will appear here."
            />
          ) : (
            <DataTable<FileModuleListingRow>
              data={tableData}
              columns={detailColumns}
              manualSorting={false}
              manualPagination={false}
              scrollTargetId="file-module-table-scroll"
              emptyTitle="No file records found"
              emptyDescription="Import and export history will appear here."
            />
          )}
        </div>

        {isFetching && !isLoading ? (
          <span className="sr-only" role="status" aria-live="polite">
            Refreshing import and export history
          </span>
        ) : null}
      </section>
    </Card>
  );
};

export default FileListingTable;
