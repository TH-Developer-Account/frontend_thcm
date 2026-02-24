import { PlusIcon } from "lucide-react";
import Button from "../../../components/common/Button";
import { Card } from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import { Alert } from "../../../components/common/Alert";
import type { Profile } from "./profile.types";
import { useState } from "react";
import { Badge } from "../../../components/common/Badge";

type ProfileListProps = {
	profiles: Profile[];
	onCreateNew: () => void;
	onEdit: (profile: Profile) => void;
	onDelete: (id: string) => void;
};

const ProfileList: React.FC<ProfileListProps> = ({
	profiles,
	onCreateNew,
	onEdit,
	onDelete,
}) => {
	const [deleteModal, setDeleteModal] = useState<Profile | null>(null);

	return (
		<>
			<div className="max-w-full mx-auto px-3 py-3">
				<div className="flex justify-between mb-6">
					<h2 className="text-2xl font-bold">Access Profiles</h2>

					<Button
						status="Brand"
						size="lg"
						text="New Profile"
						onClick={onCreateNew}
						Icon={PlusIcon}
					/>
				</div>

				<div className="grid grid-cols-1  gap-4">
					{profiles.map((profile) => (
						<Card key={profile.id} className="p-4">
							<div className="flex justify-between grid grid-cols-6 text-left gap-4 items-center">
								<h3 className="font-semibold">{profile.name}</h3>
								<div className="col-span-2">
									<p className="text-sm text-gray-500 ">
										{profile.description}
									</p>
								</div>

								<p className="text-sm text-gray-500">{profile.role}</p>
								<p className="text-sm text-gray-500">
									<Badge status={profile.status}>{profile.status}</Badge>
								</p>
								<div className="flex gap-2	 justify-end">
									<Button
										size="sm"
										text="Edit"
										variant="primary"
										onClick={() => onEdit(profile)}
									/>
									<Button
										size="sm"
										variant="danger"
										text="Delete"
										onClick={() => setDeleteModal(profile)}
									/>
								</div>
							</div>
						</Card>
					))}
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
		</>
	);
};

export default ProfileList;
