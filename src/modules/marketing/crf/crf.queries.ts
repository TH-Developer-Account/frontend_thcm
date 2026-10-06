// queries/crf.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { crfApi } from "../../crf/crf.api";
import type { CrfCreatePayload, CrfUpdatePayload } from "../../crf/crf.types";
import { epcKeys } from "./epc.queries";

export const crfKeys = {
	products: () => ["products", "CRF"] as const,
};

type CreateCrfVariables = {
	epcId: string;
	payload: CrfCreatePayload;
};

type UpdateCrfVariables = {
	epcId: string;
	crfId: string;
	payload: CrfUpdatePayload;
};

export function useCrfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: crfKeys.products(),
		queryFn: crfApi.getProducts,
		enabled,
		staleTime: 10 * 60 * 1000,
	});
}

export function useCreateCrfMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ payload }: CreateCrfVariables) => crfApi.create(payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
		},
	});
}

export function useUpdateCrfMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ crfId, payload }: UpdateCrfVariables) =>
			crfApi.update(crfId, payload),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});
		},
	});
}
