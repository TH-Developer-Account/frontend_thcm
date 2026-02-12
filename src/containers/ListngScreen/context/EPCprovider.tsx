import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { EPFContext } from "./EPCcontext";
import { ServerAxios } from "../../../services/ServerAxios";
import { epc_api_routes } from "../constant";
import type { ReactNode } from "react";
import type { EPCRow } from "../types";
import type { SortingState } from "@tanstack/react-table";

interface EPFProviderProps {
  children: ReactNode;
}

export function EPFProvider({ children }: EPFProviderProps) {
  const [data, setData] = useState<EPCRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------- SERVER STATE ---------- */
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [totalPages, setTotalPages] = useState(0);
  const debouncedSearch = useDebounce(search, 500); // 500ms delay

  const fetchEPC = useCallback(async () => {
    try {
      setLoading(true);

      const sort = sorting[0];

      const response = await ServerAxios.get(epc_api_routes.epc_listing_route, {
        params: {
          page: pageIndex + 1,
          pageSize,
          search: debouncedSearch,
          sortBy: sort?.id,
          sortOrder: sort?.desc ? "desc" : "asc",
        },
      });

      setData(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch EPC data", error);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedSearch, sorting]);

  useEffect(() => {
    fetchEPC();
  }, [fetchEPC]);

  return (
    <EPFContext.Provider
      value={{
        data,
        loading,
        search,
        pageIndex,
        pageSize,
        totalPages,
        sorting,
        setSearch,
        setSorting,
        setPageIndex,
        setPageSize,
        refetch: fetchEPC,
      }}
    >
      {children}
    </EPFContext.Provider>
  );
}
