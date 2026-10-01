import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import SelectInput from "../../../components/forms/SelectInput";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useToast } from "../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../layout/PageSectionLayout";
import {
  showApiErrorToast,
  showSuccessToast,
} from "../../../utils/apiError.helper";
import { useManageableApps } from "../access.api";
import ProfileList from "./components/ProfileList";
import { profileApi, profileKeys } from "./profile.api";
import { usePaginatedProfiles } from "./usePaginateProfiles";

import type { Profile } from "./types/profile.types";

const ALL_APPS_OPTION = { label: "All applications", value: "" };

export const UserProfilePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const profileList = usePaginatedProfiles();
  const { query: profilesQuery } = profileList;

  const appsQuery = useManageableApps();
  const appOptions = React.useMemo(
    () => [
      ALL_APPS_OPTION,
      ...(appsQuery.data ?? []).map((app) => ({
        label: app.appName,
        value: app.appKey,
      })),
    ],
    [appsQuery.data],
  );

  React.useEffect(() => {
    if (profilesQuery.isError) {
      showApiErrorToast(
        showToast,
        profilesQuery.error,
        "Failed to load user profiles.",
      );
    }
  }, [profilesQuery.isError, profilesQuery.error, showToast]);

  const deleteMutation = useMutation({
    mutationFn: profileApi.remove,
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
      showSuccessToast(showToast, response.message);
    },
    onError: (error) =>
      showApiErrorToast(showToast, error, "Failed to delete the profile."),
  });

  const handleEdit = React.useCallback(
    (profile: Profile) =>
      navigate(`/admin/profiles/${encodeURIComponent(profile.id)}/edit`),
    [navigate],
  );

  return (
    <PageSectionLayout>
      <PageHeader
        headerText="User Profiles"
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "User profiles page location",
          breadcrumbs: [
            { label: "Home Screen", href: "/" },
            { label: "User Profiles" },
          ],
          separator: "›",
        }}
      />

      <ProfileList
        profiles={profileList.rows}
        tablePagination={profileList.tablePagination}
        search={profileList.search}
        onSearchChange={profileList.setSearch}
        appFilter={
          <SelectInput
            name="profileAppFilter"
            aria-label="Filter profiles by application"
            options={appOptions}
            value={
              appOptions.find(
                (option) => option.value === profileList.appKey,
              ) ?? ALL_APPS_OPTION
            }
            onChange={(option) => profileList.setAppKey(option?.value ?? "")}
            isSearchable={false}
            isLoading={appsQuery.isLoading}
          />
        }
        onCreateNew={() => navigate("/admin/profiles/create")}
        onEdit={handleEdit}
        onDelete={(profileId) => deleteMutation.mutate(profileId)}
        isLoading={profilesQuery.isLoading}
        isFetching={profilesQuery.isFetching}
        isError={profilesQuery.isError}
      />
    </PageSectionLayout>
  );
};
