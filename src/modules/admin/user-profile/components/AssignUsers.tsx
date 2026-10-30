import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import Avatar from "../../../../components/common/Avatar";
import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import Checkbox from "../../../../components/forms/Checkbox";
import { SearchInput } from "../../../../components/forms/SearchInput";
import { useUserSearch } from "../../users/useUserSearch";
import { getUserDisplayName } from "../../users/user-management.utils";
import { profileApi } from "../profile.api";

import type { User } from "../../users/user-management.types";
import type {
  Profile,
  ProfileAssignmentPayload,
  ProfileAssignmentPreview,
} from "../types/profile.types";

type AssignUsersProps = {
  profile: Profile | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: ProfileAssignmentPayload) => void;
};

// Explicit: the admin hand-picked individual users (original behavior).
// SelectAll: target is "every active user," with excludeUserIds holding
// anyone toggled back off. Modeled as a union, not two parallel pieces of
// state, so a row's checkbox logic can never read a combination that
// shouldn't exist (e.g. a stale userIds list left over from before
// switching into selectAll mode).
type SelectionState =
  | { mode: "explicit"; userIds: string[] }
  | { mode: "selectAll"; excludeUserIds: string[] };

const EXPLICIT_EMPTY: SelectionState = { mode: "explicit", userIds: [] };

const toAssignmentPayload = (
  selection: SelectionState,
): ProfileAssignmentPayload =>
  selection.mode === "explicit"
    ? { userIds: selection.userIds }
    : { selectAll: true, excludeUserIds: selection.excludeUserIds };

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
  const [selection, setSelection] = useState<SelectionState>(EXPLICIT_EMPTY);
  const [confirmPreview, setConfirmPreview] =
    useState<ProfileAssignmentPreview | null>(null);

  const usersQuery = useUserSearch(search, Boolean(profile));
  const users = usersQuery.data ?? [];

  // Reset only when a different profile opens, so searching never drops
  // selections already made in the modal.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelection({
      mode: "explicit",
      userIds: profile?.users.map((user) => user.id) ?? [],
    });
    setSearch("");
    setConfirmPreview(null);
  }, [profile]);

  const previewMutation = useMutation({
    mutationFn: ({
      profileId,
      excludeUserIds,
    }: {
      profileId: string;
      excludeUserIds: string[];
    }) => profileApi.previewAssignment(profileId, excludeUserIds),
    onSuccess: setConfirmPreview,
  });

  const toggleUser = (user: User) =>
    setSelection((current) => {
      if (current.mode === "explicit") {
        return {
          mode: "explicit",
          userIds: current.userIds.includes(user.id)
            ? current.userIds.filter((id) => id !== user.id)
            : [...current.userIds, user.id],
        };
      }
      // selectAll mode: toggling a row means excluding/re-including it,
      // never touching an explicit userIds list (there isn't one).
      return {
        mode: "selectAll",
        excludeUserIds: current.excludeUserIds.includes(user.id)
          ? current.excludeUserIds.filter((id) => id !== user.id)
          : [...current.excludeUserIds, user.id],
      };
    });

  // Checking it on discards any hand-picked selection (select-all
  // supersedes manual picks rather than merging with them); checking it
  // off clears to nobody selected, same as unchecking every row would.
  const toggleSelectAll = () =>
    setSelection((current) =>
      current.mode === "selectAll"
        ? EXPLICIT_EMPTY
        : { mode: "selectAll", excludeUserIds: [] },
    );

  const isRowSelected = (user: User) =>
    selection.mode === "explicit"
      ? selection.userIds.includes(user.id)
      : user.status === "Active" && !selection.excludeUserIds.includes(user.id);

  const isRowDisabled = (user: User) =>
    selection.mode === "selectAll" && user.status !== "Active";

  const selectedCount =
    selection.mode === "explicit" ? selection.userIds.length : undefined;

  const handleSaveClick = () => {
    if (!profile) return;
    if (selection.mode === "explicit") {
      onSave(toAssignmentPayload(selection));
      return;
    }
    previewMutation.mutate({
      profileId: profile.id,
      excludeUserIds: selection.excludeUserIds,
    });
  };

  const confirmSelectAllSave = () => {
    if (!confirmPreview) return;
    onSave(toAssignmentPayload(selection));
    setConfirmPreview(null);
  };

  const renderUserRow = (user: User, currentProfile: Profile) => {
    const isSelected = isRowSelected(user);
    const isDisabled = isRowDisabled(user);
    const conflictingProfileName = findConflictingProfileName(
      user,
      currentProfile,
    );

    return (
      <label
        key={user.id}
        className={`assign-user-row ${isSelected ? "assign-user-row-selected" : ""} ${isDisabled ? "assign-user-row-disabled" : ""}`}
      >
        <span className="assign-user-avatar">
          <Avatar firstName={user.firstName} lastName={user.lastName} />
        </span>

        <span className="assign-user-main">
          <span className="assign-user-name">{getUserDisplayName(user)}</span>
          <span className="assign-user-mobile-meta">{user.email || "--"}</span>
          {isDisabled ? (
            <span className="assign-user-conflict">
              Inactive — not eligible for Select all
            </span>
          ) : conflictingProfileName ? (
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
          <Checkbox
            checked={isSelected}
            disabled={isDisabled}
            onChange={() => toggleUser(user)}
          />
        </span>
      </label>
    );
  };

  return (
    <>
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
              text={
                isSaving
                  ? "Saving..."
                  : previewMutation.isPending
                    ? "Checking..."
                    : "Save Assignments"
              }
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving || previewMutation.isPending}
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

            <label className="assign-users-select-all">
              <Checkbox
                checked={selection.mode === "selectAll"}
                indeterminate={
                  selection.mode === "selectAll" &&
                  selection.excludeUserIds.length > 0
                }
                onChange={toggleSelectAll}
                label="Select all active users"
              />
            </label>

            <div className="assign-users-count">
              {selection.mode === "selectAll" ? (
                <span>All active users</span>
              ) : (
                <>
                  <span>{selectedCount}</span> selected
                </>
              )}
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

      <Modal
        open={Boolean(confirmPreview)}
        onClose={() => setConfirmPreview(null)}
        mode="shell"
        size="sm"
        dialogRole="alertdialog"
        ariaLabel="Confirm select-all assignment"
        title="Confirm assignment"
      >
        {confirmPreview ? (
          <div className="modal-form">
            <p className="modal-description">
              This will assign{" "}
              <strong>{confirmPreview.willBeAssignedCount}</strong> active users
              to "{profile?.name}".{" "}
              {confirmPreview.willBeReplacedCount > 0
                ? `${confirmPreview.willBeReplacedCount} of them currently hold a different profile in ${profile?.appName} and will be moved.`
                : null}
            </p>

            <footer className="modal-footer">
              <div className="modal-footer-actions">
                <Button
                  type="button"
                  text="Cancel"
                  appearance="standard"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => setConfirmPreview(null)}
                />
                <Button
                  type="button"
                  text={isSaving ? "Saving..." : "Confirm & Assign"}
                  appearance="standard"
                  variant="brand"
                  size="sm"
                  disabled={isSaving}
                  onClick={confirmSelectAllSave}
                />
              </div>
            </footer>
          </div>
        ) : null}
      </Modal>
    </>
  );
};
