import { useQuery } from "@tanstack/react-query";
import { machineStudyApi } from "./machineStudy.api";

export const machineStudyKeys = {
  all: ["machine-study"] as const,
  byEpc: (epcId?: string | null) =>
    [...machineStudyKeys.all, "epc", epcId ?? ""] as const,
  byId: (id?: string | null) =>
    [...machineStudyKeys.all, "detail", id ?? ""] as const,
};

export const useMachineStudiesByEpcQuery = (epcId?: string | null) => {
  return useQuery({
    queryKey: machineStudyKeys.byEpc(epcId),
    queryFn: () => machineStudyApi.getByEpc(epcId ?? ""),
    enabled: Boolean(epcId),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useMachineStudyQuery = (id?: string | null) => {
  return useQuery({
    queryKey: machineStudyKeys.byId(id),
    queryFn: () => machineStudyApi.getById(id ?? ""),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};
