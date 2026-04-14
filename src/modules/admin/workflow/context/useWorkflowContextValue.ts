import { createContext } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { WorkflowRow } from "../types/workflow.types";

export interface WorkflowContextValue {
	data: WorkflowRow[];
	loading: boolean;
	search: string;
	pageIndex: number;
	pageSize: number;
	totalPages: number;
	sorting: SortingState;
	setSearch: React.Dispatch<React.SetStateAction<string>>;
	setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
	setPageIndex: React.Dispatch<React.SetStateAction<number>>;
	setPageSize: React.Dispatch<React.SetStateAction<number>>;
	refetch: () => Promise<void>;
}

export const WorkflowContext = createContext<WorkflowContextValue | undefined>(
	undefined,
);
