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

export const profileKeys = {
  all: ["profiles"] as const,
  list: (appKey = "all") => [...profileKeys.all, "list", appKey] as const,
  detail: (profileId: string) =>
    [...profileKeys.all, "detail", profileId] as const,
};

export const profileApi = {
  list: async (appKey?: string, signal?: AbortSignal): Promise<Profile[]> => {
    const { data } = await ServerAxios.get("/profile", {
      params: appKey ? { appKey } : {},
      signal,
    });
    return data.data;
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
