import { useMutation, useQueryClient } from "@tanstack/react-query";
import { epfApi } from "../api/epf.api";
import { epcKeys } from "./epc.keys";
import type { EpfCreatePayload } from "../types/epf.types";

type CreateEpfVariables = {
	epcId: string;
	payload: EpfCreatePayload;
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
