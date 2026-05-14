// queries/useCreateEpcMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { epcKeys } from "./epc.keys";
import type { EpcCreatePayload } from "../types/epc.types";

export const useCreateEpcMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: EpcCreatePayload) => epcApi.create(payload),

		onSuccess: async (createdEpc) => {
			await queryClient.invalidateQueries({
				queryKey: epcKeys.lists(),
			});

			const createdEpcId =
				createdEpc?.id ?? createdEpc?.eventProposal?.id ?? createdEpc?.epc?.id;

			if (createdEpcId) {
				queryClient.setQueryData(epcKeys.detail(createdEpcId), createdEpc);
			}
		},
	});
};
