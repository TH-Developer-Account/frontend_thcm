// queries/useCreateEpcMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { workflowApi } from "../api/workflow.api";
import { epcKeys } from "./epc.keys";
import type { EpcCreatePayload, EpcUpdatePayload } from "../types/epc.types";

type UpdateEpcVariables = {
	epcId: string;
	payload: EpcUpdatePayload;
};
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

export const useSubmitClarifiedUpdatedFormMutation = () => {
	return useMutation({
		mutationFn: (workflowId: string) =>
			workflowApi.submitClarifiedUpdatedForm(workflowId),
	});
};
