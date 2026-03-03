import { PlusIcon } from "lucide-react";
import Button from "../../../components/common/Button";
import { Modal } from "../../../components/common/Modal";
import { Alert } from "../../../components/common/Alert";
import type { Profile } from "./profile.types";
import { useState } from "react";
import { Badge } from "../../../components/common/Badge";
import Avatar from "../../../components/common/Avatar";
import { capitalize, formatRole } from "../../../utils/format";

type ProfileListProps = {
	profiles: Profile[];
	onCreateNew: () => void;
	onEdit: (profile: Profile) => void;
	onDelete: (id: string) => void;
	onEditModal?: (id: string) => void;
	activeTab?: string;
	counts?: Record<string, number>;
	onTabChange?: (tab: string) => void;
};

const ProfileList: React.FC<ProfileListProps> = ({
	profiles,
	onCreateNew,
	onEdit,
	onDelete,
	onEditModal,
}) => {
	const [deleteModal, setDeleteModal] = useState<Profile | null>(null);
	const [editModal, setEditModal] = useState<Profile | null>(null);

	return (
		<>
			<div className="max-w-full mx-auto py-3 h-full  min-h-screen">
				<div className="flex justify-between my-6 px-3">
					<h2 className="text-2xl">User Profiles</h2>

					<Button
						status="Brand"
						size="lg"
						text="New Profile"
						onClick={onCreateNew}
						Icon={PlusIcon}
					/>
				</div>
				<div className="bg-white rounded-t-2xl mt-4 border border-gray-200 border-b-0 h-full pt-2">
					<div className="flex items-center gap-8 px-6 pt-5 border-b border-gray-200">
						<button className="relative pb-4 text-sm font-medium transition cursor-pointer text-center">
							<span className="text-gray-900 mr-1">All</span>
							<Badge status="Active">5</Badge>
							<div className="absolute left-0 -bottom-[1px] w-full h-[2px] bg-gray-900 rounded-full" />
						</button>
						<button className="relative pb-4 text-sm font-medium transition cursor-pointer text-center">
							<span className="text-gray-900 mr-1">Admin</span>
							<Badge status="Inactive">3</Badge>
						</button>
						<button className="relative pb-4 text-sm font-medium transition cursor-pointer text-center">
							<span className="text-gray-900 mr-1">Super Admin</span>
							<Badge status="Blocked">3</Badge>
						</button>
					</div>
					<div className="grid grid-cols-1  gap-4 mt-4">
						<div className="bg-white overflow-y-auto ">
							<table className="w-full text-sm">
								<thead className="bg-gray-100 text-gray-600">
									<tr>
										<th className="px-6 py-4 text-left">Profile Name</th>
										<th className="px-6 py-4 text-left">Profile Description</th>
										{/* <th className="px-6 py-4 text-left">Role</th>
										<th className="px-6 py-4 text-left">Status</th> */}
										<th className="px-6 py-4 text-left" colSpan={2}>
											Users
										</th>
										<th className="px-6 py-4 text-center">Actions</th>
									</tr>
								</thead>

								<tbody>
									{profiles.map((profile) => (
										<tr
											key={profile.id}
											className="border-t border-b border-gray-200 hover:bg-gray-50 transition text-left "
										>
											<td className="px-6 py-4  items-center gap-3">
												<h3 className="">{profile.name}</h3>
											</td>

											<td className="px-6 py-4 items-center">
												<p>{profile.description}</p>
											</td>
											<td
												className="px-6 py-4 col-span-2 items-center"
												colSpan={2}
											>
												<div className="flex gap-2 justify-start">
													{profile.assignedUsers ? (
														profile.assignedUsers?.map((user) => (
															<div key={user} className=" text-left">
																<Avatar size="xs" firstName={user} />
															</div>
														))
													) : (
														<div className="flex flex-col sm:flex-row sm:items-end">
															<div className="flex -space-x-1">
																<Avatar
																	size="xs"
																	firstName="John"
																	lastName="Doe"
																	className="outline-ring-1 outline outline-white "
																/>
																<Avatar
																	size="xs"
																	firstName="John"
																	lastName="Doe"
																/>
																<Avatar
																	size="xs"
																	firstName="John"
																	lastName="Doe"
																/>
																<Avatar
																	size="xs"
																	firstName="John"
																	lastName="Doe"
																/>
																<Avatar
																	size="xs"
																	firstName="John"
																	lastName="Doe"
																/>
																<Avatar
																	size="xs"
																	firstName="John"
																	lastName="Doe"
																/>
															</div>
														</div>
													)}
												</div>
											</td>

											<td className="px-6 py-4 text-right items-center">
												<div className="flex gap-2	 justify-end">
													<Button
														size="sm"
														text="Edit"
														variant="primary"
														// onClick={() => setEditModal(profile)}
														onClick={() => onEdit(profile)}
													/>
													<Button
														size="sm"
														variant="danger"
														text="Delete"
														onClick={() => setDeleteModal(profile)}
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
			<Modal open={!!editModal} onClose={() => setEditModal(null)}>
				<Alert
					variant="warning"
					title="Delete Profile"
					description={`Are you sure you want to delete "${editModal?.name}"?`}
					primaryAction={{
						label: "Delete",
						onClick: () => {
							if (deleteModal) {
								onEditModal(editModal.id);
								setEditModal(null);
							}
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setEditModal(null),
					}}
				/>
			</Modal>
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
		</>
	);
};

export default ProfileList;
