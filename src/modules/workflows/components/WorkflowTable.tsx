import React from "react";
import axios from "axios";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import { SearchInput } from "../../../components/forms/SearchInput";
import type { Option } from "../../../components/forms/input.types";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { useToast } from "../../../context/Auth/AuthContext";
import { useAuth } from "../../../context/Auth/useAuth";
import { ServerAxios } from "../../../services/ServerAxios";

import { api_routes, formatApps } from "../constant/workflow.constant";
import { useWorkflow } from "../context/useWorkflows";
import type { WorkflowRow } from "../types/workflow.types";
import type { UserResponse } from "../../admin/user-profile/types/profile.types";

import { workflowListFilterOptions } from "../constant/workflow.constant";
import { getWorkflowColumns } from "../utils/workflow.columns";
import { WorkflowUserAssignment } from "./WorkflowUserAssignment";
import { FilterTabs } from "../../../components/ui/FilterTabs";

const WORKFLOW_SKELETON_ROWS = 8;
const WORKFLOW_SKELETON_COLUMNS = 6;

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
type WorkflowFilter = "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";
type WorkflowTableProps = {
	selectedFilter: WorkflowFilter;
	onFilterChange: (value: WorkflowFilter) => void;
};
const WorkflowTable = ({
	selectedFilter,
	onFilterChange,
}: WorkflowTableProps) => {
	const {
		data,
		setData,
		search,
		setSearch,
		filters,
		setFilters,
		sorting,
		setSorting,
		pageIndex,
		pageSize,
		setPageIndex,
		setPageSize,
		totalPages,
		loading,
	} = useWorkflow();

	const { permissions } = useAuth();
	const { showToast } = useToast();
	const navigate = useNavigate();

	const [users, setUsers] = React.useState<Option[]>([]);

	const [assignModalOpen, setAssignModalOpen] =
		React.useState<WorkflowRow | null>(null);

	const [deleteModal, setDeleteModal] = React.useState<WorkflowRow | null>(
		null,
	);

	const [isAssigningUsers, setIsAssigningUsers] = React.useState(false);

	const [isDeleting, setIsDeleting] = React.useState(false);

	React.useEffect(() => {
		const controller = new AbortController();

		const fetchUsers = async (): Promise<void> => {
			try {
				const response = await ServerAxios.get("/users", {
					params: {
						profile: "all",
					},
					signal: controller.signal,
				});

				const responseData = response.data;

				const userList = Array.isArray(responseData)
					? responseData
					: Array.isArray(responseData?.data)
						? responseData.data
						: [];

				const formattedUsers = userList
					.map((user: UserResponse): Option | null => {
						if (!user.id) {
							return null;
						}

						const fullName = `${user.first_name ?? ""} ${
							user.last_name ?? ""
						}`.trim();

						return {
							value: user.id,
							label: fullName || "Unnamed user",
						};
					})
					.filter((user: any): user is Option => user !== null);

				setUsers(formattedUsers);
			} catch (error) {
				if (axios.isAxiosError(error) && error.code === "ERR_CANCELED") {
					return;
				}

				console.error("Failed to fetch users", error);
			}
		};

		void fetchUsers();

		return () => {
			controller.abort();
		};
	}, []);
	const filterTabs = React.useMemo(
		() =>
			workflowListFilterOptions.map((option) => ({
				value: option.value,
				label: option.label,
				tooltipLabel: option.tooltipLabel,
				Icon: option.Icon,
			})),
		[],
	);
	const apps = React.useMemo(() => formatApps(permissions), [permissions]);

	const handleFilterChange = React.useCallback(
		({ fieldName, value }: { fieldName?: string; value: Option[] }) => {
			if (!fieldName) return;

			setFilters((currentFilters) => ({
				...currentFilters,
				[fieldName]: value,
			}));

			setPageIndex(0);
		},
		[setFilters, setPageIndex],
	);

	const handleAssignUser = React.useCallback(
		async (userIds: string[], workflowId?: string): Promise<void> => {
			if (!workflowId) {
				showToast({
					type: "error",
					title: "Unable to assign users",
					description: "A valid workflow ID is required.",
				});

				return;
			}

			setIsAssigningUsers(true);

			try {
				const response = await ServerAxios.post(
					api_routes.create_assign_users_workflow_template,
					{
						userIds,
						templateId: workflowId,
					},
				);

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
					title: "Assignment failed",
					description: getErrorMessage(
						error,
						"Unable to assign users. Please try again.",
					),
				});
			} finally {
				setIsAssigningUsers(false);
			}
		},
		[showToast],
	);

	const handleEdit = React.useCallback(
		(workflow: WorkflowRow) => {
			if (!workflow.id) return;

			navigate(
				`/workflow/edit-workflows/${encodeURIComponent(String(workflow.id))}`,
			);
		},
		[navigate],
	);

	const handleOpenDelete = React.useCallback((workflow: WorkflowRow) => {
		setDeleteModal(workflow);
	}, []);

	const columns = React.useMemo(
		() =>
			getWorkflowColumns({
				onAssign: setAssignModalOpen,
				onEdit: handleEdit,
				onDelete: handleOpenDelete,
			}),
		[handleEdit, handleOpenDelete],
	);

	const handleDelete = React.useCallback(
		async (workflowId: string): Promise<void> => {
			setIsDeleting(true);

			try {
				const response = await ServerAxios.delete(
					`/work-flow/delete/${encodeURIComponent(workflowId)}`,
				);

				const message =
					typeof response.data?.message === "string"
						? response.data.message
						: "Workflow deleted successfully.";

				setData(data.filter((workflow) => workflow.id !== workflowId));

				showToast({
					type: "success",
					title: "Workflow deleted",
					description: message,
				});

				setDeleteModal(null);
			} catch (error) {
				showToast({
					type: "error",
					title: "Unable to delete workflow",
					description: getErrorMessage(error, "Failed to delete the workflow."),
				});
			} finally {
				setIsDeleting(false);
			}
		},
		[data, setData, showToast],
	);

	return (
		<>
			<Card
				title={
					<FilterTabs
						ariaLabel="Filter Workflow listings"
						items={filterTabs}
						value={selectedFilter}
						onChange={onFilterChange}
						className="border-b-none px-0 py-0"
					/>
				}
				secondaryHeader={
					<>
						<MultiSelectInput
							placeholder="Created By"
							options={users}
							name="createdBy"
							value={filters.createdBy}
							onValueChange={handleFilterChange}
							isSearchable
						/>
						<MultiSelectInput
							placeholder="Apps"
							options={apps}
							name="apps"
							value={filters.apps}
							onValueChange={handleFilterChange}
							isSearchable
						/>
						<SearchInput
							value={search}
							onChange={(value) => {
								setSearch(value);
								setPageIndex(0);
							}}
							placeholder="Search workflows"
							aria-label="Search workflows"
						/>

						<Button
							type="button"
							text="Create Workflow"
							Icon={Plus}
							iconPosition="left"
							iconSize={16}
							appearance="cta"
							variant="brand"
							size="sm"
							onClick={() => navigate("/workflow/create-workflows")}
						/>
					</>
				}
			>
				<section aria-label="Workflow records" aria-busy={loading}>
					{loading ? (
						<DataTableSkeleton
							rows={WORKFLOW_SKELETON_ROWS}
							columns={WORKFLOW_SKELETON_COLUMNS}
							showPagination
						/>
					) : (
						<DataTable<WorkflowRow>
							data={data}
							columns={columns}
							loading={false}
							sorting={sorting}
							onSortingChange={setSorting}
							manualSorting
							manualPagination
							pageIndex={pageIndex}
							pageSize={pageSize}
							pageCount={Math.max(totalPages, 1)}
							onPageChange={setPageIndex}
							onPageSizeChange={(nextPageSize) => {
								setPageSize(nextPageSize);
								setPageIndex(0);
							}}
							scrollTargetId="workflow-table-scroll"
							emptyTitle="No workflows found"
							emptyDescription="Create a workflow or adjust the current search and filters."
						/>
					)}
				</section>
			</Card>

			<WorkflowUserAssignment
				workflow={assignModalOpen}
				onClose={() => {
					if (!isAssigningUsers) {
						setAssignModalOpen(null);
					}
				}}
				handleAssignUser={handleAssignUser}
			/>

			<Modal
				open={Boolean(deleteModal)}
				onClose={() => {
					if (!isDeleting) {
						setDeleteModal(null);
					}
				}}
				mode="shell"
				size="sm"
				dialogRole="alertdialog"
				ariaLabel="Delete workflow confirmation"
			>
				<Alert
					variant="warning"
					title="Delete Workflow"
					description={`Are you sure you want to delete "${
						deleteModal?.name ?? "this workflow"
					}"?`}
					primaryAction={{
						label: isDeleting ? "Deleting..." : "Delete",
						onClick: () => {
							if (!deleteModal?.id || isDeleting) {
								return;
							}

							void handleDelete(String(deleteModal.id));
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => {
							if (!isDeleting) {
								setDeleteModal(null);
							}
						},
					}}
				/>
			</Modal>
		</>
	);
};

export default WorkflowTable;
