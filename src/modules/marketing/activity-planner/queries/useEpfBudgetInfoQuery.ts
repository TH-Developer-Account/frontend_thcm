import { useQuery } from "@tanstack/react-query";
import { epfApi } from "../api/epf.api";

export function useEpfBudgetInfoQuery(budgetMasterId?: string) {
	return useQuery({
		queryKey: ["budget-info", budgetMasterId],
		queryFn: () => epfApi.getBudgetInfo(budgetMasterId),
		enabled: Boolean(budgetMasterId),
		staleTime: 5 * 60 * 1000,
	});
}
