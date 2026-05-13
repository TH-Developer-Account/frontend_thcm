import { useMutation, useQueryClient } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { epcKeys } from "./epc.keys";
import type { EpcCreatePayload } from "../types/epc.types";

export function useCreateEpcMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: EpcCreatePayload) => epcApi.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: epcKeys.lists() });
		},
	});
}
