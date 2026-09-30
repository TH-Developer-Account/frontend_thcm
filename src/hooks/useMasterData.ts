import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
	getMasterDataApi,
	manageMasterDataApi,
	MASTER_DATA_QUERY_KEY,
} from "../modules/admin/Masters/masterData.api";
import { MASTER_KEYS } from "../modules/admin/Masters/master.data.constant";
import type {
	ManageMasterPayload,
	MasterDataResponse,
	MasterName,
} from "../modules/admin/Masters/masterData.types";

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

type ManageMasterMutation = {
	payload: ManageMasterPayload;
	masterName: MasterName;
};

export const useManageMasterData = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ payload }: ManageMasterMutation) =>
			manageMasterDataApi(payload),

		onSuccess: (response, variables) => {
			const { payload, masterName } = variables;

			queryClient.setQueryData<MasterDataResponse>(
				MASTER_DATA_QUERY_KEY,
				(current) => {
					if (!current) {
						return current;
					}

					const key = MASTER_KEYS[masterName];

					const collection = [...current[key]];

					if (payload.action === "create") {
						const created = response.data;

						if (!created || typeof created !== "object") {
							return current;
						}

						return {
							...current,
							[key]: [...collection, created],
						};
					}

					const updated = response.data;

					if (!updated || typeof updated !== "object") {
						return current;
					}

					return {
						...current,
						[key]: collection.map((item) => {
							const itemId = String(item.value ?? "");
							const updatedId = String(
								(updated as { value?: string }).value ?? payload.data.id ?? "",
							);

							return itemId === updatedId
								? {
										...item,
										...updated,
									}
								: item;
						}),
					};
				},
			);
		},
	});
};
