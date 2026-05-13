import { useMutation, useQueryClient } from "@tanstack/react-query";
import { epfApi } from "../api/epf.api";
import { epcKeys } from "./epc.keys";
import type { EpfUpdatePayload } from "../types/epf.types";

type UpdateEpfVariables = {
	epcId: string;
	epfId: string;
	payload: EpfUpdatePayload;
};

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
