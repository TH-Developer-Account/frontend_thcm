import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";
import type { CreateLeadsPayload, UpdateLeadPayload } from "../types/leads.types";
import { leadKeys } from "./lead.keys";

const invalidateLeadQueries = (queryClient: QueryClient, epcId?: string) => {
	queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
	if (epcId) queryClient.invalidateQueries({ queryKey: leadKeys.byEpc(epcId) });
};

export const useCreateLeadsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateLeadsPayload) => leadsApi.createMany(payload),
		onSuccess: (_data, variables) => invalidateLeadQueries(queryClient, variables.epcId),
	});
};

export const useUpdateLeadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ leadId, payload }: { leadId: string; payload: UpdateLeadPayload }) =>
			leadsApi.updateOne(leadId, payload),
		onSuccess: (_data, variables) => invalidateLeadQueries(queryClient, variables.payload.epcId),
	});
};

export const useDeleteLeadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ leadId }: { leadId: string; epcId?: string }) => leadsApi.deleteOne(leadId),
		onSuccess: (_data, variables) => invalidateLeadQueries(queryClient, variables.epcId),
	});
};
