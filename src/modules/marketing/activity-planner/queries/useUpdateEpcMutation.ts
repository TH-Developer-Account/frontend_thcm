import { useMutation, useQueryClient } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { epcKeys } from "./epc.keys";
import type { EpcUpdatePayload } from "../types/epc.types";

type UpdateEpcVariables = {
	epcId: string;
	payload: EpcUpdatePayload;
};

export function useUpdateEpcMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ epcId, payload }: UpdateEpcVariables) =>
			epcApi.update(epcId, payload),

		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: epcKeys.detail(variables.epcId),
			});

			queryClient.invalidateQueries({
				queryKey: epcKeys.lists(),
			});
		},
	});
}
