import React, { useEffect, useState } from "react";
import axios from "axios";

import Avatar from "../../../../components/common/Avatar";
import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import Checkbox from "../../../../components/forms/Checkbox";
import { SearchInput } from "../../../../components/forms/SearchInput";

import type { Profile, User } from "../types/profile.types";
import { usersApi } from "../../../../common/common.api";

type AssignProps = {
	profile: Profile | null;
	onClose: () => void;
	handleAssignUser: (
		userIds: string[],
		profileId: string | undefined,
	) => Promise<void>;
};

const SEARCH_DEBOUNCE_MS = 300;

export const AssignUsers: React.FC<AssignProps> = ({
	profile,
	onClose,
	handleAssignUser,
}) => {
	const [users, setUsers] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");

	const toggleUser = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id)
				? prev.filter((userId) => userId !== id)
				: [...prev, id],
		);
	};

	const handleAssign = async () => {
		await handleAssignUser(selectedUsers, profile?.id);
	};

	/*
	 * Initialize the selected users whenever the opened profile changes.
	 *
	 * Keep this separate from the user-fetching effect so a search request
	 * never resets selections the user has already made in the modal.
	 */
	useEffect(() => {
		if (!profile?.id) {
			setSelectedUsers([]);
			return;
		}

		setSelectedUsers(profile.users?.map((user) => user.id) ?? []);
	}, [profile?.id, profile?.users]);

	/*
	 * Backend search:
	 * - waits 300 ms after typing
	 * - sends `search` to /users
	 * - aborts the previous HTTP request when search changes
	 * - prevents stale responses from replacing newer results
	 */
	useEffect(() => {
		if (!profile?.id) {
			setUsers([]);
			return;
		}

		const controller = new AbortController();

		const timeoutId = window.setTimeout(async () => {
			try {
				setLoading(true);

				const result = await usersApi.getUsers({
					search,
					signal: controller.signal,
				});

				setUsers(result);
			} catch (error) {
				if (axios.isCancel(error) || controller.signal.aborted) {
					return;
				}

				console.error("Failed to fetch users", error);
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			window.clearTimeout(timeoutId);
			controller.abort();
		};
	}, [profile?.id, search]);

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
					) : users.length > 0 ? (
						users.map((user) => {
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
