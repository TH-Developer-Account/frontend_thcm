import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Card from "../../../components/common/Card";
import SelectInput from "../../../components/forms/SelectInput";
import { useToast } from "../../../context/Auth/AuthContext";
import {
  showApiErrorToast,
  showSuccessToast,
} from "../../../utils/apiError.helper";
import { accessApi, useManageableApps } from "../access.api";
import { profileApi, profileKeys } from "../user-profile/profile.api";
import { userKeys } from "./useUsersData";

import type { Profile } from "../user-profile/types/profile.types";
import type { User } from "./user-management.types";

type UserAppAccessPanelProps = {
  user: User;
};

type ProfileOption = { label: string; value: string };

const NO_ACCESS_OPTION: ProfileOption = { label: "No access", value: "" };

type AccessChange = { appKey: string; profileId: string };

const groupProfileOptionsByApp = (
  profiles: Profile[],
): Record<string, ProfileOption[]> =>
  profiles.reduce<Record<string, ProfileOption[]>>((groups, profile) => {
    const option = { label: profile.name, value: profile.id };
    groups[profile.appKey] = [...(groups[profile.appKey] ?? []), option];
    return groups;
  }, {});

// One row per app the signed-in admin manages. Changing a row only touches
// that app's slot, so access to other apps is never affected.
export const UserAppAccessPanel = ({ user }: UserAppAccessPanelProps) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const appsQuery = useManageableApps();
  const profilesQuery = useQuery({
    queryKey: profileKeys.list(),
    queryFn: ({ signal }) => profileApi.list(undefined, signal),
  });

  const profileOptionsByApp = useMemo(
    () => groupProfileOptionsByApp(profilesQuery.data ?? []),
    [profilesQuery.data],
  );

  const changeAccessMutation = useMutation({
    mutationFn: ({ appKey, profileId }: AccessChange) =>
      profileId
        ? accessApi.assignUserProfile(appKey, user.id, profileId)
        : accessApi.removeUserProfile(appKey, user.id),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
      ]);
      showSuccessToast(showToast, response.message);
    },
    onError: (error) =>
      showApiErrorToast(showToast, error, "Failed to update app access."),
  });

  const pendingAppKey = changeAccessMutation.isPending
    ? changeAccessMutation.variables?.appKey
    : undefined;

  const apps = appsQuery.data ?? [];

  return (
    <Card title="Application Access">
      {apps.length === 0 && !appsQuery.isLoading ? (
        <p className="user-app-access-empty">
          You do not manage any applications.
        </p>
      ) : null}

      <div className="user-app-access-list">
        {apps.map((app) => {
          const currentProfileId =
            user.appAccess.find((access) => access.appKey === app.appKey)
              ?.profileId ?? "";
          const options = [
            NO_ACCESS_OPTION,
            ...(profileOptionsByApp[app.appKey] ?? []),
          ];

          return (
            <SelectInput
              key={app.appKey}
              name={`app-access-${app.appKey}`}
              label={app.appName}
              options={options}
              value={
                options.find((option) => option.value === currentProfileId) ??
                NO_ACCESS_OPTION
              }
              onChange={(option) => {
                const profileId = option?.value ?? "";
                if (profileId === currentProfileId) return;
                changeAccessMutation.mutate({ appKey: app.appKey, profileId });
              }}
              isLoading={
                profilesQuery.isLoading || pendingAppKey === app.appKey
              }
              isDisabled={changeAccessMutation.isPending}
              isSearchable={false}
            />
          );
        })}
      </div>
    </Card>
  );
};

export default UserAppAccessPanel;
