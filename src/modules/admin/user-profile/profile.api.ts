import { ServerAxios } from "../../../services/ServerAxios";

import type {
  Profile,
  ProfileAssignmentResult,
  ProfileFormValues,
  ProfilePermissionInput,
} from "./types/profile.types";

type MessageResponse = { message: string };
type ProfileSaveInput = Omit<ProfileFormValues, "appKey"> & {
  permissions: ProfilePermissionInput[];
};

const encode = encodeURIComponent;

// Mirrors the server cap in parsePaginationParams.
export const PROFILE_LIST_MAX_PAGE_SIZE = 100;

export type ProfileListParams = {
  appKey?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
};

export type ProfilePage = {
  rows: Profile[];
  totalCount: number;
};

// Empty params are dropped so the query string only carries what was asked.
const toProfileListQuery = (params: ProfileListParams) =>
  Object.fromEntries(
    Object.entries({ ...params, search: params.search?.trim() }).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );

export const profileKeys = {
  all: ["profiles"] as const,
  list: (appKey = "all") => [...profileKeys.all, "list", appKey] as const,
  page: (params: ProfileListParams) =>
    [...profileKeys.all, "page", params] as const,
  detail: (profileId: string) =>
    [...profileKeys.all, "detail", profileId] as const,
};

export const profileApi = {
  listPage: async ({
    signal,
    ...params
  }: ProfileListParams & { signal?: AbortSignal }): Promise<ProfilePage> => {
    const { data } = await ServerAxios.get("/profile", {
      params: toProfileListQuery(params),
      signal,
    });
    return { rows: data.rows ?? [], totalCount: data.totalCount ?? 0 };
  },

  // Pickers need every profile of an app, not a page. One request is enough
  // while an app has fewer profiles than the server's page-size cap.
  list: async (appKey?: string, signal?: AbortSignal): Promise<Profile[]> => {
    const { rows } = await profileApi.listPage({
      appKey,
      pageSize: PROFILE_LIST_MAX_PAGE_SIZE,
      signal,
    });
    return rows;
  },

  get: async (profileId: string): Promise<Profile> => {
    const { data } = await ServerAxios.get(`/profile/${encode(profileId)}`);
    return data;
  },

  create: async (
    appKey: string,
    input: ProfileSaveInput,
  ): Promise<MessageResponse> => {
    const { data } = await ServerAxios.post("/profile/create", {
      appKey,
      ...input,
    });
    return data;
  },

  update: async (
    profileId: string,
    input: ProfileSaveInput,
  ): Promise<MessageResponse> => {
    const { data } = await ServerAxios.patch(
      `/profile/update/${encode(profileId)}`,
      input,
    );
    return data;
  },

  remove: async (profileId: string): Promise<MessageResponse> => {
    const { data } = await ServerAxios.delete(
      `/profile/delete/${encode(profileId)}`,
    );
    return data;
  },

  setAssignees: async (
    profileId: string,
    userIds: string[],
  ): Promise<ProfileAssignmentResult> => {
    const { data } = await ServerAxios.put(
      `/profile/${encode(profileId)}/assignments`,
      { userIds },
    );
    return data.data;
  },
};
