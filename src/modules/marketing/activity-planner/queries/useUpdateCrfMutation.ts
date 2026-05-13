import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crfApi } from "../api/crf.api";
import { epcKeys } from "./epc.keys";
import type { CrfUpdatePayload } from "../types/crf.types";

type UpdateCrfVariables = {
	epcId: string;
	crfId: string;
	payload: CrfUpdatePayload;
};

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
