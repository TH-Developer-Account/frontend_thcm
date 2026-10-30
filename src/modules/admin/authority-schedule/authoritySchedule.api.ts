import { ServerAxios } from "../../../services/ServerAxios";

import type {
  AuthorityLimit,
  AuthorityLimitInput,
  AuthorityRole,
} from "./authoritySchedule.types";

const AUTHORITY_SCHEDULE_URL = "/authority-schedule/limits";

export const AUTHORITY_SCHEDULE_QUERY_KEY = [
  "authority-schedule-limits",
] as const;

type ApiEnvelope<T> = { success?: boolean; data: T; message?: string };

export const getAuthorityLimitsApi = async (): Promise<AuthorityLimit[]> => {
  const { data } = await ServerAxios.get<ApiEnvelope<AuthorityLimit[]>>(
    AUTHORITY_SCHEDULE_URL,
  );
  return data.data;
};

export const createAuthorityLimitApi = async (
  payload: AuthorityLimitInput,
): Promise<AuthorityLimit> => {
  const { data } = await ServerAxios.post<ApiEnvelope<AuthorityLimit>>(
    AUTHORITY_SCHEDULE_URL,
    payload,
  );
  return data.data;
};

export const updateAuthorityLimitApi = async (
  id: string,
  payload: Partial<AuthorityLimitInput>,
): Promise<AuthorityLimit> => {
  const { data } = await ServerAxios.patch<ApiEnvelope<AuthorityLimit>>(
    `${AUTHORITY_SCHEDULE_URL}/${encodeURIComponent(id)}`,
    payload,
  );
  return data.data;
};

export const replaceAuthorityLimitAssignmentsApi = async (
  id: string,
  assignments: Array<{ designationId: string; role: AuthorityRole }>,
): Promise<AuthorityLimit> => {
  const { data } = await ServerAxios.put<ApiEnvelope<AuthorityLimit>>(
    `${AUTHORITY_SCHEDULE_URL}/${encodeURIComponent(id)}/assignments`,
    { assignments },
  );
  return data.data;
};
