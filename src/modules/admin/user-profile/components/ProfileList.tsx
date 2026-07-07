import React from "react";
import axios from "axios";
import { Plus } from "lucide-react";

import { Alert } from "../../../../components/common/Alert";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { Modal } from "../../../../components/common/Modal";
import { SearchInput } from "../../../../components/forms/SearchInput";
import DataTable from "../../../../components/ui/DataTable";
import DataTableSkeleton from "../../../../components/ui/DataTableSkeleton";
import { useAuth } from "../../../../context/Auth/useAuth";
import { useToast } from "../../../../context/Auth/AuthContext";
import { ServerAxios } from "../../../../services/ServerAxios";

import type { Profile } from "../types/profile.types";

import { AssignUsers } from "./AssignUsers";
import { getProfileColumns } from "../utils/profile.columns";

type ProfileListProps = {
	profiles: Profile[];
	search: string;
	onSearchChange: (value: string) => void;
	onCreateNew: () => void;
	onEdit: (profile: Profile) => void;
	onDelete: (id: string) => void;
	isLoading?: boolean;
	isFetching?: boolean;
	isError?: boolean;
};

const PROFILE_SKELETON_ROWS = 8;
const PROFILE_SKELETON_COLUMNS = 5;

const getErrorMessage = (error: unknown, fallback: string): string => {
	if (axios.isAxiosError(error)) {
		const responseData = error.response?.data as
			| {
					message?: unknown;
					error?: unknown;
			  }
			| undefined;

		if (
			typeof responseData?.message === "string" &&
			responseData.message.trim()
		) {
			return responseData.message;
		}

		if (typeof responseData?.error === "string" && responseData.error.trim()) {
			return responseData.error;
		}
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return fallback;
};

const ProfileList = ({
	profiles,
	search,
	onSearchChange,
	onCreateNew,
	onEdit,
	onDelete,
	isLoading = false,
	isFetching = false,
	isError = false,
}: ProfileListProps) => {
	const { workspaceId } = useAuth();
	const { showToast } = useToast();

	const [deleteModal, setDeleteModal] = React.useState<Profile | null>(null);

	const [assignModalOpen, setAssignModalOpen] = React.useState<Profile | null>(
		null,
	);

	const [isAssigningUsers, setIsAssigningUsers] = React.useState(false);

	const handleAssignUser = React.useCallback(
		async (userIds: string[], profileId: string | undefined): Promise<void> => {
			if (!profileId) {
				showToast({
					type: "error",
					title: "Unable to assign users",
					description: "A valid profile ID is required.",
				});

				return;
			}

			setIsAssigningUsers(true);

			try {
				const response = await ServerAxios.post("/users/assign-profile", {
					userIds,
					profileId,
					workspaceId,
				});

				const message =
					typeof response.data?.message === "string"
						? response.data.message
						: "Users assigned successfully.";

				showToast({
					type: "success",
					title: "Users assigned",
					description: message,
				});

				setAssignModalOpen(null);
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to assign users",
					description: getErrorMessage(
						error,
						"Failed to assign users to this profile.",
					),
				});
			} finally {
				setIsAssigningUsers(false);
			}
		},
		[showToast, workspaceId],
	);

	const columns = React.useMemo(
		() =>
			getProfileColumns({
				onAssignUsers: setAssignModalOpen,
				onEdit,
				onDelete: setDeleteModal,
			}),
		[onEdit],
	);

	const tableData = React.useMemo(
		() => (Array.isArray(profiles) ? profiles : []),
		[profiles],
	);

	return (
		<>
			<Card
				className="profile-listing-card"
				secondaryHeaderClassName="profile-listing-toolbar"
				secondaryHeader={
					<>
						<SearchInput
							value={search}
							onChange={onSearchChange}
							placeholder="Search profiles"
							aria-label="Search profiles"
						/>

						<Button
							type="button"
							text="New Profile"
							Icon={Plus}
							iconPosition="left"
							iconSize={16}
							appearance="cta"
							variant="brand"
							size="sm"
							onClick={onCreateNew}
						/>
					</>
				}
			>
				<section
					className="profile-listing-table"
					aria-label="User profiles"
					aria-busy={isLoading || isFetching}
				>
					{isLoading ? (
						<DataTableSkeleton
							rows={PROFILE_SKELETON_ROWS}
							columns={PROFILE_SKELETON_COLUMNS}
							showPagination
						/>
					) : isError ? (
						<div className="profile-listing-state">
							<Alert
								type="banner"
								variant="error"
								title="Unable to load profiles"
								description="The profile listing could not be retrieved. Refresh the page or try again."
							/>
						</div>
					) : (
						<DataTable<Profile>
							data={tableData}
							columns={columns}
							manualSorting={false}
							manualPagination={false}
							scrollTargetId="profile-listing-table-scroll"
							emptyTitle="No profiles found"
							emptyDescription={
								search.trim()
									? "No profiles match the current search."
									: "Create a profile to configure permissions and assign users."
							}
						/>
					)}

					{isFetching && !isLoading ? (
						<span className="sr-only" role="status" aria-live="polite">
							Refreshing user profiles
						</span>
					) : null}
				</section>
			</Card>

			<Modal
				open={Boolean(deleteModal)}
				onClose={() => setDeleteModal(null)}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Delete profile confirmation"
			>
				<Alert
					type="box"
					variant="warning"
					title="Delete Profile"
					description={`Are you sure you want to delete "${
						deleteModal?.name ?? "this profile"
					}"?`}
					primaryAction={{
						label: "Delete",
						onClick: () => {
							if (!deleteModal) return;

							onDelete(deleteModal.id);
							setDeleteModal(null);
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => setDeleteModal(null),
					}}
				/>
			</Modal>

			<AssignUsers
				profile={assignModalOpen}
				onClose={() => {
					if (!isAssigningUsers) {
						setAssignModalOpen(null);
					}
				}}
				handleAssignUser={handleAssignUser}
			/>
		</>
	);
};

export default ProfileList;
