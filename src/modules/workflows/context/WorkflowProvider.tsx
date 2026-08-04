import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SortingState } from "@tanstack/react-table";

import type { Option } from "../../../components/forms/input.types";
import { useDebounce } from "../../../hooks/useDebounce";
import { workflowApi } from "../api/workflow.api";
import type { WorkflowRow } from "../types/types";
import { mapWorkflowRows } from "../utils/workflow.helpers";
import { WorkflowContext, type WorkflowListScope } from "./workflow.context";

interface WorkflowProviderProps {
	children: ReactNode;
}

const transformFilters = (
	filters: Record<string, Option[]>,
): Record<string, string[]> => ({
	createdBy: (filters.createdBy ?? []).map((option) => option.value),
	apps: (filters.apps ?? []).map((option) => option.value),
});

export function WorkflowProvider({ children }: WorkflowProviderProps) {
	const [data, setData] = useState<WorkflowRow[]>([]);
	const [loading, setLoading] = useState(false);

	const [search, setSearch] = useState("");
	const [scope, setScope] = useState<WorkflowListScope>("ALL");

	const [pageIndex, setPageIndex] = useState(0);
	const [pageSize, setPageSize] = useState(25);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [filters, setFilters] = useState<Record<string, Option[]>>({});
	const [totalPages, setTotalPages] = useState(0);

	const debouncedSearch = useDebounce(search, 500);

	const fetchWorkflowList = useCallback(async () => {
		try {
			setLoading(true);

			const sort = sorting[0];

			const response = await workflowApi.list({
				page: pageIndex + 1,
				pageSize,
				search: debouncedSearch || undefined,
				sortBy: sort?.id,
				sortOrder: sort ? (sort.desc ? "desc" : "asc") : undefined,
				filters: transformFilters(filters),
				scope,
			});

			const rows = Array.isArray(response.data) ? response.data : [];

			setData(mapWorkflowRows(rows));
			setTotalPages(response.meta?.totalPages ?? 0);
		} catch (error) {
			console.error("Failed to fetch workflow data", error);
			setData([]);
			setTotalPages(0);
		} finally {
			setLoading(false);
		}
	}, [debouncedSearch, filters, pageIndex, pageSize, scope, sorting]);

	useEffect(() => {
		void fetchWorkflowList();
	}, [fetchWorkflowList]);

	return (
		<WorkflowContext.Provider
			value={{
				data,
				setData,
				loading,

				search,
				setSearch,

				scope,
				setScope,

				pageIndex,
				pageSize,
				totalPages,
				setPageIndex,
				setPageSize,

				sorting,
				setSorting,

				filters,
				setFilters,

				refetch: fetchWorkflowList,
			}}
		>
			{children}
		</WorkflowContext.Provider>
	);
}
