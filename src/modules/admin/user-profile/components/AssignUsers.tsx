import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "../../../../components/common/Modal";
import Button from "../../../../components/common/Button";
import { mapC4CEmployeeToUser, type User } from "../types/profile.types";
import { ServerAxios } from "../../../../services/ServerAxios";
import Avatar from "../../../../components/common/Avatar";
import { Badge } from "../../../../components/common/Badge";
import { SearchInput } from "../../../../components/FormElements/SearchInput";

type AssignProps = {
	open: boolean;
	onClose: () => void;
};

export const AssignUsers: React.FC<AssignProps> = ({ open, onClose }) => {
	const [users, setUsers] = useState<User[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState<string>("");

	useEffect(() => {
		if (!open) return;

		const loadUsers = async () => {
			try {
				setLoading(true);
				const response = await ServerAxios.get("/users/c4c-employees");
				const mappedUsers: User[] = response.data.map(mapC4CEmployeeToUser);
				setUsers(mappedUsers);
			} catch (err) {
				console.error("Failed to fetch users", err);
			} finally {
				setLoading(false);
			}
		};

		loadUsers();
	}, [open]);

	// Filter users
	const filteredUsers = useMemo(() => {
		return users.filter((user) =>
			user.firstName?.toLowerCase().includes(search.toLowerCase()),
		);
	}, [users, search]);
	const toggleUser = (id: string) => {
		setSelectedUsers((prev) =>
			prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
		);
	};

	return (
		<Modal open={open} onClose={onClose}>
			<div className="w-[1000px] max-h-[520px] flex flex-col mx-auto bg-white p-4 rounded-xl">
				{/* Header */}
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
						<span>👥</span> Assign Users
					</h2>
					<Badge variant="primary">Users</Badge>
				</div>
				{/* Search */}
				<div className="relative mb-4">
					<SearchInput value={search} onChange={setSearch} />
				</div>

				{/* Content */}
				<div className="space-y-2 overflow-y-auto p-6 flex-1">
					{loading ? (
						<p className="text-sm text-gray-400">Loading users...</p>
					) : (
						filteredUsers.map((user) => {
							const selected = selectedUsers.includes(user.id);

							return (
								<div
									key={user.id}
									onClick={() => toggleUser(user.id)}
									className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
										selected
											? "bg-amber-500/5 border-amber-500/30"
											: "bg-gray-100/40 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
									}`}
								>
									<div>
										<Avatar
											firstName={user.firstName}
											lastName={user.lastName}
										/>
									</div>

									<div className=" min-w-0">
										<p className="text-sm font-semibold truncate">
											{user.firstName} {user.lastName}
										</p>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs text-gray-500 truncate ">
											{user.email ?? "example@tatahitachi.co.in"}
										</p>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs text-gray-500 truncate">
											{user.jobRole ?? "User"}
										</p>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs text-gray-500 truncate">
											{user.phone ?? "914******7"}
										</p>
									</div>
									<div
										className={`w-5 h-5 rounded-md border flex items-center justify-center ${
											selected
												? "bg-amber-500 border-amber-500"
												: "border-gray-300"
										}`}
									>
										{selected && (
											<span className="text-white text-xs font-bold">✓</span>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Footer */}
				<div className="p-4 border-t flex justify-end gap-3">
					<Button text="Cancel" variant="primary" onClick={onClose} />
					<Button text="Assign Users" status="Brand" />
				</div>
			</div>
		</Modal>
	);
};
