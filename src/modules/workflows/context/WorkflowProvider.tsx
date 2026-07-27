import { useCallback, useEffect, useState } from "react";
import { api_routes } from "../constant/workflow.constant";
import type { ReactNode } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { WorkflowCard } from "../types/workflow.types";
import { ServerAxios } from "../../../services/ServerAxios";
import { WorkflowContext } from "./useWorkflowContextValue";
import { useDebounce } from "../../../hooks/useDebounce";
import { mapWorkflows } from "../utils/workflow.helpers";
import type { Option } from "../../../components/forms/input.types";

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
	const [filters, setFilters] = useState<Record<string, Option[]>>({});

	const [totalPages, setTotalPages] = useState(0);
	const debouncedSearch = useDebounce(search, 500); // 500ms delay

	const transformFilters = (filters: Record<string, Option[]>) => {
		return {
			createdBy: (filters["createdBy"] || []).map((o) => o.value),
			apps: (filters["apps"] || []).map((o) => o.value),
		};
	};

	const fetchWorkflowList = useCallback(async () => {
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
					filters: JSON.stringify(transformFilters(filters)),
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
	}, [pageIndex, pageSize, debouncedSearch, sorting, filters]);

	useEffect(() => {
		fetchWorkflowList();
	}, [fetchWorkflowList]);

	return (
		<WorkflowContext.Provider
			value={{
				data,
				setData,
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
				filters,
				setFilters,
				refetch: fetchWorkflowList,
			}}
		>
			{children}
		</WorkflowContext.Provider>
	);
}
