import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { crfApi } from "../api/crf.api";
import { epcKeys } from "./epc.keys";
import type { CrfCreatePayload, CrfUpdatePayload } from "../types/crf.types";

type CreateCrfVariables = {
	epcId: string;
	payload: CrfCreatePayload;
};
type UpdateCrfVariables = {
	epcId: string;
	crfId: string;
	payload: CrfUpdatePayload;
};

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

export function useCrfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: ["products", "CRF"],
		queryFn: crfApi.getProducts,
		enabled,
		staleTime: 10 * 60 * 1000,
	});
}
