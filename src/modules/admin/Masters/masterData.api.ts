import { ServerAxios } from "../../../services/ServerAxios";

import type {
	ManageMasterPayload,
	ManageMasterResponse,
	MasterDataResponse,
} from "./masterData.types";

export const MASTER_DATA_QUERY_KEY = ["master-data"] as const;

const MASTER_DATA_URL = "/master-data";

export const getMasterDataApi = async (): Promise<MasterDataResponse> => {
	const { data } = await ServerAxios.get<MasterDataResponse>(MASTER_DATA_URL);

	return data;
};

export const manageMasterDataApi = async (
	payload: ManageMasterPayload,
): Promise<ManageMasterResponse> => {
	const { data } = await ServerAxios.post<ManageMasterResponse>(
		`${MASTER_DATA_URL}/manage`,
		payload,
	);

	return data;
};
