import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { leadsApi } from "../api/leads.api";
import { leadKeys } from "./lead.keys";
import type { LeadListParams } from "../types/leads.types";

const LEADS_STALE_TIME = 60 * 1000;

export const useLeadRowsQuery = ({ page, pageSize }: LeadListParams) => {
	return useQuery({
		queryKey: [
			...leadKeys.list(),
			{
				page,
				pageSize,
			},
		],
		queryFn: () =>
			leadsApi.getAll({
				page,
				pageSize,
			}),
		staleTime: LEADS_STALE_TIME,
		placeholderData: keepPreviousData,
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
