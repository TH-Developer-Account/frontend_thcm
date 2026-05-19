import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "../api/leads.api";

export const leadKeys = {
	all: ["leads"] as const,
	list: () => [...leadKeys.all, "list"] as const,
};

export const useLeadsQuery = () => {
	return useQuery({
		queryKey: leadKeys.list(),
		queryFn: leadsApi.getAll,
		staleTime: 60 * 1000,
		refetchOnWindowFocus: false,
	});
};
