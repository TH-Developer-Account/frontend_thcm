import { ServerAxios } from "../../../services/ServerAxios";

import type { SaveMasterPayload } from "./masters.types";

// Create + update use the existing endpoint; lists come from GET /master-data
// through useMasterData, so there is no list API here.
export const saveMasterApi = async (
	payload: SaveMasterPayload,
): Promise<{ message: string }> => {
	const { data } = await ServerAxios.post<{ message: string }>("/master-data/manage", payload);
	return data;
};
