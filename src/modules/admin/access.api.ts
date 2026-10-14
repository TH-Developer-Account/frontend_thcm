import { useQuery } from "@tanstack/react-query";

import { ServerAxios } from "../../services/ServerAxios";
import type { AppDefinition } from "./user-profile/types/profile.types";

type MessageResponse = { message: string };

export type AppAdministrator = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  grantedAt: string;
  grantedBy: { id: string; firstName: string; lastName: string };
};

const encode = encodeURIComponent;

export const accessKeys = {
  manageableApps: ["manageable-apps"] as const,
  administrators: (appKey: string) => ["app-administrators", appKey] as const,
};

// Endpoints under /apps: who administers an app, and which profile a user
// holds in it. Shared by the users, profiles and app-administrators screens.
export const accessApi = {
  listManageableApps: async (): Promise<AppDefinition[]> => {
    const { data } = await ServerAxios.get("/apps");
    return data.data;
  },

  listAdministrators: async (appKey: string): Promise<AppAdministrator[]> => {
    const { data } = await ServerAxios.get(
      `/apps/${encode(appKey)}/administrators`,
    );
    return data.data;
  },

  grantAdministrator: async (
    appKey: string,
    userId: string,
  ): Promise<MessageResponse> => {
    const { data } = await ServerAxios.put(
      `/apps/${encode(appKey)}/administrators/${encode(userId)}`,
    );
    return data;
  },

  revokeAdministrator: async (
    appKey: string,
    userId: string,
  ): Promise<MessageResponse> => {
    const { data } = await ServerAxios.delete(
      `/apps/${encode(appKey)}/administrators/${encode(userId)}`,
    );
    return data;
  },

  assignUserProfile: async (
    appKey: string,
    userId: string,
    profileId: string,
  ): Promise<MessageResponse> => {
    const { data } = await ServerAxios.put(
      `/apps/${encode(appKey)}/users/${encode(userId)}/profile`,
      { profileId },
    );
    return data;
  },

  removeUserProfile: async (
    appKey: string,
    userId: string,
  ): Promise<MessageResponse> => {
    const { data } = await ServerAxios.delete(
      `/apps/${encode(appKey)}/users/${encode(userId)}/profile`,
    );
    return data;
  },
};

// Apps the signed-in user may manage: every enabled app for a super admin,
// otherwise only the apps they administer.
export const useManageableApps = () =>
  useQuery({
    queryKey: accessKeys.manageableApps,
    queryFn: accessApi.listManageableApps,
    staleTime: 5 * 60 * 1000,
  });
