import { useQuery } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { epcKeys } from "./epc.keys";
import type { EpcListParams } from "../types/epc.types";

export function useEpcListQuery(params: EpcListParams) {
	return useQuery({
		queryKey: epcKeys.list(params),
		queryFn: () => epcApi.getList(params),
		staleTime: 30_000,
	});
}
