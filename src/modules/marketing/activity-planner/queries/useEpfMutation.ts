import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { epfApi } from "../api/epf.api";
import { epcKeys } from "./epc.keys";
import type { EpfCreatePayload, EpfUpdatePayload } from "../types/epf.types";

type CreateEpfVariables = {
	epcId: string;
	payload: EpfCreatePayload;
};

type UpdateEpfVariables = {
	epcId: string;
	epfId: string;
	payload: EpfUpdatePayload;
};

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

export function useEpfProductsQuery(enabled = true) {
	return useQuery({
		queryKey: ["products", "EPF"],
		queryFn: epfApi.getProducts,
		enabled,
		staleTime: 10 * 60 * 1000,
	});
}
