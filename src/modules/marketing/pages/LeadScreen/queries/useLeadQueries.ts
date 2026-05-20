import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";
import { groupLeadsByEvent } from "../helpers/groupLeadsByEvent";
import { leadKeys } from "./lead.keys";

export const useLeadRowsQuery = () => {
	return useQuery({
		queryKey: leadKeys.list(),
		queryFn: leadsApi.getAll,
		staleTime: 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

export const useLeadGroupsQuery = () => {
	return useQuery({
		queryKey: [...leadKeys.lists(), "grouped"],
		queryFn: async () => groupLeadsByEvent(await leadsApi.getAll()),
		staleTime: 60 * 1000,
		refetchOnWindowFocus: false,
	});
};

export const useLeadsByEpcQuery = (epcId?: string | null) => {
	return useQuery({
		queryKey: leadKeys.byEpc(epcId),
		queryFn: () => leadsApi.getByEpcId(epcId!),
		enabled: Boolean(epcId),
		staleTime: 30 * 1000,
		refetchOnWindowFocus: false,
	});
};
