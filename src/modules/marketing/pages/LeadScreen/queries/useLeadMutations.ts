import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";
import type {
	CreateLeadsPayload,
	UpdateLeadPayload,
} from "../types/leads.types";
import { leadKeys } from "./lead.keys";

export const useCreateLeadsMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateLeadsPayload) => leadsApi.createMany(payload),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: leadKeys.lists() }),
	});
};

export const useUpdateLeadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			leadId,
			payload,
		}: {
			leadId: string;
			payload: UpdateLeadPayload;
		}) => leadsApi.updateOne(leadId, payload),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: leadKeys.lists() }),
	});
};

export const useDeleteLeadMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ leadId }: { leadId: string; epcId?: string }) =>
			leadsApi.deleteOne(leadId),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: leadKeys.lists() }),
	});
};
