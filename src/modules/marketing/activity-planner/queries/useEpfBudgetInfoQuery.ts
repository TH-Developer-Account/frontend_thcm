import { useQuery } from "@tanstack/react-query";
import { budgetApi } from "../../../../common/common.api";

export function useEpfBudgetInfoQuery(budgetMasterId?: string) {
	return useQuery({
		queryKey: ["budget-info", budgetMasterId],
		queryFn: () => budgetApi.getBudgetInfo(budgetMasterId),
		enabled: Boolean(budgetMasterId),
		staleTime: 5 * 60 * 1000,
	});
}
