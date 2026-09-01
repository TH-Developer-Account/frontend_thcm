import React, { useEffect, useMemo, useState } from "react";

import Avatar from "../../../../components/common/Avatar";
import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import Checkbox from "../../../../components/forms/Checkbox";
import { SearchInput } from "../../../../components/forms/SearchInput";

import { ServerAxios } from "../../../../services/ServerAxios";
import { mapUser, type Profile, type User } from "../types/profile.types";

type AssignProps = {
	profile: Profile | null;
	onClose: () => void;
	handleAssignUser: (
		userIds: string[],
		profileId: string | undefined,
	) => Promise<void>;
};

export const AssignUsers: React.FC<AssignProps> = ({
	profile,
	onClose,
	handleAssignUser,
}) => {
	const [users, setUsers] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState<string>("");

	const filteredUsers = useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) return users;

		return users.filter((user) => {
			const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`
				.trim()
				.toLowerCase();

			return (
				fullName.includes(query) ||
				user.email?.toLowerCase().includes(query) ||
				user.phone?.toLowerCase().includes(query)
			);
		});
	}, [users, search]);

	const toggleUser = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id)
				? prev.filter((userId) => userId !== id)
				: [...prev, id],
		);
	};

	const handleAssign = () => {
		handleAssignUser(selectedUsers, profile?.id);
	};

	useEffect(() => {
		if (!profile?.id) return;

		const loadUsers = async () => {
			try {
				setLoading(true);

				const { data } = await ServerAxios.get("/users");
				const mappedUsers: User[] = data.map(mapUser);

				setUsers(mappedUsers);
				setSelectedUsers(profile.users?.map((each) => each.id) ?? []);
			} catch (err) {
				console.error("Failed to fetch users", err);
			} finally {
				setLoading(false);
			}
		};

		loadUsers();
	}, [profile?.id, profile?.users]);

	return (
		<Modal
			open={!!profile?.id}
			onClose={onClose}
			size="lg"
			title="Assign Users"
			footer_actions={
				<>
					<Button
						text="Cancel"
						type="button"
						onClick={onClose}
						appearance="ghost"
						variant="secondary"
					/>

					<Button
						text="Assign Users"
						type="button"
						onClick={handleAssign}
						disabled={loading}
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
						<span>{selectedUsers.length}</span> selected
					</div>
				</div>

				<div className="assign-users-list scrollbar-sleek">
					{loading ? (
						<div className="assign-users-state">Loading users...</div>
					) : filteredUsers.length > 0 ? (
						filteredUsers.map((user) => {
							const selected = selectedUsers.includes(user.id);
							const fullName = `${user.firstName ?? ""} ${
								user.lastName ?? ""
							}`.trim();

							return (
								<label
									key={user.id}
									className={`assign-user-row ${
										selected ? "assign-user-row-selected" : ""
									}`}
								>
									<span className="assign-user-avatar">
										<Avatar
											firstName={user.firstName}
											lastName={user.lastName}
										/>
									</span>

									<span className="assign-user-main">
										<span className="assign-user-name">{fullName || "--"}</span>

										<span className="assign-user-mobile-meta">
											{user.email ?? "--"}
										</span>
									</span>

									<span className="assign-user-meta assign-user-email">
										{user.email ?? "--"}
									</span>

									<span className="assign-user-meta assign-user-phone">
										{user.phone ?? "--"}
									</span>

									<span className="assign-user-check">
										<Checkbox
											checked={selected}
											onChange={() => toggleUser(user.id)}
										/>
									</span>
								</label>
							);
						})
					) : (
						<div className="assign-users-state">No users found</div>
					)}
				</div>
			</div>
		</Modal>
	);
};
