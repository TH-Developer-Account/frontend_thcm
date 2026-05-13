import { useQuery } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { epcKeys } from "./epc.keys";

export function useEpcDetailQuery(epcId?: string) {
	return useQuery({
		queryKey: epcKeys.detail(epcId),
		queryFn: () => epcApi.getById(epcId!),
		enabled: Boolean(epcId),
		staleTime: 60_000,
	});
}
