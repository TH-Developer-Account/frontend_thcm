import { ServerAxios } from "../../../services/ServerAxios";

import type { MasterDataResponse } from "./masterData.types";

export const MASTER_DATA_QUERY_KEY = ["master-data"] as const;

const MASTER_DATA_URL = "/master-data";

export const getMasterDataApi = async (): Promise<MasterDataResponse> => {
  const { data } = await ServerAxios.get<MasterDataResponse>(MASTER_DATA_URL);

  return data;
};
