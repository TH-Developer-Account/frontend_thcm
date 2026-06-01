import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import Pagination from "../common/Pagination";

export interface DataTableProps<T extends object> {
  data: T[];
  columns: ColumnDef<T>[];

  loading?: boolean;

  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  manualSorting?: boolean;

  manualPagination?: boolean;
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  emptyTitle?: string;
  emptyDescription?: string;
  scrollTargetId?: string;
  className?: string;
}

function DataTable<T extends object>({
  data,
  columns,
  loading = false,

  sorting,
  onSortingChange,
  manualSorting = false,

  manualPagination = false,
  pageIndex = 0,
  pageSize = 15,
  pageCount = 0,
  onPageChange,
  onPageSizeChange,

  emptyTitle = "No records found",
  emptyDescription = "Try adjusting filters or search",
  scrollTargetId = "tableScroll",
  className = "",
}: DataTableProps<T>) {
  "use no memo";
  const table = useReactTable({
    data,
    columns,

    state: {
      sorting: sorting ?? [],
    },

    onSortingChange,
    manualSorting,
    manualPagination,
    pageCount,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={`workflow-table-shell ${className}`}>
      <div className="workflow-table-scroll scrollbar-sleek">
        <table className="workflow-table " id={scrollTargetId}>
          <thead className="workflow-table-head">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={`workflow-table-head-cell ${
                        header.column.getCanSort()
                          ? "workflow-table-head-cell-sortable"
                          : ""
                      }`}
                    >
                      <div className="workflow-table-head-content">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}

                        {isSorted === "asc" && (
                          <ChevronUp size={14} className="text-[#f35a00]" />
                        )}
                        {isSorted === "desc" && (
                          <ChevronDown size={14} className="text-[#f35a00]" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="workflow-table-row">
                  <td colSpan={columns.length} className="workflow-table-cell">
                    <div className="workflow-table-skeleton" />
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="workflow-empty-state">
                  <div className="workflow-empty-state-inner">
                    <div className="workflow-empty-title">{emptyTitle}</div>
                    <div className="workflow-empty-description">
                      {emptyDescription}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="workflow-table-row">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={
                        cell.column.id === "action"
                          ? "workflow-table-cell-action"
                          : "workflow-table-cell-text"
                      }
                    >
                      <div className="workflow-table-cell-inner">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {manualPagination &&
        pageCount >= 1 &&
        onPageChange &&
        onPageSizeChange && (
          <div className="workflow-table-pagination">
            <div className="workflow-table-pagination-inner">
              <Pagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                totalPages={pageCount}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                scrollTargetId={scrollTargetId}
              />
            </div>
          </div>
        )}
    </div>
  );
}

export default DataTable;
