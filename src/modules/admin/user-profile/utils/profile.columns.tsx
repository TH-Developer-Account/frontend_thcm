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

const getProfileUserCount = (profile: Profile): number =>
	profile.assignedUserCount ?? profile.users?.length ?? 0;

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
		accessorKey: "description",
		header: "Description",
		cell: ({ row }) => (
			<p className="profile-description-cell">
				{row.original.description || "No description provided."}
			</p>
		),
	},
	{
		id: "assignedUserCount",
		accessorFn: getProfileUserCount,
		header: "User Count",
		cell: ({ row }) => (
			<span className="profile-user-count">
				{getProfileUserCount(row.original)}
			</span>
		),
	},
	{
		id: "users",
		accessorFn: (profile) =>
			profile.users
				?.map((user) => `${user.firstName} ${user.lastName}`.trim())
				.join(", ") ?? "",
		header: "Assigned Users",
		enableSorting: false,
		cell: ({ row }) => {
			const users = row.original.users ?? [];
			const visibleUsers = users.slice(0, 3);
			const remainingUsers = users.slice(3);

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

					{remainingUsers.length ? (
						<Popover
							placement="bottom-start"
							trigger={
								<Button
									type="button"
									text={`+${remainingUsers.length}`}
									appearance="filter"
									variant="secondary"
									size="sm"
									aria-label={`View ${remainingUsers.length} more assigned users`}
									className="profile-more-users-button"
								/>
							}
						>
							<div className="profile-users-popover">
								<p className="profile-users-popover-title">Assigned users</p>

								<ul className="profile-users-popover-list">
									{users.map((user) => {
										const fullName =
											`${user.firstName} ${user.lastName}`.trim();

										return (
											<li key={user.id} className="profile-users-popover-item">
												<Avatar
													size="sm"
													firstName={user.firstName}
													lastName={user.lastName}
													isTooltip={false}
												/>

												<span>{fullName || "Unnamed user"}</span>
											</li>
										);
									})}
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
						isTooltip="Delete profile"
						onClick={() => onDelete(profile)}
					/>
				</div>
			);
		},
	},
];
