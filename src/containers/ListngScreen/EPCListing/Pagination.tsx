import React from "react";
import type { PaginationProps } from "../types";

const Pagination: React.FC<PaginationProps> = ({
  pageIndex,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
  const currentPage = pageIndex + 1;

  const generatePages = () => {
    const pages: (number | string)[] = [];
    const windowSize = 1; // current ±1

    const start = Math.max(2, currentPage - windowSize);
    const end = Math.min(totalPages - 1, currentPage + windowSize);

    // Always show first page
    pages.push(1);

    // Left ellipsis
    if (start > 2) {
      pages.push("...");
    }

    // Middle window
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Right ellipsis
    if (end < totalPages - 1) {
      pages.push("...");
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
      {/* Page Info */}
      <div className="text-sm text-gray-600">
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
      </div>

      {/* Page Buttons */}
      <div className="flex items-center gap-1">
        <button
          disabled={pageIndex === 0}
          onClick={() => onPageChange(pageIndex - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          {"<"}
        </button>

        {pages.map((page, index) =>
          page === "..." ? (
            <span key={index} className="px-2">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange((page as number) - 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === page ? "bg-blue-600 text-white" : ""
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          disabled={pageIndex + 1 >= totalPages}
          onClick={() => onPageChange(pageIndex + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          {">"}
        </button>
      </div>

      {/* Page Size Selector */}
      <div>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border px-2 py-1 rounded"
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
