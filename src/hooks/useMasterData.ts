import { useQuery } from "@tanstack/react-query";

import {
  getMasterDataApi,
  MASTER_DATA_QUERY_KEY,
} from "../modules/admin/Masters/masterData.api";

// Saves go through useSaveMaster (masters.config.ts/masters.types.ts's
// MasterKey-based SaveMasterPayload) — that's the only Masters-admin write
// path MastersPage.tsx actually uses. The old useManageMasterData mutation
// (MasterName-keyed cache patch) had no live caller and has been removed
// along with the dead Masters screen it supported.
export const useMasterData = () => {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEY,
    queryFn: getMasterDataApi,

    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
