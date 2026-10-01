import React from "react";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { Modal } from "../../../../components/common/Modal";
import { SearchInput } from "../../../../components/forms/SearchInput";
import DataTable from "../../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { useToast } from "../../../../context/Auth/AuthContext";
import {
  showApiErrorToast,
  showSuccessToast,
} from "../../../../utils/apiError.helper";
import { userKeys } from "../../users/useUsersData";
import { profileApi, profileKeys } from "../profile.api";
import { getProfileColumns } from "../utils/profile.columns";
import { AssignUsers } from "./AssignUsers";

import type { Profile } from "../types/profile.types";

type ProfileListProps = {
  profiles: Profile[];
  search: string;
  onSearchChange: (value: string) => void;
  appFilter: React.ReactNode;
  onCreateNew: () => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profileId: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
};

const PROFILE_SKELETON_ROWS = 8;
const PROFILE_SKELETON_COLUMNS = 6;

const ProfileList = ({
  profiles,
  search,
  onSearchChange,
  appFilter,
  onCreateNew,
  onEdit,
  onDelete,
  isLoading = false,
  isFetching = false,
  isError = false,
}: ProfileListProps) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [profilePendingDelete, setProfilePendingDelete] =
    React.useState<Profile | null>(null);
  const [profileBeingAssigned, setProfileBeingAssigned] =
    React.useState<Profile | null>(null);

  const assignMutation = useMutation({
    mutationFn: ({
      profileId,
      userIds,
    }: {
      profileId: string;
      userIds: string[];
    }) => profileApi.setAssignees(profileId, userIds),
    onSuccess: async ({ assignedCount, replacedCount, removedCount }) => {
      // Assignments change both the profile rows and each user's appAccess.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
        queryClient.invalidateQueries({ queryKey: userKeys.all }),
      ]);
      showSuccessToast(
        showToast,
        // assignedCount already includes the users moved from another profile.
        `${assignedCount} assigned (${replacedCount} moved from another profile), ${removedCount} removed.`,
      );
      setProfileBeingAssigned(null);
    },
    onError: (error) =>
      showApiErrorToast(
        showToast,
        error,
        "Failed to update the users assigned to this profile.",
      ),
  });

  const columns = React.useMemo(
    () =>
      getProfileColumns({
        onAssignUsers: setProfileBeingAssigned,
        onEdit,
        onDelete: setProfilePendingDelete,
      }),
    [onEdit],
  );

  const confirmDelete = () => {
    if (!profilePendingDelete) return;
    onDelete(profilePendingDelete.id);
    setProfilePendingDelete(null);
  };

  return (
    <>
      <Card
        className="profile-listing-card"
        secondaryHeaderClassName="profile-listing-toolbar"
        secondaryHeader={
          <>
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder="Search profiles"
              aria-label="Search profiles"
            />
            {appFilter}
            <Button
              type="button"
              text="New Profile"
              Icon={Plus}
              iconPosition="left"
              iconSize={16}
              appearance="cta"
              variant="brand"
              size="sm"
              onClick={onCreateNew}
            />
          </>
        }
      >
        <section
          className="profile-listing-table"
          aria-label="User profiles"
          aria-busy={isLoading || isFetching}
        >
          {isLoading ? (
            <DataTableSkeleton
              rows={PROFILE_SKELETON_ROWS}
              columns={PROFILE_SKELETON_COLUMNS}
              showPagination
            />
          ) : isError ? (
            <div className="profile-listing-state">
              <Alert
                type="banner"
                variant="error"
                title="Unable to load profiles"
                description="The profile listing could not be retrieved. Refresh the page or try again."
              />
            </div>
          ) : (
            <DataTable<Profile>
              data={profiles}
              columns={columns}
              manualSorting={false}
              manualPagination={false}
              scrollTargetId="profile-listing-table-scroll"
              emptyTitle="No profiles found"
              emptyDescription={
                search.trim()
                  ? "No profiles match the current search."
                  : "Create a profile to configure permissions and assign users."
              }
            />
          )}

          {isFetching && !isLoading ? (
            <span className="sr-only" role="status" aria-live="polite">
              Refreshing user profiles
            </span>
          ) : null}
        </section>
      </Card>

      <Modal
        open={Boolean(profilePendingDelete)}
        onClose={() => setProfilePendingDelete(null)}
        mode="shell"
        size="sm"
        dialogRole="alertdialog"
        ariaLabel="Delete profile confirmation"
      >
        <Alert
          type="box"
          variant="warning"
          title="Delete Profile"
          description={`Are you sure you want to delete "${
            profilePendingDelete?.name ?? "this profile"
          }"?`}
          primaryAction={{ label: "Delete", onClick: confirmDelete }}
          secondaryAction={{
            label: "Cancel",
            onClick: () => setProfilePendingDelete(null),
          }}
        />
      </Modal>

      <AssignUsers
        profile={profileBeingAssigned}
        isSaving={assignMutation.isPending}
        onClose={() => {
          if (!assignMutation.isPending) setProfileBeingAssigned(null);
        }}
        onSave={(userIds) => {
          if (!profileBeingAssigned) return;
          assignMutation.mutate({
            profileId: profileBeingAssigned.id,
            userIds,
          });
        }}
      />
    </>
  );
};

export default ProfileList;
