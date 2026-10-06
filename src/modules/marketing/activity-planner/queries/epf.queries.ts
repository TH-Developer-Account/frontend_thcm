// queries/epf.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { budgetApi } from "../../../../common/common.api";
import { epfApi } from "../api/epf.api";
import type { EpfCreatePayload, EpfUpdatePayload } from "../types/epf.types";
import { epcKeys } from "./epc.queries";

export const epfKeys = {
	products: () => ["products", "EPF"] as const,
	budgetInfo: (budgetMasterId?: string) =>
		["budget-info", budgetMasterId] as const,
};

type CreateEpfVariables = {
	epcId: string;
	payload: EpfCreatePayload | FormData;
};

type UpdateEpfVariables = {
	epcId: string;
	epfId: string;
	payload: EpfUpdatePayload | FormData;
};

export function useEpfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: epfKeys.products(),
		queryFn: epfApi.getProducts,
		enabled,
		staleTime: 10 * 60 * 1000,
	});
}

export function useEpfBudgetInfoQuery(budgetMasterId?: string) {
	return useQuery({
		queryKey: epfKeys.budgetInfo(budgetMasterId),
		queryFn: () => budgetApi.getBudgetInfo(budgetMasterId),
		enabled: Boolean(budgetMasterId),
		staleTime: 5 * 60 * 1000,
	});
}

export function useCreateEpfMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ payload }: CreateEpfVariables) => epfApi.create(payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
		},
	});
}

export function useUpdateEpfMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ epfId, payload }: UpdateEpfVariables) =>
			epfApi.update(epfId, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
		},
	});
}
