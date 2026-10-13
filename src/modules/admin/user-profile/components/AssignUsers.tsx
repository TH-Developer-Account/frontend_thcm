import { useEffect, useState } from "react";

import Avatar from "../../../../components/common/Avatar";
import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import Checkbox from "../../../../components/forms/Checkbox";
import { SearchInput } from "../../../../components/forms/SearchInput";
import { useUserSearch } from "../../users/useUserSearch";
import { getUserDisplayName } from "../../users/user-management.utils";

import type { User } from "../../users/user-management.types";
import type { Profile } from "../types/profile.types";

type AssignUsersProps = {
  profile: Profile | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (userIds: string[]) => void;
};

// A user holds one profile per app, so ticking someone who already has a
// different profile in this app moves them — the admin should see that first.
const findConflictingProfileName = (
  user: User,
  profile: Profile,
): string | undefined =>
  user.appAccess.find(
    (access) =>
      access.appKey === profile.appKey && access.profileId !== profile.id,
  )?.profileName;

export const AssignUsers = ({
  profile,
  isSaving,
  onClose,
  onSave,
}: AssignUsersProps) => {
  const [search, setSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const usersQuery = useUserSearch(search, Boolean(profile));
  const users = usersQuery.data ?? [];

  // Reset only when a different profile opens, so searching never drops
  // selections already made in the modal.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUserIds(profile?.users.map((user) => user.id) ?? []);
    setSearch("");
  }, [profile]);

  const toggleUser = (userId: string) =>
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );

  const renderUserRow = (user: User, currentProfile: Profile) => {
    const isSelected = selectedUserIds.includes(user.id);
    const conflictingProfileName = findConflictingProfileName(
      user,
      currentProfile,
    );

    return (
      <label
        key={user.id}
        className={`assign-user-row ${isSelected ? "assign-user-row-selected" : ""}`}
      >
        <span className="assign-user-avatar">
          <Avatar firstName={user.firstName} lastName={user.lastName} />
        </span>

        <span className="assign-user-main">
          <span className="assign-user-name">{getUserDisplayName(user)}</span>
          <span className="assign-user-mobile-meta">{user.email || "--"}</span>
          {conflictingProfileName ? (
            <span className="assign-user-conflict">
              {isSelected ? "Will replace" : "Currently has"} “
              {conflictingProfileName}” in {currentProfile.appName}
            </span>
          ) : null}
        </span>

        <span className="assign-user-meta assign-user-email">
          {user.email || "--"}
        </span>
        <span className="assign-user-meta assign-user-phone">
          {user.phoneNumber || "--"}
        </span>

        <span className="assign-user-check">
          <Checkbox checked={isSelected} onChange={() => toggleUser(user.id)} />
        </span>
      </label>
    );
  };

  return (
    <Modal
      open={Boolean(profile)}
      onClose={onClose}
      size="lg"
      title={profile ? `Assign Users · ${profile.name}` : "Assign Users"}
      footer_actions={
        <>
          <Button
            text="Cancel"
            type="button"
            onClick={onClose}
            disabled={isSaving}
            appearance="ghost"
            variant="secondary"
          />
          <Button
            text={isSaving ? "Saving..." : "Save Assignments"}
            type="button"
            onClick={() => onSave(selectedUserIds)}
            disabled={isSaving}
            appearance="standard"
            variant="brand"
          />
        </>
      }
    >
      <div className="assign-users">
        <div className="assign-users-toolbar">
          <div className="assign-users-search">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
            />
          </div>
          <div className="assign-users-count">
            <span>{selectedUserIds.length}</span> selected
          </div>
        </div>

        <p className="assign-users-hint">
          Unticking a user removes their access to{" "}
          {profile?.appName ?? "this app"}.
        </p>

        <div className="assign-users-list scrollbar-sleek">
          {usersQuery.isLoading ? (
            <div className="assign-users-state">Loading users...</div>
          ) : users.length > 0 && profile ? (
            users.map((user) => renderUserRow(user, profile))
          ) : (
            <div className="assign-users-state">
              {search.trim()
                ? `No users found for "${search.trim()}"`
                : "No users found"}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
