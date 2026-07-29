import React from "react";
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
import { formatApps } from "../constant/workflow.constant";
import { useWorkflow } from "../context/useWorkflows";
import type { WorkflowRow } from "../types/types";
import { workflowListFilterOptions } from "../constant/workflow.constant";
import { getWorkflowColumns } from "../utils/workflow.columns";
import { WorkflowUserAssignment } from "./WorkflowUserAssignment";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import { getWorkflowErrorMessage } from "../api/workflow.api";
import { useDeleteWorkflowMutation } from "../context/useWorkflowMutations";

const WORKFLOW_SKELETON_ROWS = 8;
const WORKFLOW_SKELETON_COLUMNS = 6;

type WorkflowFilter = "ALL" | "ASSIGNED_TO_ME" | "CREATED_BY_ME";
type WorkflowTableProps = {
	selectedFilter?: WorkflowFilter;
	onFilterChange?: (value: WorkflowFilter) => void;
};

const isUserCreatedWorkflow = (workflow: WorkflowRow | null): boolean =>
	workflow?.workflowType?.toUpperCase() === "USERCREATED";

const WorkflowTable = ({
	selectedFilter: selectedFilterProp,
	onFilterChange,
}: WorkflowTableProps) => {
	const [localFilter, setLocalFilter] = React.useState<WorkflowFilter>("ALL");
	const selectedFilter = selectedFilterProp ?? localFilter;
	const handleListFilterChange = onFilterChange ?? setLocalFilter;
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

	const deleteMutation = useDeleteWorkflowMutation();

	React.useEffect(() => {
		const fetchUsers = async (): Promise<void> => {
			try {
				const { workflowApi } = await import("../api/workflow.api");
				setUsers(await workflowApi.getUserOptions());
			} catch (error) {
				console.error("Failed to fetch users", error);
			}
		};

		void fetchUsers();
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

	const handleOpenAssignment = React.useCallback((workflow: WorkflowRow) => {
		if (isUserCreatedWorkflow(workflow)) return;
		setAssignModalOpen(workflow);
	}, []);

	const columns = React.useMemo(
		() =>
			getWorkflowColumns({
				onAssign: handleOpenAssignment,
				onEdit: handleEdit,
				onDelete: handleOpenDelete,
			}),
		[handleEdit, handleOpenAssignment, handleOpenDelete],
	);

	const handleDelete = React.useCallback(
		async (workflowId: string): Promise<void> => {
			try {
				const response = (await deleteMutation.mutateAsync(workflowId)) as {
					message?: string;
				};

				const message =
					typeof response?.message === "string"
						? response.message
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
					description: getWorkflowErrorMessage(
						error,
						"Failed to delete the workflow.",
					),
				});
			}
		},
		[data, deleteMutation, setData, showToast],
	);

	return (
		<>
			<Card
				title={
					<FilterTabs
						ariaLabel="Filter Workflow listings"
						items={filterTabs}
						value={selectedFilter}
						onChange={handleListFilterChange}
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

			{assignModalOpen && !isUserCreatedWorkflow(assignModalOpen) ? (
				<WorkflowUserAssignment
					workflow={assignModalOpen}
					onClose={() => setAssignModalOpen(null)}
				/>
			) : null}

			<Modal
				open={Boolean(deleteModal)}
				onClose={() => {
					if (!deleteMutation.loading) {
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
						label: deleteMutation.loading ? "Deleting..." : "Delete",
						onClick: () => {
							if (!deleteModal?.id || deleteMutation.loading) {
								return;
							}

							void handleDelete(String(deleteModal.id));
						},
					}}
					secondaryAction={{
						label: "Cancel",
						onClick: () => {
							if (!deleteMutation.loading) {
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
