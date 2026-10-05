import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash, UserPlus } from "lucide-react";

import Avatar from "../../../../components/common/Avatar";
import Button from "../../../../components/common/Button";
import Popover from "../../../../components/common/Popover";

import type { Profile } from "../types/profile.types";

type GetProfileColumnsOptions = {
  onAssignUsers: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
};

const getAssigneeName = (user: Profile["users"][number]) =>
  `${user.firstName} ${user.lastName}`.trim();

export const getProfileColumns = ({
  onAssignUsers,
  onEdit,
  onDelete,
}: GetProfileColumnsOptions): ColumnDef<Profile>[] => [
  {
    accessorKey: "name",
    header: "Profile Name",
    cell: ({ row }) => (
      <div className="profile-name-cell">
        <span className="profile-name-cell-title">
          {row.original.name || "Unnamed profile"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "appName",
    header: "Application",
    cell: ({ row }) => (
      <span className="profile-app-cell">{row.original.appName}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <p className="profile-description-cell">
        {row.original.description || "No description provided."}
      </p>
    ),
  },
  {
    accessorKey: "assignedUserCount",
    header: "User Count",
    cell: ({ row }) => (
      <span className="profile-user-count">
        {row.original.assignedUserCount}
      </span>
    ),
  },
  {
    id: "users",
    accessorFn: (profile) => profile.users.map(getAssigneeName).join(", "),
    header: "Assigned Users",
    enableSorting: false,
    cell: ({ row }) => {
      const users = row.original.users;
      const visibleUsers = users.slice(0, 3);
      const remainingCount = users.length - visibleUsers.length;

      if (!users.length) {
        return <span className="profile-users-empty">No users assigned</span>;
      }

      return (
        <div className="profile-users-cell">
          <div
            className="profile-avatar-group"
            aria-label={`${users.length} assigned users`}
          >
            {visibleUsers.map((user) => (
              <Avatar
                key={user.id}
                size="sm"
                firstName={user.firstName}
                lastName={user.lastName}
                className="profile-user-avatar"
                isTooltip
              />
            ))}
          </div>

          {remainingCount > 0 ? (
            <Popover
              placement="bottom-start"
              trigger={
                <Button
                  type="button"
                  text={`+${remainingCount}`}
                  appearance="filter"
                  variant="secondary"
                  size="sm"
                  aria-label={`View ${remainingCount} more assigned users`}
                  className="profile-more-users-button"
                />
              }
            >
              <div className="profile-users-popover">
                <p className="profile-users-popover-title">Assigned users</p>
                <ul className="profile-users-popover-list">
                  {users.map((user) => (
                    <li key={user.id} className="profile-users-popover-item">
                      <Avatar
                        size="sm"
                        firstName={user.firstName}
                        lastName={user.lastName}
                        isTooltip={false}
                      />
                      <span>{getAssigneeName(user) || "Unnamed user"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popover>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const profile = row.original;
      // The backend refuses to delete an assigned profile; disabling the
      // button says so before the round trip.
      const isDeleteBlocked = profile.assignedUserCount > 0;

      return (
        <div className="profile-row-actions">
          <Button
            type="button"
            appearance="icon"
            variant="secondary"
            size="sm"
            Icon={UserPlus}
            iconSize={16}
            aria-label={`Assign users to ${profile.name}`}
            isTooltip="Assign users"
            onClick={() => onAssignUsers(profile)}
          />
          <Button
            type="button"
            appearance="icon"
            variant="secondary"
            size="sm"
            Icon={Edit}
            iconSize={16}
            aria-label={`Edit ${profile.name}`}
            isTooltip="Edit profile"
            onClick={() => onEdit(profile)}
          />
          <Button
            type="button"
            appearance="icon"
            variant="secondary"
            size="sm"
            Icon={Trash}
            iconSize={16}
            aria-label={`Delete ${profile.name}`}
            isTooltip={
              isDeleteBlocked
                ? "Unassign all users before deleting"
                : "Delete profile"
            }
            disabled={isDeleteBlocked}
            onClick={() => onDelete(profile)}
          />
        </div>
      );
    },
  },
];
