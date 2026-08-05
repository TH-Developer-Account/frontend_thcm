import React from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "../../../components/common/Alert";
import Button from "../../../components/common/Button";
import Card from "../../../components/common/Card";
import { Modal } from "../../../components/common/Modal";
import MultiSelectInput from "../../../components/forms/MultiSelectInput";
import { SearchInput } from "../../../components/forms/SearchInput";
import { FilterTabs } from "../../../components/ui/FilterTabs";
import DataTable from "../../../components/ui/tables/DataTable/DataTable";
import DataTableSkeleton from "../../../components/ui/tables/Skeletons/DataTableSkeleton";
import { useToast } from "../../../context/Auth/AuthContext";

import { getWorkflowErrorMessage } from "../api/workflow.api";
import { workflowListFilterOptions } from "../constant/workflow.constant";
import { useDeleteWorkflowMutation } from "../context/useWorkflowMutations";
import { useWorkflowListingPage } from "../hooks/useWorkflowListingPage";
import type { WorkflowListScope, WorkflowRow } from "../types/types";
import { getWorkflowColumns } from "../utils/workflow.columns";
import { WorkflowUserAssignment } from "./WorkflowUserAssignment";

const WORKFLOW_SKELETON_ROWS = 8;
const WORKFLOW_SKELETON_COLUMNS = 7;

const isUserCreatedWorkflow = (workflow: WorkflowRow | null): boolean =>
	workflow?.ownerType === "USER" || workflow?.ownerType === "ADMIN";

const getDeleteResponseMessage = (response: unknown): string => {
	if (
		typeof response !== "object" ||
		response === null ||
		Array.isArray(response)
	) {
		return "Workflow deleted successfully.";
	}

	const record = response as Record<string, unknown>;

	if (typeof record.message === "string") {
		return record.message;
	}

	if (
		typeof record.data === "object" &&
		record.data !== null &&
		!Array.isArray(record.data)
	) {
		const data = record.data as Record<string, unknown>;

		if (typeof data.message === "string") {
			return data.message;
		}
	}

	return "Workflow deleted successfully.";
};

const WorkflowTable = () => {
	const {
		data,
		loading,

		users,
		appOptions,

		searchInput,
		setSearchInput,

		selectedFilter,
		handleFilterChange,

		filters,
		handleAdvancedFilterChange,

		sorting,
		setSorting,

		pageIndex,
		pageSize,
		pageCount,

		handlePageChange,
		handlePageSizeChange,

		removeWorkflowFromList,
	} = useWorkflowListingPage();

	const { showToast } = useToast();
	const navigate = useNavigate();

	const [assignModalOpen, setAssignModalOpen] =
		React.useState<WorkflowRow | null>(null);

	const [deleteModal, setDeleteModal] = React.useState<WorkflowRow | null>(
		null,
	);

	const deleteMutation = useDeleteWorkflowMutation();

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

	const handleListFilterChange = React.useCallback(
		(value: WorkflowListScope) => {
			handleFilterChange(value);
		},
		[handleFilterChange],
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

	const handleOpenAssignment = React.useCallback((workflow: WorkflowRow) => {
		if (isUserCreatedWorkflow(workflow)) {
			return;
		}

		setAssignModalOpen(workflow);
	}, []);

	const handleOpenDelete = React.useCallback((workflow: WorkflowRow) => {
		setDeleteModal(workflow);
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
				const response = await deleteMutation.mutateAsync(workflowId);

				removeWorkflowFromList(workflowId);

				showToast({
					type: "success",
					title: "Workflow deleted",
					description: getDeleteResponseMessage(response),
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
		[deleteMutation, removeWorkflowFromList, showToast],
	);

	return (
		<>
			<Card
				title={
					<FilterTabs
						ariaLabel="Filter workflow listings"
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
							value={filters.createdBy ?? []}
							onValueChange={handleAdvancedFilterChange}
							isSearchable
						/>

						<MultiSelectInput
							placeholder="Apps"
							options={appOptions}
							name="apps"
							value={filters.apps ?? []}
							onValueChange={handleAdvancedFilterChange}
							isSearchable
						/>

						<SearchInput
							value={searchInput}
							onChange={setSearchInput}
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
							pageCount={pageCount}
							onPageChange={handlePageChange}
							onPageSizeChange={handlePageSizeChange}
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
