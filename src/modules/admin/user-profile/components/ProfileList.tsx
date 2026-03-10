import React, { useState } from "react";
import { Edit, PlusIcon, Trash, UserPlus } from "lucide-react";
import { useAuth } from "../../../../context/Auth/useAuth";
import { ServerAxios } from "../../../../services/ServerAxios";
import Button from "../../../../components/common/Button";
import { Modal } from "../../../../components/common/Modal";
import { Alert } from "../../../../components/common/Alert";
import type { Profile } from "../types/profile.types";
import Avatar from "../../../../components/common/Avatar";
import { SearchInput } from "../../../../components/FormElements/SearchInput";
import { AssignUsers } from "./AssignUsers";
import { useToast } from "../../../../context/Auth/AuthContext";
import Popover from "../../../../components/common/Popover";

type ProfileListProps = {
	profiles: Profile[];
	onCreateNew: () => void;
	onEdit: (profile: Profile) => void;
	onDelete: (id: string) => void;
	onEditModal?: (id: string) => void;
	activeTab?: string;
	counts?: Record<string, number>;
	onTabChange?: (tab: string) => void;
	search: string;
	onSearchChange: (value: string) => void;
};

const ProfileList: React.FC<ProfileListProps> = ({
	profiles,
	onCreateNew,
	search,
	onSearchChange,
	onEdit,
	onDelete,
}) => {
	const { workspaceId } = useAuth();
	const { showToast } = useToast();
	const [deleteModal, setDeleteModal] = useState<Profile | null>(null);
	const [assignModalOpen, setAssignModalOpen] = useState<string | null>(null);

	const handleAssignUser = async (
		userIds: string[],
		profileId: string | null,
	): Promise<void> => {
		try {
			const {
				data: { message },
			} = await ServerAxios.post("/users/assign-profile", {
				userIds,
				profileId,
				workspaceId,
			});
			showToast({
				type: "success",
				title: "Success",
				description: message,
			});
		} catch (error) {
			console.error("Failed to assign users:", error);
		} finally {
			setAssignModalOpen(null);
		}
	};

	return (
		<>
			<div className="max-w-full mx-auto py-3 h-full  min-h-screen">
				<div className="flex justify-between my-6 px-3">
					<h2 className="text-2xl">User Profiles</h2>
					<div className="flex gap-2 items-center">
						<div className="">
							<div className="search">
								<SearchInput
									placeholder="Search ..."
									value={search}
									onChange={onSearchChange}
								/>
							</div>
						</div>
						<Button
							status="Brand"
							size="lg"
							text="New Profile"
							onClick={onCreateNew}
							Icon={PlusIcon}
						/>
					</div>
				</div>
				<div className="bg-white rounded-t-2xl mt-2 border border-gray-200 border-b-0 h-full text-gray-600">
					<div className="grid grid-cols-1  gap-4 mt-4">
						<div className="bg-white overflow-y-auto ">
							<table className="w-full text-sm">
								<thead className="bg-gray-100 ">
									<tr>
										<th className="px-6 py-4 text-left">Profile Name</th>
										<th className="px-6 py-4 text-left">Profile Description</th>
										<th className="px-6 py-4 text-left">User Count</th>
										<th className="px-6 py-4 text-left" colSpan={2}>
											Users
										</th>
										<th className="px-6 py-4 text-center">Actions</th>
									</tr>
								</thead>

								<tbody>
									{profiles.map((profile, idx) => (
										<tr
											key={profile.id || idx}
											className="border-t border-b border-gray-200 hover:bg-gray-50 transition text-left "
										>
											<td className="px-6 py-4  items-center gap-3">
												<h3 className="">{profile.name}</h3>
											</td>

											<td className="px-6 py-4 items-center">
												<p>{profile.description}</p>
											</td>
											<td className="px-6 py-4 items-center text-center">
												<p>{profile.assignedUserCount}</p>
											</td>
											<td
												className="px-6 py-4 col-span-2 items-center"
												colSpan={2}
											>
												<div className="flex items-center">
													{profile.users && profile.users.length > 0 ? (
														<>
															<div className="flex -space-x-2">
																{profile.users.slice(0, 3).map((user) => (
																	<div key={user.id}>
																		<Avatar
																			size="sm"
																			firstName={user.firstName}
																			lastName={user.lastName}
																			className="border-2 border-white rounded-full shadow-sm"
																			isTooltip={true}
																		/>
																	</div>
																))}
															</div>
															{profile.users.length > 3 && (
																<div className="ml-1 text-xs font-medium text-gray-500">
																	<Popover
																		placement="bottom-start"
																		trigger={
																			<Button
																				size="sm"
																				className="text-xs p-0 justify-center bg-transparent"
																			>
																				+ {profile.users.length - 3}
																			</Button>
																		}
																	>
																		<div className="flex flex-col gap-1 bg-white p-2 h-[100px] rounded-md overflow-auto ">
																			{profile.users.map((user) => (
																				<ul>
																					<li className="text-xs cursor-pointer hover:bg-zinc-100 px-1.5 py-1.5 rounded-md">
																						{user.firstName}, {""}
																						{user.lastName}
																					</li>
																				</ul>
																			))}
																		</div>
																	</Popover>
																</div>
															)}
														</>
													) : (
														<div className="text-gray-400 text-sm">
															No Users Assigned.
														</div>
													)}
												</div>
											</td>

											<td className="px-6 py-4 text-right items-center">
												<div className="flex gap-2	 justify-end">
													<Button
														size="sm"
														status="primary"
														onClick={() => setAssignModalOpen(profile.id)}
														Icon={UserPlus}
														isTooltip="Assign Users"
													/>
													<Button
														size="sm"
														Icon={Edit}
														variant="primary"
														onClick={() => onEdit(profile)}
														isTooltip="Edit"
													/>
													<Button
														size="sm"
														Icon={Trash}
														variant="danger"
														onClick={() => setDeleteModal(profile)}
														isTooltip="Delete"
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
			<Modal open={!!deleteModal} onClose={() => setDeleteModal(null)}>
				<Alert
					variant="warning"
					title="Delete Profile"
					description={`Are you sure you want to delete "${deleteModal?.name}"?`}
					primaryAction={{
						label: "Delete",
						onClick: () => {
							if (deleteModal) {
								onDelete(deleteModal.id);
								setDeleteModal(null);
							}
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setDeleteModal(null),
					}}
				/>
			</Modal>
			<AssignUsers
				profileId={assignModalOpen}
				onClose={() => setAssignModalOpen(null)}
				handleAssignUser={handleAssignUser}
			/>
		</>
	);
};

export default ProfileList;
