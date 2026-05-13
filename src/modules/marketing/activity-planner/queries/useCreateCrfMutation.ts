import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crfApi } from "../api/crf.api";
import { epcKeys } from "./epc.keys";
import type { CrfCreatePayload } from "../types/crf.types";

type CreateCrfVariables = {
	epcId: string;
	payload: CrfCreatePayload;
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
