import { useMutation, useQueryClient } from "@tanstack/react-query";

import { saveMasterApi } from "../modules/admin/Masters/masters.api";
import { MASTER_DATA_QUERY_KEY } from "../modules/admin/Masters/masterData.api";
import type { SaveMasterPayload } from "../modules/admin/Masters/masters.types";

/**
 * Create / update a master record, then refetch the shared dropdown cache.
 * That cache has staleTime Infinity and refetchOnMount false, so a plain
 * invalidate would leave every screen showing old values; refetchType "all"
 * forces the refetch.
 */
export const useSaveMaster = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: SaveMasterPayload) => saveMasterApi(payload),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: MASTER_DATA_QUERY_KEY, refetchType: "all" }),
	});
};
