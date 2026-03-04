import React, { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";

type RowData = Record<string, unknown>;

type Props = {
  title?: string;
  fetchData: () => Promise<RowData[]>;
  transformRow?: (row: RowData) => RowData;
  formatHeader?: (key: string) => string;
};

export default function GenericDataTable({
  title,
  fetchData,
  transformRow,
  formatHeader,
}: Props) {
  const [data, setData] = useState<RowData[]>([]);
  const [columns, setColumns] = useState<ColumnDef<RowData>[]>([]);
  const [loading, setLoading] = useState(false);

  function defaultHeaderFormatter(key: string) {
    return key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .trim();
  }

  function buildColumns(rows: RowData[]): ColumnDef<RowData>[] {
    if (!rows.length) return [];

    return Object.keys(rows[0]).map((key) => ({
      accessorKey: key,
      header: () => (
        <div style={styles.header}>
          {(formatHeader ?? defaultHeaderFormatter)(key)}
        </div>
      ),
      cell: (info) => (
        <div style={styles.cell}>{String(info.getValue() ?? "")}</div>
      ),
    }));
  }

  async function load() {
    try {
      setLoading(true);

      const raw = await fetchData();
      const normalized = transformRow ? raw.map(transformRow) : raw;

      setData(normalized);
      setColumns(buildColumns(normalized));
    } finally {
      setLoading(false);
    }
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div style={{ padding: 20 }}>
      <button onClick={load} disabled={loading}>
        {loading ? "Loading..." : (title ?? "Load Data")}
      </button>

      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={styles.table}>
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} style={styles.th}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={styles.td}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: { width: "max-content", borderCollapse: "collapse" },
  th: {
    border: "1px solid #ddd",
    padding: "8px 10px",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px 10px",
    whiteSpace: "normal",
    wordBreak: "break-word",
  },
  header: { fontWeight: 600 },
  cell: {},
};
