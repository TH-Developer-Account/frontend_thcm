import { useCallback, useEffect, useState } from "react";
import { api_routes } from "../constant/workflow.constant";
import type { ReactNode } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { WorkflowCard } from "../types/workflow.types";
import { ServerAxios } from "../../../../services/ServerAxios";
import { WorkflowContext } from "./useWorkflowContextValue";
import { useDebounce } from "../../../../hooks/useDebounce";
import { mapWorkflows } from "../utils/workflow.helpers";

interface WFProviderProps {
  children: ReactNode;
}

export function WorkflowProvider({ children }: WFProviderProps) {
  const [data, setData] = useState<WorkflowCard[]>([]);
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

      const {
        data: { data, meta },
      } = await ServerAxios.get(api_routes.get_all_workflow_api_route, {
        params: {
          page: pageIndex + 1,
          pageSize,
          search: debouncedSearch,
          sortBy: sort?.id,
          sortOrder: sort?.desc ? "desc" : "asc",
        },
      });

      const formatted = mapWorkflows(data);
      setData(formatted);
      setTotalPages(meta.totalPages);
    } catch (error) {
      console.error("Failed to fetch Workflow data", error);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, debouncedSearch, sorting]);

  useEffect(() => {
    fetchEPC();
  }, [fetchEPC]);

  return (
    <WorkflowContext.Provider
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
    </WorkflowContext.Provider>
  );
}
