import { useQuery } from "@tanstack/react-query";

import { leadsApi } from "../api/leads.api";
import { leadKeys } from "./lead.keys";

const LEADS_STALE_TIME = 60 * 1000;

export const useLeadRowsQuery = () => {
	return useQuery({
		queryKey: leadKeys.list(),
		queryFn: leadsApi.getAll,
		staleTime: LEADS_STALE_TIME,
		refetchOnWindowFocus: false,
	});
};

export const useLeadsByEpcQuery = (epcId?: string | null) => {
	return useQuery({
		queryKey: leadKeys.byEpc(epcId),
		queryFn: () => leadsApi.getByEpcId(epcId ?? ""),
		enabled: Boolean(epcId),
		staleTime: LEADS_STALE_TIME,
		refetchOnWindowFocus: false,
	});
};
