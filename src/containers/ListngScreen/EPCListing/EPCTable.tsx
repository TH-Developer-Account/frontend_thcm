import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { columns } from "./columns";
import { useEPC } from "../context/useEPC";
import type { EPCRow } from "../types";
import Pagination from "./Pagination";

const EPCTable = () => {
  const {
    data,
    sorting,
    setSorting,
    pageIndex,
    pageSize,
    setPageIndex,
    setPageSize,
    totalPages,
    loading,
  } = useEPC();

  const table = useReactTable<EPCRow>({
    data,
    columns,
    state: {
      sorting,
    },
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const onPageSizeChange = (page_size: number): void => {
    console.log("onPageSizeChange called", page_size);
    setPageSize(page_size);
  };

  const onPageChange = (page_index: number): void => {
    console.log("onPageChange called", page_index);
    setPageIndex(page_index);
  };

  return (
    <React.Fragment>
      <div className="border rounded bg-white overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: <ChevronUp size={14} />,
                        desc: <ChevronDown size={14} />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="h-2" />
        {/* Pagination */}
        <div className="bg-red-500">
          <Pagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      </div>
    </React.Fragment>
  );
};

export default EPCTable;
