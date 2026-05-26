// queries/useEpcListQuery.ts
import { useQuery } from "@tanstack/react-query";
import { epcApi } from "../api/epc.api";
import { epcKeys } from "./epc.keys";
import type { EpcListParams } from "../types/epc.types";

export const useEpcListQuery = (
  params: EpcListParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: epcKeys.list(params),
    queryFn: () => epcApi.getList(params),
    enabled: options?.enabled,
  });
};

export function useEpcDetailQuery(epcId?: string) {
  return useQuery({
    queryKey: epcKeys.detail(epcId),
    queryFn: () => epcApi.getById(epcId!),
    enabled: Boolean(epcId),
    staleTime: 60_000,
  });
}
