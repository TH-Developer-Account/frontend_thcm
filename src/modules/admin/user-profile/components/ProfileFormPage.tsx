import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../context/Auth/AuthContext";
import PageSectionLayout from "../../../../layout/PageSectionLayout";
import {
  showApiErrorToast,
  showSuccessToast,
} from "../../../../utils/apiError.helper";
import { useManageableApps } from "../../access.api";
import { profileApi, profileKeys } from "../profile.api";
import { usePermissionMatrix } from "../hooks/userPermissionMatrix";
import { toPermissionInputs } from "../utils/permissions";
import PermissionMatrix from "./PermissionMatrix";
import ProfileGeneralSection from "./ProfileGeneralSection";

import type {
  ModuleDefinition,
  ProfileFormValues,
  ProfilePermission,
} from "../types/profile.types";

const PROFILE_LIST_PATH = "/admin/user-profiles";

// Module-level so usePermissionMatrix sees the same reference every render.
const NO_MODULES: ModuleDefinition[] = [];
const NO_PERMISSIONS: ProfilePermission[] = [];

const EMPTY_FORM: ProfileFormValues = { appKey: "", name: "", description: "" };

export const ProfileFormPage = () => {
  const { id: profileId } = useParams();
  const isEditing = Boolean(profileId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeSection, setActiveSection] = useState<"general" | "permissions">(
    "general",
  );
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ProfileFormValues>(EMPTY_FORM);

  const appsQuery = useManageableApps();
  const apps = appsQuery.data ?? [];

  const profileQuery = useQuery({
    queryKey: profileKeys.detail(profileId ?? ""),
    queryFn: () => profileApi.get(profileId as string),
    enabled: isEditing,
  });
  const profile = profileQuery.data;

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      appKey: profile.appKey,
      name: profile.name,
      description: profile.description ?? "",
    });
  }, [profile]);

  // An admin of a single app should not have to pick it.
  const soleAppKey = !isEditing && apps.length === 1 ? apps[0].appKey : "";
  const selectedAppKey = form.appKey || soleAppKey;
  const selectedApp = apps.find((app) => app.appKey === selectedAppKey);

  const {
    permissionState,
    toggleModulePermission,
    toggleAllPermissions,
    toggleActionForAllModules,
    getActionCheckboxState,
  } = usePermissionMatrix(
    selectedApp?.modules ?? NO_MODULES,
    profile?.permissions ?? NO_PERMISSIONS,
  );

  const visibleModules = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const modules = selectedApp?.modules ?? NO_MODULES;
    if (!normalizedSearch) return modules;
    return modules.filter((appModule) =>
      appModule.name.toLowerCase().includes(normalizedSearch),
    );
  }, [selectedApp, search]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: toPermissionInputs(permissionState),
      };
      return isEditing
        ? profileApi.update(profileId as string, input)
        : profileApi.create(selectedAppKey, input);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
      showSuccessToast(showToast, response.message);
      navigate(PROFILE_LIST_PATH);
    },
    onError: (error) =>
      showApiErrorToast(showToast, error, "Failed to save profile."),
  });

  const handleFieldChange = <K extends keyof ProfileFormValues>(
    field: K,
    value: ProfileFormValues[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const pageTitle = isEditing ? "Edit Profile" : "Create Profile";

  return (
    <PageSectionLayout>
      <PageHeader
        headerText={pageTitle}
        navigation={{
          variant: "breadcrumbs",
          ariaLabel: "User Profile page location",
          breadcrumbs: [
            { label: "User profiles", href: PROFILE_LIST_PATH },
            { label: pageTitle },
          ],
          separator: "›",
        }}
      />

      {activeSection === "general" && (
        <ProfileGeneralSection
          form={{ ...form, appKey: selectedAppKey }}
          apps={apps}
          isEditing={isEditing}
          isLoadingApps={appsQuery.isLoading}
          onFieldChange={handleFieldChange}
          onCancel={() => navigate(PROFILE_LIST_PATH)}
          onContinue={() => setActiveSection("permissions")}
        />
      )}

      {activeSection === "permissions" && selectedApp && (
        <PermissionMatrix
          app={selectedApp}
          visibleModules={visibleModules}
          permissionState={permissionState}
          search={search}
          onSearchChange={setSearch}
          getActionCheckboxState={getActionCheckboxState}
          onToggleAll={toggleAllPermissions}
          onToggleAction={toggleActionForAllModules}
          onToggleModule={toggleModulePermission}
          isSaving={saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
          onBack={() => setActiveSection("general")}
        />
      )}
    </PageSectionLayout>
  );
};
